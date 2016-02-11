import {ClientMessage} from "./Messages";
'use strict';

import {Socket} from "net";
import {PacketHandler} from "./PacketHandler";
import {GameServer} from "./GameServer";
import {ILiteEvent} from "./Events";
import {LiteEvent} from "./Events";
import {Message} from "./Messages";
import {LoginMessage} from "./Messages";
import winston = require("winston");
import {LoginReply} from "./Messages";
import {Session} from "./Session";
import * as util from "util";
import {GetPilotMessage} from "./Messages";
import {NoSuchUserError} from "./Exceptions";
import {AuthenticationError} from "./Exceptions";
import * as Promise from "bluebird";
import {PilotReply} from "./Messages";
import {ValidSessionIDRequest} from "./Messages";
import {ValidSidReply} from "./Messages";
import {UserInstance} from "./db/sequelize-types";
import {OnlineUserInstance} from "./db/sequelize-types";
import {Authentication} from "./Authentication";
import {OnlineUserPojo} from "./db/sequelize-types";

/**
 * A game instance that is connected to this server. Handles communication, authentication and user session.
 */
export class GameClient {
    private _socket: Socket;
    private _handler: PacketHandler;
    private _authenticated: boolean = false;
    private _server: GameServer;

    private _remoteAddress: string;
    private _remotePort: number;

    private _session: Session;
    private _user: UserInstance;
    private _onlineUser: OnlineUserInstance;

    private _onDisconnected = new LiteEvent<void>();

    /**
     * Gets fired when the underlying socket is disconnected
     */
    public get Disconnected(): ILiteEvent<void> {
        return this._onDisconnected;
    }

    get User(): UserInstance {
        return this._user;
    }

    get Session(): Session {
        return this._session;
    }

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
     * Sends a message packet to the client
     * @param msg The message to send
     */
    private sendToClient(msg: ClientMessage): Promise<void> {
        return new Promise<void>((done, _) => {
            this._socket.write(msg.serialize(), () => {
                done();
            });
        });
    }

    private createOnlineUserData(): OnlineUserPojo {
        return {
            ClientIp: this._remoteAddress,
            ClientPort: this._remotePort,
            PilotName: this._session.ActivePilot,
            SessionId: this._session.Id
        };
    }

    /**
     * Handles a login message. Checks the database if the user and password is valid and initializes the user instance
     * @param msg The login message from the client
     */
    private handleLogin(msg: LoginMessage) {
        if (this._authenticated) {
            winston.warn("User %s is already logged in! Tried to log in again.", msg.Username);
            return;
        }

        // This code handles authentication and setup of this client instance based on the data sent to us.
        // This is done in the following steps:
        // 1. Retrieve data for the user name from the DB
        // 2. If user is present, check login
        // 3. If login is valid, create a session
        // 4. Set session data for this instance and send successful reply so client

        winston.info("Authenticating user %s...", msg.Username);
        let userP = this._server.Database.getUserByName(msg.Username);

        let numPilotsP = userP.then(user => {
            if (user == null) {
                // If there is no such user then reject the login
                throw new NoSuchUserError(msg.Username);
            } else {
                // Check the password we got against the database data
                return Authentication.verifyPassword(user, msg.Password);
            }
        }).then(valid => {
            this._authenticated = valid;
            if (!valid) {
                // If not valid then throw an error
                throw new AuthenticationError();
            }

            this._user = userP.value();
            winston.info("Client %s successfully authenticated", this.toString());

            if (this._session != null) {
                // Client re-authenticated itself
                return Promise.resolve(this._session);
            } else {
                // Create a session and send the generated id
                return Session.createSession();
            }
        }).then(session => {
            this._session = session;
            return this._server.Database.updateLastLogin(this._user);
        }).then(() => {
            this._onlineUser = this._server.Database.createOnlineUser(this.createOnlineUserData());
            return this._onlineUser.save();
        }).then(_ => {
            return this._onlineUser.setUser(this._user);
        }).then(_ => {
            return this._user.countPilots();
        });

        numPilotsP.then(() => {
            // Send a message telling the client that the login was successful
            return this.sendToClient(new LoginReply(true, this._session.Id, numPilotsP.value()));
        }).catch(NoSuchUserError, () => {
            // User isn't known
            this.sendToClient(new LoginReply(false, -1, -1));
            return null;
        }).catch(AuthenticationError, () => {
            // Wrong password
            this.sendToClient(new LoginReply(false, -1, -1));
            return null;
        }).catch(err => {
            winston.error("Error while authenticating User!", err);
            this.sendToClient(new LoginReply(false, -1, -1));
            return null;
        });
    }

    private handleGetPilot(msg: GetPilotMessage) {
        let client: GameClient = this;
        let sessId = msg.SessionId;

        if (sessId == -2) {
            client = this._server.getClientFromPilot(msg.Pilotname);

            if (client != null) {
                sessId = client.Session.Id;
            }
        }

        if (client == null) {
            this.sendToClient(new PilotReply(2));
            return;
        }

        if (!client.Session.isValid(sessId)) {
            this.sendToClient(new PilotReply(3));
            return;
        }

        if (msg.CreatePilot) {
            client._session.ActivePilot = msg.Pilotname;
        }

        this._server.Database.pilotExists(client.User, msg.Pilotname).then(exists => {
            if (exists) {
                // TODO: Implement sending old data
                return this.sendToClient(new PilotReply(2));
            } else {
                let pilot = this._server.Database.createPilot({
                    PilotName: msg.Pilotname
                });

                return pilot.save().then(_ => {
                    return pilot.setUser(this._user);
                }).then(_ => {
                    return this.sendToClient(new PilotReply(1));
                });
            }
        });
    }

    /**
     * Handles all messages received from the client
     * @param message The message to handle
     */
    private messageHandler(message: Message) {
        if (message instanceof LoginMessage) {
            this.handleLogin(message);
        } else if (!this._authenticated) {
            // Ignore messages when not authenticated
            return;
        } else if (message instanceof GetPilotMessage) {
            this.handleGetPilot(message);
        } else if (message instanceof ValidSessionIDRequest) {
            this.sendToClient(new ValidSidReply(this._session.isValid(message.SessionId)));
        } else {
            winston.info("Unknown message typ received: %s", typeof message);
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
