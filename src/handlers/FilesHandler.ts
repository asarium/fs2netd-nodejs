import {HandlerContext} from "./Handlers";
import {Message} from "../packets/Messages";
import {TableRequestMessage} from "../packets/Messages";
import {TablesReply} from "../packets/Messages";
import {MissionListRequest} from "../packets/Messages";
import {NameCRC} from "../packets/Messages";
import {MissionListReply} from "../packets/Messages";

export function handleTableValidation(message: Message, context: HandlerContext): Promise<void> {
    let msg = <TableRequestMessage>message;

    context.Logger.info("Validating client tables");

    if (msg.CRCs.length <= 0) {
        return context.Client.sendToClient(new TablesReply([]));
    }

    return context.Database.getTables().then(tables => {
        let result: boolean[] = [];

        // Ugh! O(n^2) is not good but there will never be too many tables anyway so it doesn't matter
        for (let clientCRC of msg.CRCs) {
            let found = false;
            for (let table of tables) {
                if (table.Filename.toUpperCase() === clientCRC.Name.toUpperCase()) {
                    result.push(table.CRC32 == clientCRC.CRC32);
                    found = true;
                    break;
                }
            }

            if (!found) {
                result.push(true); // Unknown table is not valid!
            }
        }

        return context.Client.sendToClient(new TablesReply(result));
    });
}

export function handleMissionListRequest(message: Message, context: HandlerContext): Promise<void> {
    return context.Database.getMissions().then(missions => {
        let crcs: NameCRC[] = [];

        for (let mission of missions) {
            crcs.push({
                Name: mission.Filename,
                CRC32: mission.CRC32,
            });
        }

        return context.Client.sendToClient(new MissionListReply(crcs));
    });
}
