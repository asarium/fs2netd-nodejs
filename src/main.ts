"use strict";

import {GameServer} from "./GameServer";

let gameServer = new GameServer();

gameServer.start();

process.on('SIGINT', () => {
    gameServer.stop().then(() => process.exit());
});