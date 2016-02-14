import {Message} from "../Messages";
import {HandlerContext} from "./Handlers";
import {ServerListMessage} from "../Messages";
import {ServerListReply} from "../Messages";

import * as winston from "winston";

export function handleServerListMessage(message: Message, context: HandlerContext): Promise<void> {
    winston.info(`Client ${context.Client} has requested the server list`);

    let msg = <ServerListMessage>message;

    // TODO: Implement filtering
    return context.Client.sendToClient(new ServerListReply(context.Server.ServerList.Servers));
}
