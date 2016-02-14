import {HandlerContext} from "./Handlers";
import {Message} from "../packets/Messages";
import {ValidSidReply} from "../packets/Messages";
import {ValidSessionIDRequest} from "../packets/Messages";

import * as Promise from "bluebird";
import {PongMessage} from "../packets/Messages";
import {PingMessage} from "../packets/Messages";
import {getTimeMilliseconds} from "../Utils";

export function handleValidSessionIDRequest(message: Message, context: HandlerContext): Promise<void> {
    let msg = <ValidSessionIDRequest>message;
    return context.Client.sendToClient(new ValidSidReply(context.Client.Session.isValid(msg.SessionId)));
}

export function handlePing(message: Message, context: HandlerContext): Promise<void> {
    context.Logger.info("Received ping.");

    return context.Client.sendToClient(new PongMessage((<PingMessage>message).Time));
}

export function handlePong(message: Message, context: HandlerContext): Promise<void> {
    context.Client.LastPing = getTimeMilliseconds() - (<PongMessage>message).Time;
    context.Logger.info(`Client has a ping of ${context.Client.LastPing}`);

    return Promise.resolve();
}
