import {HandlerContext} from "./Handlers";
import {Message} from "../Messages";

import {NoSuchUserError} from "../Exceptions";
import {Authentication} from "../Authentication";
import {AuthenticationError} from "../Exceptions";
import {LoginMessage} from "../Messages";
import {Session} from "../Session";
import {LoginReply} from "../Messages";

export function handleLoginMessage(message: Message, context: HandlerContext): Promise<void> {
    let msg = <LoginMessage>message;

    if (context.Client.Authenticated) {
        context.Logger.warn("User %s is already logged in! Tried to log in again.", msg.Username);
        return Promise.resolve();
    }

    // This code handles authentication and setup of this client instance based on the data sent to us.
    // This is done in the following steps:
    // 1. Retrieve data for the user name from the DB
    // 2. If user is present, check login
    // 3. If login is valid, create a session
    // 4. Set session data for this instance and send successful reply so client

    context.Logger.info("Authenticating user %s...", msg.Username);
    let userP = context.Database.getUserByName(msg.Username);

    let numPilotsP = userP.then(user => {
        if (user == null) {
            // If there is no such user then reject the login
            throw new NoSuchUserError(msg.Username);
        } else {
            // Check the password we got against the database data
            return Authentication.verifyPassword(user, msg.Password);
        }
    }).then(valid => {
        context.Client.Authenticated = valid;
        if (!valid) {
            // If not valid then throw an error
            throw new AuthenticationError();
        }

        context.Client.User = userP.value();
        context.Logger.info("Client successfully authenticated");

        if (context.Client.Session != null) {
            // Client re-authenticated itself
            return Promise.resolve(context.Client.Session);
        } else {
            // Create a session and send the generated id
            return Session.createSession();
        }
    }).then(session => {
        context.Client.Session = session;
        return context.Database.updateLastLogin(context.Client.User);
    }).then(() => {
        context.Client.OnlineUser = context.Database.createOnlineUser(context.Client.getOnlineUserData());
        return context.Client.OnlineUser.save();
    }).then(_ => {
        return context.Client.OnlineUser.setUser(context.Client.User);
    }).then(_ => {
        return context.Client.User.countPilots();
    });

    return numPilotsP.then(() => {
        // Send a message telling the client that the login was successful
        return context.Client.sendToClient(new LoginReply(true, context.Client.Session.Id, numPilotsP.value()));
    }).catch(NoSuchUserError, () => {
        // User isn't known
        context.Client.sendToClient(new LoginReply(false, -1, -1));
        return null;
    }).catch(AuthenticationError, () => {
        // Wrong password
        context.Client.sendToClient(new LoginReply(false, -1, -1));
        return null;
    }).catch(err => {
        context.Logger.error("Error while authenticating User!", err);
        context.Client.sendToClient(new LoginReply(false, -1, -1));
        return null;
    });
}
