import {Authentication} from "./Authentication";
"use strict";

import winston = require("winston");
import {GameServer} from "./GameServer";

let gameServer = new GameServer();

gameServer.start();

process.on('SIGINT', () => {
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");

    gameServer.stop().then(() => process.exit());
});