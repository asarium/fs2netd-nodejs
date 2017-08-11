import {Authentication} from "../../util/Authentication";
import {Message} from "../packets/Messages";
import {LoginMessage} from "../packets/Messages";
import {LoginReply} from "../packets/Messages";
import {DuplicateLoginRequest} from "../packets/Messages";
import {DuplicateLoginReply} from "../packets/Messages";
import {Session} from "../Session";
import {IHandlerContext} from "./Handlers";

export async function handleLoginMessage(message: Message, context: IHandlerContext): Promise<void> {
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
    const user = await context.Database.getUserByName(msg.Username);

    if (user == null) {
        // If there is no such user then reject the login
        return context.Client.sendToClient(new LoginReply(false, -1, -1));
    }
    try {
        // Check the password we got against the database data
        const valid = await Authentication.verifyPassword(user, msg.Password);

        context.Client.Authenticated = valid;
        if (!valid) {
            // Wrong password
            await context.Client.sendToClient(new LoginReply(false, -1, -1));
            return;
        }

        context.Client.User = user;
        context.Logger.info("Client successfully authenticated");

        let session: Session;
        if (context.Client.Session) {
            context.Logger.warn("Client was not authenticated but had a session! Probably a coding error!");
            // Client re-authenticated itself, this should not be able to happen but why not return the session then?
            session = context.Client.Session;
        } else {
            // Create a session and send the generated id
            session = await Session.createSession();
        }

        context.Client.Session = session;
        await context.Database.updateLastLogin(context.Client.User);

        context.Client.OnlineUser = context.Database.createOnlineUser(context.Client.getOnlineUserData());
        await context.Client.OnlineUser.save();

        await context.Client.OnlineUser.setUser(context.Client.User);

        const pilotCount = await context.Client.User.countPilots();

        context.Client.RemotePort = msg.Port; // Update the port using the message
        // Send a message telling the client that the login was successful
        await context.Client.sendToClient(new LoginReply(true, context.Client.Session.Id, pilotCount));
    } catch (err) {
        context.Logger.error("Error while authenticating User!", err);
        return context.Client.sendToClient(new LoginReply(false, -1, -1));
    }
}

export async function handleDuplicateLoginMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client checking for duplicate logins");

    const msg = message as DuplicateLoginRequest;

    if (!context.Client.Session.isValid(msg.SessionId)) {
        await context.Client.sendToClient(new DuplicateLoginReply(true)); // Invalid Session id!
    }

    const onlineUsers = await context.Client.User.getOnlineUsers();
    let count         = 0;
    for (const online of onlineUsers) {
        for (const id of msg.IDs) {
            if (online.SessionId === id) {
                ++count;
            }
        }
    }

    await context.Client.sendToClient(new DuplicateLoginReply(count !== 1));
}
