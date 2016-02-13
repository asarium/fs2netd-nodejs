import {HandlerContext} from "./Handlers";
import {Message} from "../Messages";
import {ValidSidReply} from "../Messages";
import {ValidSessionIDRequest} from "../Messages";

import * as winston from "winston";
import {PongMessage} from "../Messages";
import {PingMessage} from "../Messages";
import {getTimeMilliseconds} from "../Utils";

export function handleValidSessionIDRequest(message: Message, context: HandlerContext): Promise<void> {
    let msg = <ValidSessionIDRequest>message;
    return context.Client.sendToClient(new ValidSidReply(context.Client.Session.isValid(msg.SessionId)));
}

export function handlePing(message: Message, context: HandlerContext): Promise<void> {
    winston.info("Received ping from %s", context.Client);

    return context.Client.sendToClient(new PongMessage((<PingMessage>message).Time));
}

export function handlePong(message: Message, context: HandlerContext): Promise<void> {
    winston.info("Received pong from %s", context.Client);

    context.Client.LastPing = getTimeMilliseconds() - (<PongMessage>message).Time;

    return Promise.resolve();
}
