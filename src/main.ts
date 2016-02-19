import {Database} from "./db/Database";
"use strict";

import {WebInterface} from "./app/WebInterface";
import {GameServer} from "./tracker/GameServer";
import * as winston from "winston";

let db = new Database();
let gameServer = new GameServer(db);
let webInterface = new WebInterface(db);

db.initialize().then(() => {
    return gameServer.start();
}).then(() => {
    return webInterface.start();
});

let shutdown = () => {
    webInterface.stop().then(() => {
                    return gameServer.stop();
                })
                .then(() => {
                    process.exit()
                });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);