import {HandlerContext} from "./Handlers";
import {Message} from "../Messages";
import {PilotReply} from "../Messages";
import {GameClient} from "../GameClient";
import {GetPilotMessage} from "../Messages";

export function handleGetPilotMessage(message: Message, context: HandlerContext): Promise<void> {
    let msg = <GetPilotMessage>message;

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
            // TODO: Implement sending old data
            return context.Client.sendToClient(new PilotReply(2));
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