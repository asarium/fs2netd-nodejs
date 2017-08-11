import {ClientMessage} from "./packets/Messages";
'use strict';

import {Socket} from "net";
import {PacketHandler} from "./packets/PacketHandler";
import {GameServer} from "./GameServer";
import {ILiteEvent} from "./Events";
import {LiteEvent} from "./Events";
import {Message} from "./packets/Messages";
import {LoginMessage} from "./packets/Messages";
import * as winston from "winston";
import {LoginReply} from "./packets/Messages";
import {Session} from "./Session";
import * as util from "util";
import {GetPilotMessage} from "./packets/Messages";
import {NoSuchUserError} from "./Exceptions";
import {AuthenticationError} from "./Exceptions";
import * as Promise from "bluebird";
import {PilotReply} from "./packets/Messages";
import {ValidSessionIDRequest} from "./packets/Messages";
import {ValidSidReply} from "./packets/Messages";
import {Authentication} from "./../util/Authentication";
import {handleMessage} from "./handlers/Handlers";
import {UnknownMessageError} from "./Exceptions";
import {PingMessage} from "./packets/Messages";
import {getTimeMilliseconds} from "./Utils";
import {LoggerInstance} from "winston";
import {IUserInstance} from "../db/models/User";
import {OnlineUserInstance} from "../db/models/OnlineUser";
import {OnlineUserPojo} from "../db/models/OnlineUser";

export interface IGameClient {
    sendToClient:(msg: ClientMessage) => Promise<void>;
    getOnlineUserData:() => OnlineUserPojo;

    RemoteAddress: string;
    RemotePort: number;
    Authenticated: boolean;
    User: IUserInstance;
    Session: Session;
    OnlineUser: OnlineUserInstance;
    LastPing: number;
    IsServer: boolean;
}

/**
 * A game instance that is connected to this server. The class handles communication with the client and dispatches
 * received messages to the message handler.
 */
export class GameClient implements IGameClient {
    private _socket: Socket;
    private _handler: PacketHandler;
    private _authenticated: boolean = false;
    private _server: GameServer;

    private _remoteAddress: string;
    private _remotePort: number;

    private _session: Session;
    private _user: IUserInstance;
    private _onlineUser: OnlineUserInstance;

    private _lastPing: number;

    private _onDisconnected = new LiteEvent<void>();

    private _logger: LoggerInstance;

    private _isServer: boolean = false;

    /**
     * Initializes the client with
     * @param server The server this client belongs to
     * @param socket The connected socket
     */
    constructor(server: GameServer, socket: Socket) {
        this._server = server;
        this._socket = socket;

        this._remoteAddress = socket.remoteAddress;
        this._remotePort = socket.remotePort;

        this._logger = new winston.Logger({
            transports: [
                new (winston.transports.Console)(),
            ],
            filters: [
                (level, msg, meta) => {
                    return `[${this.toString()}] ${msg}`;
                }
            ]
        });

        socket.on("close", _ => this._onDisconnected.trigger());

        this._handler = new PacketHandler(socket);
        this._handler.Message.on(msg => this.messageHandler(msg));

        this.Disconnected.on(_ => {
            if (this._onlineUser) {
                this._onlineUser.destroy();
            }
        });
    }

    /**
     * Gets fired when the underlying socket is disconnected
     */
    public get Disconnected(): ILiteEvent<void> {
        return this._onDisconnected;
    }

    get User(): IUserInstance {
        return this._user;
    }

    set User(value: IUserInstance) {
        this._user = value;
    }

    get Session(): Session {
        return this._session;
    }

    set Session(value: Session) {
        this._session = value;
    }

    get Authenticated(): boolean {
        return this._authenticated;
    }

    set Authenticated(value: boolean) {
        this._authenticated = value;
    }

    get OnlineUser(): OnlineUserInstance {
        return this._onlineUser;
    }

    set OnlineUser(value: OnlineUserInstance) {
        this._onlineUser = value;
    }

    get LastPing(): number {
        return this._lastPing;
    }

    set LastPing(value: number) {
        this._lastPing = value;
    }

    get RemoteAddress(): string {
        return this._remoteAddress;
    }

    get RemotePort(): number {
        return this._remotePort;
    }
    set RemotePort(value: number) {
        this._remotePort = value;
    }

    get IsServer(): boolean {
        return this._isServer;
    }
    set IsServer(value: boolean) {
        this._isServer = value;
    }

    /**
     * Sends a message packet to the client
     * @param msg The message to send
     */
    public sendToClient(msg: ClientMessage): Promise<void> {
        return new Promise<void>((done, _) => {
            this._socket.write(msg.serialize(), () => {
                done();
            });
        });
    }

    public sendPing(): Promise<void> {
        return this.sendToClient(new PingMessage(getTimeMilliseconds()));
    }

    public getOnlineUserData(): OnlineUserPojo {
        return {
            ClientIp: this._remoteAddress,
            ClientPort: this._remotePort,
            PilotName: this._session.ActivePilot,
            SessionId: this._session.Id
        };
    }

    /**
     * Handles all messages received from the client
     * @param message The message to handle
     */
    private messageHandler(message: Message) {
        if (this.Authenticated || message instanceof LoginMessage) {
            // Only handle messages when authenticated or if it's a login message
            let context = {
                Server: this._server,
                Database: this._server.Database,
                Client: this,
                Logger: this._logger
            };
            handleMessage(message, context).catch(UnknownMessageError, () => {
                this._logger.info("Unknown message typ received: %s", typeof(message));
            }).catch(err => {
                this._logger.error("Uncaught error while handling message!", err);
            });
        }
    }

    /**
     * Disconnects the socket
     */
    disconnect() {
        this._socket.end();
    }

    toString(): string {
        let msg: string = "";
        if (this._user != null) {
            msg += this._user.Username;
        }
        else {
            msg += "Unknown user";
        }

        if (this._socket != null) {
            msg += " (";
            if (this._remoteAddress && this._remotePort) {
                msg += util.format("%s:%d", this._remoteAddress, this._remotePort);
            } else {
                msg += "Not connected";
            }
            msg += ")";
        }

        return msg;
    }
}
