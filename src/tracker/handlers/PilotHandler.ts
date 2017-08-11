import * as Promise from "bluebird";
import {Message} from "../packets/Messages";
import {PilotReply} from "../packets/Messages";
import {GetPilotMessage} from "../packets/Messages";
import {UpdatePilotMessage} from "../packets/Messages";
import {PilotUpdateReply} from "../packets/Messages";
import {IHandlerContext} from "./Handlers";

export function handleGetPilotMessage(message: Message, context: IHandlerContext): Promise<void> {
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
        return context.Client.sendToClient(new PilotReply(2));
    }

    if (!client.Session.isValid(sessId)) {
        return context.Client.sendToClient(new PilotReply(3));
    }

    if (msg.CreatePilot) {
        client.Session.ActivePilot = msg.Pilotname;
    }

    return context.Database.getPilot(client.User, msg.Pilotname).then((pilot) => {
        if (pilot) {
            return context.Client.sendToClient(new PilotReply(0, pilot));
        } else if (msg.CreatePilot) {
            const dbPilot = context.Database.createPilot({
                                                         PilotName: msg.Pilotname,
                                                     });

            return dbPilot.save().then(() => {
                return dbPilot.setUser(client.User);
            }).then(() => {
                return context.Client.sendToClient(new PilotReply(1));
            });
        } else {
            // WARNING: The original fs2netd didn't handle this case properly and sent status 0 which is wrong
            // This probably can't happen but a status of 5 should signify an error for FSO
            return context.Client.sendToClient(new PilotReply(5));
        }
    }).catch((err) => {
        context.Logger.error("Error while retrieving pilot!", err);
        return context.Client.sendToClient(new PilotReply(4));
    });
}

export function handleUpdatePilotMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client wants to update pilot data");

    const msg = message as UpdatePilotMessage;

    if (!context.Client.Session.isValid(msg.SessionId)) {
        return context.Client.sendToClient(new PilotUpdateReply(2)); // Session not valid
    }

    if (context.Client.User.Username !== msg.UserName) {
        return context.Client.sendToClient(new PilotUpdateReply(2)); // Username not valid
    }

    // The original fs2netd uses the user name from the message but that seems like a bad idea...
    return context.Database.getPilot(context.Client.User, msg.PilotData.PilotName).then((pilot) => {
        if (!pilot) {
            return context.Client.sendToClient(new PilotUpdateReply(1)); // No such pilot
        }

        return pilot.set(msg.PilotData).save().then(() => {
            return context.Client.sendToClient(new PilotUpdateReply(0)); // Update was successful
        });
    });
}
