import {Authentication} from "./Authentication";
"use strict";

import winston = require("winston");
import {GameServer} from "./GameServer";

let gameServer = new GameServer();

gameServer.start();

process.on('SIGINT', () => {
    gameServer.stop().then(() => process.exit());
});