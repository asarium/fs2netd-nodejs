/// <reference path="../../typings/tsd.d.ts" />

import * as mysql from "mysql";
import * as config from "config";
import * as Promise from "bluebird";
import * as sequelize from "sequelize";
import * as winston from "winston";
import {LoginMessage} from "./../packets/Messages";
import {Options} from "sequelize";
import {defineModels} from "./sequelize-types";
import {Models} from "./sequelize-types";
import {Sequelize} from "sequelize";
import {UserInstance} from "./sequelize-types";
import {OnlineUserInstance} from "./sequelize-types";
import {OnlineUserPojo} from "./sequelize-types";
import {PilotPojo} from "./sequelize-types";
import {PilotInstance} from "./sequelize-types";
import {UserPojo} from "./sequelize-types";
import {ServerPojo} from "./sequelize-types";
import {ServerInstance} from "./sequelize-types";
import {TableInstance} from "./sequelize-types";

let seqOptions: Options = {
    dialect: "mysql",
    host: config.get<string>("db.host"),
    pool: {
        maxConnections: config.get<number>("db.connectionLimit")
    },
    logging: (msg) => {
        winston.info(msg);
    }
};

export class Database {
    private _sequelize: Sequelize;
    private _models: Models;

    initialize(): Promise<void> {
        this._sequelize = new sequelize(config.get<string>("db.database"), config.get<string>("db.user"), config.get<string>("db.pass"), seqOptions);

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

    getTables(): Promise<TableInstance[]> {
        return this._models.Table.findAll();
    }
}


