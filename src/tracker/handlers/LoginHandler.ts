import * as Promise from "bluebird";
import {Authentication} from "../../util/Authentication";
import {AuthenticationError} from "../Exceptions";
import {NoSuchUserError} from "../Exceptions";
import {Message} from "../packets/Messages";
import {LoginMessage} from "../packets/Messages";
import {LoginReply} from "../packets/Messages";
import {DuplicateLoginRequest} from "../packets/Messages";
import {DuplicateLoginReply} from "../packets/Messages";
import {Session} from "../Session";
import {IHandlerContext} from "./Handlers";

export function handleLoginMessage(message: Message, context: IHandlerContext): Promise<void> {
    const msg = message as LoginMessage;

    if (context.Client.Authenticated) {
        context.Client.RemotePort = msg.Port; // Update the port using the message
        context.Logger.warn("User %s is already logged in! Tried to log in again.", msg.Username);
        return context.Client.User.countPilots().then((count) => {
            // Send a message telling the client that the login was successful
            return context.Client.sendToClient(new LoginReply(true, context.Client.Session.Id, count));
        });
    }

    // This code handles authentication and setup of this client instance based on the data sent to us.
    // This is done in the following steps:
    // 1. Retrieve data for the user name from the DB
    // 2. If user is present, check login
    // 3. If login is valid, create a session
    // 4. Set session data for this instance and send successful reply so client

    context.Logger.info("Authenticating user %s...", msg.Username);
    const userP = context.Database.getUserByName(msg.Username);

    return userP.then((user) => {
        if (user == null) {
            // If there is no such user then reject the login
            throw new NoSuchUserError(msg.Username);
        } else {
            // Check the password we got against the database data
            return Authentication.verifyPassword(user, msg.Password);
        }
    }).then((valid) => {
        context.Client.Authenticated = valid;
        if (!valid) {
            // If not valid then throw an error
            throw new AuthenticationError();
        }

        context.Client.User = userP.value();
        context.Logger.info("Client successfully authenticated");

        if (context.Client.Session) {
            context.Logger.warn("Client was not authenticated but had a session! Probably a coding error!");
            // Client re-authenticated itself, this should not be able to happen but why not return the session then?
            return Promise.resolve(context.Client.Session);
        } else {
            // Create a session and send the generated id
            return Session.createSession();
        }
    }).then((session) => {
        context.Client.Session = session;
        return context.Database.updateLastLogin(context.Client.User);
    }).then(() => {
        context.Client.OnlineUser = context.Database.createOnlineUser(context.Client.getOnlineUserData());
        return context.Client.OnlineUser.save();
    }).then(() => {
        return context.Client.OnlineUser.setUser(context.Client.User);
    }).then(() => {
        return context.Client.User.countPilots();
    }).then((count) => {
        context.Client.RemotePort = msg.Port; // Update the port using the message
        // Send a message telling the client that the login was successful
        return context.Client.sendToClient(new LoginReply(true, context.Client.Session.Id, count));
    }).catch(NoSuchUserError, () => {
        // User isn't known
        return context.Client.sendToClient(new LoginReply(false, -1, -1));
    }).catch(AuthenticationError, () => {
        // Wrong password
        return context.Client.sendToClient(new LoginReply(false, -1, -1));
    }).catch((err) => {
        context.Logger.error("Error while authenticating User!", err);
        return context.Client.sendToClient(new LoginReply(false, -1, -1));
    });
}

export function handleDuplicateLoginMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client checking for duplicate logins");

    const msg = message as DuplicateLoginRequest;

    if (!context.Client.Session.isValid(msg.SessionId)) {
        return context.Client.sendToClient(new DuplicateLoginReply(true)); // Invalid Session id!
    }

    return context.Client.User.getOnlineUsers().then((onlineUsers) => {
        let count = 0;
        for (const online of onlineUsers) {
            for (const id of msg.IDs) {
                if (online.SessionId === id) {
                    ++count;
                }
            }
        }

        return context.Client.sendToClient(new DuplicateLoginReply(count !== 1));
    });
}
