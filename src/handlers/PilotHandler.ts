import {HandlerContext} from "./Handlers";
import {Message} from "../packets/Messages";
import {PilotReply} from "../packets/Messages";
import {GameClient} from "../GameClient";
import {GetPilotMessage} from "../packets/Messages";

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