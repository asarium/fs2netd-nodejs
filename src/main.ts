import * as winston from "winston";
import {WebInterface} from "./app/WebInterface";
import {Database} from "./db/Database";
import {GameServer} from "./tracker/GameServer";

const db           = new Database();
const gameServer   = new GameServer(db);
const webInterface = new WebInterface(db, {
    logging: true,
});

db.initialize().then(() => {
    return gameServer.start();
}).then(() => {
    return webInterface.start();
}).catch((err) => {
    winston.error(err);
    process.exit();
});

const shutdown = () => {
    webInterface.stop().then(() => {
        return gameServer.stop();
    })
                .then(() => {
                    process.exit();
                });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
