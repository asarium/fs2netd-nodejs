import * as Promise from "bluebird";
import * as config from "config";
import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import * as express from "express";
import routes = require("./routes");
import * as winston from "winston";
import {ServerOptions} from "https";
import {Express} from "express";
import {Database} from "../db/Database";
import {GameServer} from "../tracker/GameServer";

export interface RouterContext {
    Database: Database;
    WebInterface: WebInterface;
}

export class WebInterface {
    private _server;
    private _db: Database;
    private _app: Express;
    private _gameServer: GameServer;

    constructor(db: Database, gameServer: GameServer) {
        this._db = db;
        this._gameServer = gameServer;
    }

    private initializeExpress(): Express {
        let app = express();

        app.use(require("morgan")("dev"));

        let ctx: RouterContext = {
            Database: this._db,
            GameServer: this._gameServer,
            WebInterface: this
        };

        app.use(routes(ctx));

        return app;
    }

    start(): Promise<void> {
        this._app = this.initializeExpress();

        let port = config.get<number>("web.port");

        if (config.has("web.tls.key") && config.has("web.tls.cert")) {
            // Set up a https server
            let options: ServerOptions = {
                key: fs.readFileSync(config.get<string>("web.tls.key")),
                cert: fs.readFileSync(config.get<string>("web.tls.cert")),
            };

            this._server = https.createServer(options, this._app);
        } else {
            // Set up a standard http server
            this._server = http.createServer(this._app);
        }
        this._server.setTimeout(4000);

        return new Promise<void>(done => {
            this._server.listen(port, () => {
                winston.info("Webserver listening on port " + port);
                done();
            });
        });
    }

    stop(): Promise<void> {
        winston.info("Shutting down webserver...");
        return new Promise<void>((done, _) => {
            this._server.close(() => done());
        });
    }
}
