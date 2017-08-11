import {Message} from "../packets/Messages";
import {TableRequestMessage} from "../packets/Messages";
import {TablesReply} from "../packets/Messages";
import {INameCRC} from "../packets/Messages";
import {MissionListReply} from "../packets/Messages";
import {IHandlerContext} from "./Handlers";

export async function handleTableValidation(message: Message, context: IHandlerContext): Promise<void> {
    const msg = message as TableRequestMessage;

    context.Logger.info("Validating client tables");

    if (msg.crcs.length <= 0) {
        await context.Client.sendToClient(new TablesReply([]));
        return;
    }

    const tables = await context.Database.getTables();

    const result: boolean[] = [];

    // Ugh! O(n^2) is not good but there will never be too many tables anyway so it doesn't matter
    for (const clientCRC of msg.crcs) {
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

    await context.Client.sendToClient(new TablesReply(result));
    return;
}

export async function handleMissionListRequest(message: Message, context: IHandlerContext): Promise<void> {
    const missions = await context.Database.getMissions();

    const crcs: INameCRC[] = [];

    for (const mission of missions) {
        crcs.push({
                      Name:  mission.Filename,
                      CRC32: mission.CRC32,
                  });
    }

    await context.Client.sendToClient(new MissionListReply(crcs));
}
