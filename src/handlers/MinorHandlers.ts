import {HandlerContext} from "./Handlers";
import {Message} from "../Messages";
import {ValidSidReply} from "../Messages";
import {ValidSessionIDRequest} from "../Messages";

export function handleValidSessionIDRequest(message: Message, context: HandlerContext): Promise<void> {
    let msg = <ValidSessionIDRequest>message;
    return context.Client.sendToClient(new ValidSidReply(context.Client.Session.isValid(msg.SessionId)));
}