import {Message} from "../packets/Messages";
import {ValidSidReply} from "../packets/Messages";
import {ValidSessionIDRequest} from "../packets/Messages";
import {PongMessage} from "../packets/Messages";
import {PingMessage} from "../packets/Messages";
import {IpBanListReply} from "../packets/Messages";
import {getTimeMilliseconds} from "../Utils";
import {IHandlerContext} from "./Handlers";

export function handleValidSessionIDRequest(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client requested session validation");

    const msg = message as ValidSessionIDRequest;
    return context.Client.sendToClient(new ValidSidReply(context.Client.Session.isValid(msg.SessionId)));
}

export function handlePing(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Received ping.");

    return context.Client.sendToClient(new PongMessage((message as PingMessage).Time));
}

export function handlePong(message: Message, context: IHandlerContext): Promise<void> {
    context.Client.LastPing = getTimeMilliseconds() - (message as PongMessage).Time;
    context.Logger.info(`Client has a ping of ${context.Client.LastPing}`);

    return Promise.resolve();
}

export async function handleIpBanListRequest(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client requested IP ban list");

    await context.Database.trimIpBanList();

    const ipBans = await context.Database.getIpBans();

    await context.Client.sendToClient(new IpBanListReply(ipBans.map((ban) => ban.IpMask)));
}
