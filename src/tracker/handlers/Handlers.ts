
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
    {MessageType: ChannelCountRequest, Handler: handleChannelCountRequest},
];

export function handleMessage(msg: Message, context: IHandlerContext): Promise<void> {
    for (const def of handlers) {
        if (msg instanceof def.MessageType) {
            return def.Handler(msg, context) || Promise.resolve();
        }
    }

    return Promise.reject(new UnknownMessageError());
}
