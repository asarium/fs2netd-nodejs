import * as Promise from "bluebird";
import {Database} from "../db/Database";
import {IServerInstance} from "../db/models/Server";
import {IServerPojo} from "../db/models/Server";

interface ServerEntry {
    Server: IServerInstance;

    LastUpdate: Date;
}

let SERVER_TIMEOUT = 5 * 60 * 1000; // 5 Minute timeout

function isSameServer(entry: ServerEntry, instance: IServerInstance): boolean {
    return entry.Server.Ip === instance.Ip && entry.Server.Port === instance.Port;
}

export class ServerList {
    private _list: ServerEntry[] = [];

    private _db: Database;

    constructor(db: Database) {
        this._db = db;
    }

    initialize(): Promise<void> {
        // Initialize the list with what we have in the database
        return this._db.Models.Server.findAll().then(servers => {
            for (let server of servers) {
                this.addInstance(server);
            }
        });
    }

    get Servers(): IServerInstance[] {
        return this._list.map(entry => entry.Server);
    }

    private addInstance(server: IServerInstance): void {
        this._list.push({
                            Server: server,
                            LastUpdate: new Date()
                        });
    }

    addServer(server: IServerPojo): Promise<IServerInstance> {
        let instance = this._db.createServer(server);

        return instance.save().then(saved => {
            this.addInstance(saved);

            return saved;
        });
    }

    getServer(address: string, port: number): IServerInstance {
        for (let entry of this._list) {
            if (entry.Server.Ip === address && entry.Server.Port === port) {
                return entry.Server;
            }
        }

        return null;
    }

    updateServer(server: IServerInstance): Promise<void> {
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

    removeServer(server: IServerInstance): Promise<void> {
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
        let expired = this._list.filter(entry => {
            let diff = (Date.now() - entry.LastUpdate.getTime());
            return diff > SERVER_TIMEOUT;
        });

        return Promise.all(expired.map(entry => this.removeServer(entry.Server))).then(() => {
            // Ignore return value
        });
    }
}
