import {Message} from "../packets/Messages";
import {PilotReply} from "../packets/Messages";
import {GetPilotMessage} from "../packets/Messages";
import {UpdatePilotMessage} from "../packets/Messages";
import {PilotUpdateReply} from "../packets/Messages";
import {IHandlerContext} from "./Handlers";

export async function handleGetPilotMessage(message: Message, context: IHandlerContext): Promise<void> {
    const msg = message as GetPilotMessage;

    context.Logger.info("Client has requested pilot data");

    let client = context.Client;
    let sessId = msg.SessionId;

    // -2 means we are looking for another player
    if (sessId === -2) {
        client = context.Server.getClientFromPilot(msg.Pilotname);

        if (client != null) {
            sessId = client.Session.Id;
        }
    }

    if (client == null) {
        await context.Client.sendToClient(new PilotReply(2));
        return;
    }

    if (!client.Session.isValid(sessId)) {
        await context.Client.sendToClient(new PilotReply(3));
        return;
    }

    if (msg.CreatePilot) {
        client.Session.ActivePilot = msg.Pilotname;
    }

    const pilot = await context.Database.getPilot(client.User, msg.Pilotname);
    try {
        if (pilot) {
            await context.Client.sendToClient(new PilotReply(0, pilot));
            return;
        } else if (msg.CreatePilot) {
            const dbPilot = context.Database.createPilot({
                                                             PilotName: msg.Pilotname,
                                                         });

            await dbPilot.save();

            await dbPilot.setUser(client.User);

            await context.Client.sendToClient(new PilotReply(1));
        } else {
            // WARNING: The original fs2netd didn't handle this case properly and sent status 0 which is wrong
            // This probably can't happen but a status of 5 should signify an error for FSO
            await context.Client.sendToClient(new PilotReply(5));
        }
    } catch (err) {
        context.Logger.error("Error while retrieving pilot!", err);
        await context.Client.sendToClient(new PilotReply(4));
    }
}

export async function handleUpdatePilotMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client wants to update pilot data");

    const msg = message as UpdatePilotMessage;

    if (!context.Client.Session.isValid(msg.SessionId)) {
        await context.Client.sendToClient(new PilotUpdateReply(2)); // Session not valid
        return;
    }

    if (context.Client.User.Username !== msg.UserName) {
        await context.Client.sendToClient(new PilotUpdateReply(2)); // Username not valid
        return;
    }

    const pilot = await context.Database.getPilot(context.Client.User, msg.PilotData.PilotName);

    if (!pilot) {
        return context.Client.sendToClient(new PilotUpdateReply(1)); // No such pilot
    }

    await pilot.set(msg.PilotData).save();

    await context.Client.sendToClient(new PilotUpdateReply(0)); // Update was successful
}
