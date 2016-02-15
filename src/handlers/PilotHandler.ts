import {HandlerContext} from "./Handlers";
import {Message} from "../packets/Messages";
import {PilotReply} from "../packets/Messages";
import {GameClient} from "../GameClient";
import {GetPilotMessage} from "../packets/Messages";
import {UpdatePilotMessage} from "../packets/Messages";
import {PilotUpdateReply} from "../packets/Messages";

export function handleGetPilotMessage(message: Message, context: HandlerContext): Promise<void> {
    let msg = <GetPilotMessage>message;

    context.Logger.info("Client has requested pilot data");

    let client: GameClient = context.Client;
    let sessId = msg.SessionId;

    if (sessId == -2) {
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

    return context.Database.pilotExists(client.User, msg.Pilotname).then(exists => {
        if (exists) {
            return context.Database.getPilot(client.User, msg.Pilotname).then(pilot => {
                // pilot could be null if there is no such pilot but then exists would be false
                return context.Client.sendToClient(new PilotReply(0, pilot));
            });
        } else {
            let pilot = context.Database.createPilot({
                PilotName: msg.Pilotname
            });

            return pilot.save().then(_ => {
                return pilot.setUser(client.User);
            }).then(_ => {
                return context.Client.sendToClient(new PilotReply(1));
            });
        }
    });
}

export function handleUpdatePilotMessage(message: Message, context: HandlerContext): Promise<void> {
    context.Logger.info("Client wants to update pilot data");

    let msg = <UpdatePilotMessage>message;

    if (!context.Client.Session.isValid(msg.SessionId)) {
        return context.Client.sendToClient(new PilotUpdateReply(2)); // Session not valid
    }

    // The original fs2netd uses the user name from the message but that seems like a bad idea...
    return context.Database.pilotExists(context.Client.User, msg.PilotData.PilotName).then(exists => {
        if (!exists) {
            return context.Client.sendToClient(new PilotUpdateReply(1)); // No such pilot
        }

        return context.Database.getPilot(context.Client.User, msg.PilotData.PilotName).then(pilot => {
            return pilot.set(msg.PilotData).save();
        }).then(() => {
            return context.Client.sendToClient(new PilotUpdateReply(0)); // Update was successful
        });
    });
}
