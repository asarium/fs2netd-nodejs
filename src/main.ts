"use strict";

import {WebInterface} from "./app/WebInterface";
import {GameServer} from "./tracker/GameServer";
import * as winston from "winston";

let gameServer = new GameServer();
let webInterface = new WebInterface();

gameServer.start().then(() => {
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