"use strict";

import {Server} from "net";
import {Database} from "../db/Database";
import {GameClient} from "./GameClient";
import {ServerList} from "./ServerList";

import * as config from "config";
import * as net from "net";
import * as util from "util";
import * as winston from "winston";

const PERIODIC_INTERVAL = 30 * 1000; // Perform periodic actions every 30 seconds

export interface IGameServer {
    getClientFromPilot: (pilot: string) => GameClient;

    ServerList: ServerList;
}

export class GameServer implements IGameServer {
    private _gameClients: GameClient[] = [];
    private _server: Server;
    private _db: Database;
    private _serverList: ServerList;

    private _intervalHandle: NodeJS.Timer;

    constructor(db: Database) {
        this._db         = db;
        this._serverList = new ServerList(this._db);
    }

    get Database(): Database {
        return this._db;
    }

    get ServerList(): ServerList {
        return this._serverList;
    }

    public async start(): Promise<void> {
        await this._db.initialize();

        await this._db.clearOnlineUsers();

        await this._db.clearServers();

        await this._serverList.initialize();

        this._server = net.createServer((s) => {
            const gameClient = new GameClient(this, s);
            winston.info(util.format("Client '%s' connected!", gameClient.toString()));
            gameClient.Disconnected.on(() => this.clientDisconnected(gameClient));

            this._gameClients.push(gameClient);
        });

        await new Promise<void>((done) => {
            this._server.listen(config.get<number>("game_server.port"), () => {
                winston.info("Server listening on port %d", config.get<number>("game_server.port"));

                done();
            });
        });

        this._intervalHandle = setInterval(() => this.intervalCallback(), PERIODIC_INTERVAL);
    }

    public getClientFromPilot(pilot: string): GameClient {
        for (const client of this._gameClients) {
            const session = client.Session;
            if (session != null && session.ActivePilot === pilot) {
                return client;
            }
        }
        return null;
    }

    public pingAll(): Promise<any> {
        const promises = [];
        for (const client of this._gameClients) {
            promises.push(client.sendPing());
        }

        return Promise.all(promises);
    }

    public stop(): Promise<void> {
        winston.info("Initiating game server shutdown!");

        clearInterval(this._intervalHandle);
        return this._db.clearOnlineUsers().then(() => {
            return this._db.clearServers();
        }).then(() => {
            this._gameClients.forEach((client) => client.disconnect());

            return new Promise((done, _) => {
                this._server.close(() => done());
            });
        }).then(() => {
            winston.info("Shutdown complete!");
            return null;
        });
    }

    private intervalCallback() {
        // Ping all clients
        this.pingAll();

        this.ServerList.expireServers();
    }

    private clientDisconnected(gameClient: GameClient): void {
        if (gameClient.IsServer) {
            // If it was a server then remove it from the server list
            const server = this.ServerList.getServer(gameClient.RemoteAddress, gameClient.RemotePort);

            if (server) {
                this.ServerList.removeServer(server);
            }
        }

        winston.info("Client '%s' has disconnected", gameClient.toString());

        // Remove element from our list
        const index = this._gameClients.indexOf(gameClient);
        if (index >= 0) {
            this._gameClients.splice(index, 1);
        }
    }
}
