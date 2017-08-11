
import * as Promise from "bluebird";
import {Message} from "../packets/Messages";
import {TableRequestMessage} from "../packets/Messages";
import {TablesReply} from "../packets/Messages";
import {NameCRC} from "../packets/Messages";
import {MissionListReply} from "../packets/Messages";
import {IHandlerContext} from "./Handlers";

export function handleTableValidation(message: Message, context: IHandlerContext): Promise<void> {
    const msg = message as TableRequestMessage;

    context.Logger.info("Validating client tables");

    if (msg.CRCs.length <= 0) {
        return context.Client.sendToClient(new TablesReply([]));
    }

    return context.Database.getTables().then((tables) => {
        const result: boolean[] = [];

        // Ugh! O(n^2) is not good but there will never be too many tables anyway so it doesn't matter
        for (const clientCRC of msg.CRCs) {
            let found = false;
            for (const table of tables) {
                if (table.Filename.toUpperCase() === clientCRC.Name.toUpperCase()) {
                    result.push(table.CRC32 === clientCRC.CRC32);
                    found = true;
                    break;
                }
            }

            if (!found) {
                result.push(false); // Unknown table is not valid!
            }
        }

        return context.Client.sendToClient(new TablesReply(result));
    });
}

export function handleMissionListRequest(message: Message, context: IHandlerContext): Promise<void> {
    return context.Database.getMissions().then((missions) => {
        const crcs: NameCRC[] = [];

        for (const mission of missions) {
            crcs.push({
                Name: mission.Filename,
                CRC32: mission.CRC32,
            });
        }

        return context.Client.sendToClient(new MissionListReply(crcs));
    });
}
