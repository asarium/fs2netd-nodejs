import {Message} from "../Messages";
import {HandlerContext} from "./Handlers";
import {ServerListMessage} from "../Messages";
import {ServerListReply} from "../Messages";


export function handleServerListMessage(message: Message, context: HandlerContext): Promise<void> {
    context.Logger.info("Client has requested the server list");

    let msg = <ServerListMessage>message;

    // TODO: Implement filtering
    return context.Client.sendToClient(new ServerListReply(context.Server.ServerList.Servers));
}
