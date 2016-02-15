import {GameServer} from "../GameServer";
import {Database} from "../db/Database";
import {GameClient} from "../GameClient";
import {Message} from "../packets/Messages";
import {LoginMessage} from "../packets/Messages";
import {handleLoginMessage} from "./LoginHandler";

import * as Promise from "bluebird";
import {UnknownMessageError} from "../Exceptions";
import {handleGetPilotMessage} from "./PilotHandler";
import {GetPilotMessage} from "../packets/Messages";
import {ValidSessionIDRequest} from "../packets/Messages";
import {handleValidSessionIDRequest} from "./MinorHandlers";
import {PingMessage} from "../packets/Messages";
import {handlePing} from "./MinorHandlers";
import {PongMessage} from "../packets/Messages";
import {handlePong} from "./MinorHandlers";
import {ServerListMessage} from "../packets/Messages";
import {handleServerListMessage} from "./ServerListHandler";
import {LoggerInstance} from "winston";
import {TableRequestMessage} from "../packets/Messages";
import {handleTableValidation} from "./FilesHandler";
import {MissionListRequest} from "../packets/Messages";
import {handleMissionListRequest} from "./FilesHandler";
import {IpBanListRequest} from "../packets/Messages";
import {handleIpBanListRequest} from "./MinorHandlers";
import {ServerStartMessage} from "../packets/Messages";
import {ServerUpdateMessage} from "../packets/Messages";
import {ServerDisconnectMessage} from "../packets/Messages";
import {handleServerStartMessage} from "./ServerListHandler";
import {handleServerDisconnectMessage} from "./ServerListHandler";
import {handleServerUpdateMessage} from "./ServerListHandler";
import {DuplicateLoginRequest} from "../packets/Messages";
import {handleDuplicateLoginMessage} from "./LoginHandler";
import {UpdatePilotMessage} from "../packets/Messages";
import {handleUpdatePilotMessage} from "./PilotHandler";

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
    {MessageType: DuplicateLoginRequest, Handler: handleDuplicateLoginMessage},

    {MessageType: GetPilotMessage, Handler: handleGetPilotMessage},
    {MessageType: UpdatePilotMessage, Handler: handleUpdatePilotMessage},

    {MessageType: ValidSessionIDRequest, Handler: handleValidSessionIDRequest},

    {MessageType: PingMessage, Handler: handlePing},
    {MessageType: PongMessage, Handler: handlePong},

    {MessageType: TableRequestMessage, Handler: handleTableValidation},
    {MessageType: MissionListRequest, Handler: handleMissionListRequest},

    {MessageType: IpBanListRequest, Handler: handleIpBanListRequest},

    {MessageType: ServerListMessage, Handler: handleServerListMessage},
    {MessageType: ServerStartMessage, Handler: handleServerStartMessage},
    {MessageType: ServerUpdateMessage, Handler: handleServerUpdateMessage},
    {MessageType: ServerDisconnectMessage, Handler: handleServerDisconnectMessage},
];

export function handleMessage(msg: Message, context: HandlerContext): Promise<void> {
    for (let def of handlers) {
        if (msg instanceof def.MessageType) {
            return def.Handler(msg, context);
        }
    }

    return Promise.reject(new UnknownMessageError());
}
