
import * as Promise from "bluebird";
import {Database} from "./db/Database";
import {ServerInstance} from "./db/models/Server";
import {ServerPojo} from "./db/models/Server";

interface ServerEntry {
    Server: ServerInstance;

    LastUpdate: Date;
}

let SERVER_TIMEOUT = 5 * 60 * 1000; // 5 Minute timeout

function isSameServer(entry: ServerEntry, instance: ServerInstance): boolean {
    return entry.Server.Ip === instance.Ip && entry.Server.Port === instance.Port;
}

export class ServerList {
    private _list: ServerEntry[] = [];

    private _db: Database;

    constructor(db: Database) {
        this._db = db;
    }

    get Servers(): ServerInstance[] {
        return this._list.map(entry => entry.Server);
    }

    addServer(server: ServerPojo): Promise<ServerInstance> {
        let instance = this._db.createServer(server);

        return instance.save().then(saved => {
            this._list.push({
                Server: saved,
                LastUpdate: new Date()
            });

            return saved;
        });
    }

    getServer(address: string, port: number): ServerInstance {
        for (let entry of this._list) {
            if (entry.Server.Ip === address && entry.Server.Port === port) {
                return entry.Server;
            }
        }

        return null;
    }

    updateServer(server: ServerInstance): Promise<void> {
        return server.save().then(() => {
            for (let i = 0; i < this._list.length; ++i) {
                let entry = this._list[i];
                if (isSameServer(entry, server)) {
                    entry.LastUpdate = new Date();
                    break;
                }
            }
        });
    }

    removeServer(server: ServerInstance): Promise<void> {
        return server.destroy().then(() => {
            for (let i = 0; i < this._list.length; ++i) {
                let entry = this._list[i];
                if (isSameServer(entry, server)) {
                    this._list.splice(i, 1);
                    break;
                }
            }
        });
    }

    expireServers(): Promise<void> {
        let expired = this._list.filter(entry => (Date.now() - entry.LastUpdate.getTime()) > SERVER_TIMEOUT);

        return Promise.all(expired.map(entry => this.removeServer(entry.Server))).then(() => {
            // Ignore return value
        });
    }
}