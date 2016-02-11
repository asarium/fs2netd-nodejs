'use strict';

/// <reference path="../typings/tsd.d.ts" />

import {GameClient} from "./GameClient";
import {Server} from "net";
import {Database} from "./db/Database";

import * as winston from "winston";
import * as net from 'net';
import * as util from 'util';
import * as Promise from "bluebird";

const PORT = 5000;

export class GameServer {
    private _gameClients: Array<GameClient> = [];
    private _server: Server;
    private _db: Database;

    constructor() {
        this._db = new Database();
    }

    get Database(): Database {
        return this._db;
    }

    start(): Promise<void> {
        return this._db.initialize().then(_ => {
            return this._db.clearOnlineUsers();
        }).then(_ => {
            this._server = net.createServer((s) => {
                let gameClient = new GameClient(this, s);
                winston.info(util.format("Client '%s' connected!", gameClient.toString()));
                gameClient.Disconnected.on(() => {
                    winston.info("Client '%s' has disconnected", gameClient.toString());

                    // Remove element from our list
                    var index = this._gameClients.indexOf(gameClient);
                    if (index >= 0) {
                        this._gameClients.splice(index, 1);
                    }
                });

                this._gameClients.push(gameClient);
            });

            return new Promise<void>((done, _) => {
                this._server.listen(PORT, () => {
                    winston.info("Server listening on port %d", PORT);

                    done();
                });
            })
        });
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

    stop(): Promise<void> {
        return this._db.clearOnlineUsers().then(_ => {
            this._gameClients.forEach(client => client.disconnect());

            return new Promise((done, _) => {
                this._server.close(() => done())
            });
        });
    }
}

