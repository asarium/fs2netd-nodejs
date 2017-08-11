import * as Promise from "bluebird";
import * as config from "config";
import * as express from "express";
import {Express} from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import {ServerOptions} from "https";
import * as winston from "winston";
import {Database} from "../db/Database";
import {GameServer} from "../tracker/GameServer";
import routes = require("./routes");

export interface IRouterContext {
    Database: Database;
    WebInterface: WebInterface;
}

export interface IWebOptions {
    logging?: boolean;
}

export class WebInterface {
    private _server;
    private _db: Database;
    private _app: Express;
    private _options: IWebOptions;

    constructor(db: Database, options: IWebOptions) {
        this._db      = db;
        this._options = options;
        this._app     = this.initializeExpress();
    }

    get App(): Express {
        return this._app;
    }

    public start(): Promise<void> {
        const port = config.get<number>("web.port");

        if (config.has("web.tls.key") && config.has("web.tls.cert")) {
            // Set up a https server
            const options: ServerOptions = {
                key:  fs.readFileSync(config.get<string>("web.tls.key")),
                cert: fs.readFileSync(config.get<string>("web.tls.cert")),
            };

            this._server = https.createServer(options, this._app);
        } else {
            // Set up a standard http server
            this._server = http.createServer(this._app);
        }
        this._server.setTimeout(4000);

        return new Promise<void>((done) => {
            this._server.listen(port, () => {
                winston.info("Webserver listening on port " + port);
                done();
            });
        });
    }

    public stop(): Promise<void> {
        winston.info("Shutting down webserver...");

        if (!this._server) {
            return Promise.resolve();
        } else {
            return new Promise<void>((done, _) => {
                this._server.close(() => done());
            });
        }
    }

    private initializeExpress(): Express {
        const app = express();

        if (this._options.logging) {
            app.use(require("morgan")("dev"));
        }

        const ctx: IRouterContext = {
            Database:     this._db,
            WebInterface: this,
        };

        app.use(routes(ctx));

        return app;
    }
}
