/// <reference path="../../../typings/main.d.ts" />

import * as mysql from "mysql";
import * as config from "config";
import * as Promise from "bluebird";
import * as sequelize from "sequelize";
import * as winston from "winston";
import {LoginMessage} from "../packets/Messages";
import {Options} from "sequelize";
import {Sequelize} from "sequelize";
import {Authentication} from "../Authentication";
import {Models} from "./models/index";
import {defineModels} from "./models/index";
import {UserPojo} from "./models/User";
import {UserInstance} from "./models/User";
import {OnlineUserPojo} from "./models/OnlineUser";
import {OnlineUserInstance} from "./models/OnlineUser";
import {PilotInstance} from "./models/Pilot";
import {PilotPojo} from "./models/Pilot";
import {ServerPojo} from "./models/Server";
import {ServerInstance} from "./models/Server";
import {TableInstance} from "./models/Table";
import {MissionInstance} from "./models/Mission";
import {IpBanInstance} from "./models/IpBan";

let defaultOptions: Options = {
    dialect: config.get<string>("db.dialect"),
    host: config.get<string>("db.host"),
    pool: {
        maxConnections: config.get<number>("db.connectionLimit")
    },
    logging: (msg) => {
        winston.info(msg);
    }
};

if (config.has("db.port")) {
    defaultOptions.port = config.get<number>("db.port");
}

export interface DatabaseOptions {
    sequelize?: Options;

    database?: string;
    user?: string;
    password?: string;
}

export class Database {
    private _sequelize: Sequelize;
    private _models: Models;

    get Models(): Models {
        return this._models;
    }

    initialize(options?: DatabaseOptions): Promise<void> {
        options = options || {};

        options.sequelize = options.sequelize || defaultOptions;
        options.database = options.database || config.get<string>("db.database");
        options.user = options.user || config.get<string>("db.user");
        options.password = options.password || config.get<string>("db.pass");

        this._sequelize = new sequelize(options.database, options.user, options.password, options.sequelize);

        this._models = defineModels(this._sequelize);

        return this._sequelize.sync();
    }

    createUser(data: UserPojo): UserInstance {
        return this._models.User.build(data);
    }

    getUserByName(username: string): Promise<UserInstance> {
        return this._models.User.find({
                                          where: {
                                              UserName: username
                                          }
                                      });
    }

    updateLastLogin(user: UserInstance): Promise<UserInstance> {
        return user.update({
                               LastLogin: this._sequelize.fn('NOW')
                           });
    }

    createOnlineUser(data: OnlineUserPojo): OnlineUserInstance {
        return this._models.OnlineUser.build(data);
    }

    pilotExists(user: UserInstance, pilotname: string): Promise<boolean> {
        return user.countPilots({
                                    where: {
                                        PilotName: pilotname
                                    }
                                }).then(count => {
            return count > 0;
        });
    }

    getPilot(user: UserInstance, pilotname: string): Promise<PilotInstance> {
        return user.getPilots({
                                  where: {
                                      PilotName: pilotname
                                  }
                              }).then(pilots => {
            if (pilots.length <= 0) {
                return null;
            } else {
                return pilots[0];
            }
        });
    }

    createPilot(values: PilotPojo): PilotInstance {
        return this._models.Pilot.build(values);
    }

    clearOnlineUsers(): Promise<void> {
        return this._models.OnlineUser.truncate();
    }

    createServer(values: ServerPojo): ServerInstance {
        return this._models.Server.build(values);
    }

    clearServers(): Promise<void> {
        return this._models.Server.truncate();
    }

    getTables(): Promise<TableInstance[]> {
        return this._models.Table.findAll();
    }

    getMissions(): Promise<MissionInstance[]> {
        return this._models.Mission.findAll();
    }

    getIpBans(): Promise<IpBanInstance[]> {
        return this._models.IpBan.findAll({
                                              where: {
                                                  TTL: 0
                                              }
                                          });
    }
}


