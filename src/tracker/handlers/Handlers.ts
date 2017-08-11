
import * as Promise from "bluebird";
import {LoggerInstance} from "winston";
import {Database} from "../../db/Database";
import {UnknownMessageError} from "../Exceptions";
import {IGameClient} from "../GameClient";
import {IGameServer} from "../GameServer";
import {Message} from "../packets/Messages";
import {LoginMessage} from "../packets/Messages";
import {ServerUpdateMessage} from "../packets/Messages";
import {TableRequestMessage} from "../packets/Messages";
import {ServerStartMessage} from "../packets/Messages";
import {PongMessage} from "../packets/Messages";
import {UpdatePilotMessage} from "../packets/Messages";
import {ServerListMessage} from "../packets/Messages";
import {DuplicateLoginRequest} from "../packets/Messages";
import {ValidSessionIDRequest} from "../packets/Messages";
import {ChannelCountRequest} from "../packets/Messages";
import {MissionListRequest} from "../packets/Messages";
import {GetPilotMessage} from "../packets/Messages";
import {IpBanListRequest} from "../packets/Messages";
import {ServerDisconnectMessage} from "../packets/Messages";
import {PingMessage} from "../packets/Messages";
import {handleTableValidation} from "./FilesHandler";
import {handleMissionListRequest} from "./FilesHandler";
import {handleLoginMessage} from "./LoginHandler";
import {handleDuplicateLoginMessage} from "./LoginHandler";
import {handlePong} from "./MinorHandlers";
import {handlePing} from "./MinorHandlers";
import {handleIpBanListRequest} from "./MinorHandlers";
import {handleValidSessionIDRequest} from "./MinorHandlers";
import {handleUpdatePilotMessage} from "./PilotHandler";
import {handleGetPilotMessage} from "./PilotHandler";
import {handleServerListMessage} from "./ServerListHandler";
import {handleServerUpdateMessage} from "./ServerListHandler";
import {handleServerStartMessage} from "./ServerListHandler";
import {handleServerDisconnectMessage} from "./ServerListHandler";
import {handleChannelCountRequest} from "./ServerListHandler";

export interface IHandlerContext {
    Server: IGameServer;
    Database: Database;
    Client: IGameClient;
    Logger: LoggerInstance;
}

export type IMessageHandlerCallback = (message: Message, context: IHandlerContext) => Promise<void>;

interface IHandlerDefinition {
    MessageType: any;
    Handler: IMessageHandlerCallback;
}

const handlers: IHandlerDefinition[] = [
    {MessageType: typeof(LoginMessage), Handler: handleLoginMessage},
    {MessageType: typeof(DuplicateLoginRequest), Handler: handleDuplicateLoginMessage},

    {MessageType: typeof(GetPilotMessage), Handler: handleGetPilotMessage},
    {MessageType: typeof(UpdatePilotMessage), Handler: handleUpdatePilotMessage},

    {MessageType: typeof(ValidSessionIDRequest), Handler: handleValidSessionIDRequest},

    {MessageType: typeof(PingMessage), Handler: handlePing},
    {MessageType: typeof(PongMessage), Handler: handlePong},

    {MessageType: typeof(TableRequestMessage), Handler: handleTableValidation},
    {MessageType: typeof(MissionListRequest), Handler: handleMissionListRequest},

    {MessageType: typeof(IpBanListRequest), Handler: handleIpBanListRequest},

    {MessageType: typeof(ServerListMessage), Handler: handleServerListMessage},
    {MessageType: typeof(ServerStartMessage), Handler: handleServerStartMessage},
    {MessageType: typeof(ServerUpdateMessage), Handler: handleServerUpdateMessage},
    {MessageType: typeof(ServerDisconnectMessage), Handler: handleServerDisconnectMessage},
    {MessageType: typeof(ChannelCountRequest), Handler: handleChannelCountRequest},
];

export function handleMessage(msg: Message, context: IHandlerContext): Promise<void> {
    for (const def of handlers) {
        if (msg instanceof def.MessageType) {
            return def.Handler(msg, context) || Promise.resolve();
        }
    }

    return Promise.reject(new UnknownMessageError());
}
