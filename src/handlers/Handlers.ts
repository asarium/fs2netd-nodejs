import {GameServer} from "../GameServer";
import {Database} from "../db/Database";
import {GameClient} from "../GameClient";
import {Message} from "../Messages";
import {LoginMessage} from "../Messages";
import {handleLoginMessage} from "./LoginHandler";

import * as Promise from "bluebird";
import {UnknownMessageError} from "../Exceptions";
import {handleGetPilotMessage} from "./PilotHandler";
import {GetPilotMessage} from "../Messages";
import {ValidSessionIDRequest} from "../Messages";
import {handleValidSessionIDRequest} from "./MinorHandlers";
import {PingMessage} from "../Messages";
import {handlePing} from "./MinorHandlers";
import {PongMessage} from "../Messages";
import {handlePong} from "./MinorHandlers";
import {ServerListMessage} from "../Messages";
import {handleServerListMessage} from "./ServerListHandler";
import {LoggerInstance} from "winston";

export interface HandlerContext {
    Server: GameServer;
    Database: Database;
    Client: GameClient;
    Logger: LoggerInstance;
}

export interface MessageHandlerCallback { (message: Message, context: HandlerContext): Promise<void>
}

interface HandlerDefinition {
    MessageType;
    Handler: MessageHandlerCallback;
}

let handlers: HandlerDefinition[] = [
    {MessageType: LoginMessage, Handler: handleLoginMessage},
    {MessageType: GetPilotMessage, Handler: handleGetPilotMessage},
    {MessageType: ValidSessionIDRequest, Handler: handleValidSessionIDRequest},
    {MessageType: PingMessage, Handler: handlePing},
    {MessageType: PongMessage, Handler: handlePong},
    {MessageType: ServerListMessage, Handler: handleServerListMessage},
];

export function handleMessage(msg: Message, context: HandlerContext): Promise<void> {
    for (let def of handlers) {
        if (msg instanceof def.MessageType) {
            return def.Handler(msg, context);
        }
    }

    return Promise.reject(new UnknownMessageError());
}
