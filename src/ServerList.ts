import {ServerInstance} from "./db/sequelize-types";
import {ServerPojo} from "./db/sequelize-types";
import {UserInstance} from "./db/sequelize-types";
import * as Promise from "bluebird";
import {Database} from "./db/Database";

export class ServerList {
    private _list: ServerInstance[] = [];

    private _db: Database;

    constructor(db: Database) {
        this._db = db;
    }

    get Servers(): ServerInstance[] {
        return this._list;
    }

    addServer(server: ServerPojo): Promise<ServerInstance> {
        let instance = this._db.createServer(server);

        return instance.save().then(saved => {
            this._list.push(saved);

            return saved;
        });
    }

    getServer(address: string, port: number): ServerInstance {
        for (let server of this._list) {
            if (server.Ip === address && server.Port === port) {
                return server;
            }
        }

        return null;
    }

    removeServer(server: ServerInstance): Promise<void> {
        return server.destroy().then(() => {
            let index = this._list.indexOf(server);

            if (index >= 0) {
                this._list.splice(index, 1);
            }
        });
    }
}
