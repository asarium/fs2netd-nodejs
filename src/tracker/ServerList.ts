import * as Promise from "bluebird";
import {Database} from "../db/Database";
import {IServerInstance} from "../db/models/Server";
import {IServerPojo} from "../db/models/Server";

interface IServerEntry {
    Server: IServerInstance;

    LastUpdate: Date;
}

const SERVER_TIMEOUT = 5 * 60 * 1000; // 5 Minute timeout

function isSameServer(entry: IServerEntry, instance: IServerInstance): boolean {
    return entry.Server.Ip === instance.Ip && entry.Server.Port === instance.Port;
}

export class ServerList {
    private _list: IServerEntry[] = [];

    private _db: Database;

    constructor(db: Database) {
        this._db = db;
    }

    public initialize(): Promise<void> {
        // Initialize the list with what we have in the database
        return this._db.Models.Server.findAll().then((servers) => {
            for (const server of servers) {
                this.addInstance(server);
            }
        });
    }

    get Servers(): IServerInstance[] {
        return this._list.map((entry) => entry.Server);
    }

    public addServer(server: IServerPojo): Promise<IServerInstance> {
        const instance = this._db.createServer(server);

        return instance.save().then((saved) => {
            this.addInstance(saved);

            return saved;
        });
    }

    public getServer(address: string, port: number): IServerInstance {
        for (const entry of this._list) {
            if (entry.Server.Ip === address && entry.Server.Port === port) {
                return entry.Server;
            }
        }

        return null;
    }

    public updateServer(server: IServerInstance): Promise<void> {
        return server.save().then(() => {
            for (const entry of this._list) {
                if (isSameServer(entry, server)) {
                    entry.LastUpdate = new Date();
                    break;
                }
            }
        });
    }

    public removeServer(server: IServerInstance): Promise<void> {
        return server.destroy().then(() => {
            for (let i = 0; i < this._list.length; ++i) {
                const entry = this._list[i];
                if (isSameServer(entry, server)) {
                    this._list.splice(i, 1);
                    break;
                }
            }
        });
    }

    public expireServers(): Promise<void> {
        const expired = this._list.filter((entry) => {
            const diff = (Date.now() - entry.LastUpdate.getTime());
            return diff > SERVER_TIMEOUT;
        });

        return Promise.all(expired.map((entry) => this.removeServer(entry.Server))).then(() => {
            // Ignore return value
        });
    }

    private addInstance(server: IServerInstance): void {
        this._list.push({
                            Server:     server,
                            LastUpdate: new Date(),
                        });
    }
}
