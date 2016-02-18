import {ServerList} from "./ServerList";
'use strict';

/// <reference path="../../typings/main.d.ts" />

import {GameClient} from "./GameClient";
import {Server} from "net";
import {Database} from "../db/Database";

import * as config from "config";
import * as winston from "winston";
import * as net from 'net';
import * as util from 'util';
import * as Promise from "bluebird";

let PERIODIC_INTERVAL = 30 * 1000; // Perform periodic actions every 30 seconds

export interface IGameServer {
    getClientFromPilot:(pilot: string) => GameClient;

    ServerList: ServerList;
}

export class GameServer implements IGameServer {
    private _gameClients: Array<GameClient> = [];
    private _server: Server;
    private _db: Database;
    private _serverList: ServerList;

    private _intervalHandle: NodeJS.Timer;

    constructor() {
        this._db = new Database();
        this._serverList = new ServerList(this._db);
    }

    get Database(): Database {
        return this._db;
    }

    get ServerList(): ServerList {
        return this._serverList;
    }

    start(): Promise<void> {
        return this._db.initialize().then(_ => {
            return this._db.clearOnlineUsers();
        }).then(() => {
            return this._db.clearServers();
        }).then(() => {
            return this._serverList.initialize();
        }).then(_ => {
            this._server = net.createServer((s) => {
                let gameClient = new GameClient(this, s);
                winston.info(util.format("Client '%s' connected!", gameClient.toString()));
                gameClient.Disconnected.on(() => this.clientDisconnected(gameClient));

                this._gameClients.push(gameClient);
            });

            return new Promise<void>((done, _) => {
                this._server.listen(config.get<number>("game_server.port"), () => {
                    winston.info("Server listening on port %d", config.get<number>("game_server.port"));

                    done();
                });
            }).then(_ => {
                // Server is initialized
                this._intervalHandle = setInterval(() => this.intervalCallback(), PERIODIC_INTERVAL);
            });
        });
    }

    private intervalCallback() {
        winston.info("Performing periodic actions");

        // Ping all clients
        this.pingAll();

        this.ServerList.expireServers();
    }

    getClientFromPilot(pilot: string): GameClient {
        for (let client of this._gameClients) {
            let session = client.Session;
            if (session != null && session.ActivePilot === pilot) {
                return client;
            }
        }
        return null;
    }

    pingAll(): Promise<any> {
        let promises = [];
        for (let client of this._gameClients) {
            promises.push(client.sendPing());
        }

        return Promise.all(promises);
    }

    stop(): Promise<void> {
        winston.info("Initiating game server shutdown!");

        clearInterval(this._intervalHandle);
        return this._db.clearOnlineUsers().then(() => {
            return this._db.clearServers();
        }).then(_ => {
            this._gameClients.forEach(client => client.disconnect());

            return new Promise((done, _) => {
                this._server.close(() => done())
            });
        }).then(_ => {
            winston.info("Shutdown complete!");
            return null;
        });
    }

    private clientDisconnected(gameClient: GameClient): void {
        if (gameClient.IsServer) {
            // If it was a server then remove it from the server list
            let server = this.ServerList.getServer(gameClient.RemoteAddress, gameClient.RemotePort);

            if (server) {
                this.ServerList.removeServer(server);
            }
        }

        winston.info("Client '%s' has disconnected", gameClient.toString());

        // Remove element from our list
        var index = this._gameClients.indexOf(gameClient);
        if (index >= 0) {
            this._gameClients.splice(index, 1);
        }
    }
}

