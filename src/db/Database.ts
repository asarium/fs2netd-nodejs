import * as Promise from "bluebird";
import * as config from "config";
import * as sequelize from "sequelize";
import {Options} from "sequelize";
import {Sequelize} from "sequelize";
import * as winston from "winston";
import {defineModels} from "./models/index";
import {IModels} from "./models/index";
import {IpBanInstance} from "./models/IpBan";
import {IMissionInstance} from "./models/Mission";
import {IOnlineUserPojo} from "./models/OnlineUser";
import {IOnlineUserInstance} from "./models/OnlineUser";
import {IPilotInstance} from "./models/Pilot";
import {IPilotPojo} from "./models/Pilot";
import {ADMIN_ROLE} from "./models/Role";
import {IServerInstance} from "./models/Server";
import {IServerPojo} from "./models/Server";
import {ITableInstance} from "./models/Table";
import {IUserPojo} from "./models/User";
import {IUserInstance} from "./models/User";

const defaultOptions: Options = {
    dialect: config.get<string>("db.dialect"),
    host:    config.get<string>("db.host"),
    pool:    {
        max: config.get<number>("db.connectionLimit"),
    },
    logging: (msg) => {
        winston.info(msg);
    },
};

if (config.has("db.port")) {
    defaultOptions.port = config.get<number>("db.port");
}

export interface IDatabaseOptions {
    sequelize?: Options;

    database?: string;
    user?: string;
    password?: string;
}

export class Database {
    private _sequelize: Sequelize;
    private _models: IModels;
    private _options: IDatabaseOptions;

    get Models(): IModels {
        return this._models;
    }

    public initialize(options?: IDatabaseOptions): Promise<void> {
        options = options || {};

        options.sequelize = options.sequelize || defaultOptions;
        options.database  = options.database || config.get<string>("db.database");
        options.user      = options.user || config.get<string>("db.user");
        options.password  = options.password || config.get<string>("db.pass");

        this._options = options;

        this._sequelize = new sequelize(options.database, options.user, options.password, options.sequelize);

        this._models = defineModels(this._sequelize);

        return this._sequelize.sync().then(() => {
            // Check if we need to initialize the default roles
            return this._models.Role.count();
        }).then((count) => {
            if (count > 0) {
                return null;
            }

            return this._models.Role.bulkCreate([
                                                    {
                                                        Name: ADMIN_ROLE,
                                                    },
                                                ]);
        }).then(() => {
            return;
        });
    }

    public createUser(data: IUserPojo): IUserInstance {
        return this._models.User.build(data);
    }

    public getUserByName(username: string): Promise<IUserInstance> {
        return this._models.User.find({
                                          where: {
                                              Username: username,
                                          },
                                      });
    }

    public updateLastLogin(user: IUserInstance): Promise<IUserInstance> {
        return user.update({
                               LastLogin: this.now(),
                           });
    }

    public createOnlineUser(data: IOnlineUserPojo): IOnlineUserInstance {
        return this._models.OnlineUser.build(data);
    }

    public getPilot(user: IUserInstance, pilotname: string): Promise<IPilotInstance> {
        return user.getPilots({
                                  where: {
                                      PilotName: pilotname,
                                  },
                              }).then((pilots) => {
            if (pilots.length <= 0) {
                return null;
            } else {
                return pilots[0];
            }
        });
    }

    public createPilot(values: IPilotPojo): IPilotInstance {
        return this._models.Pilot.build(values);
    }

    public clearOnlineUsers(): Promise<void> {
        return this._models.OnlineUser.truncate();
    }

    public createServer(values: IServerPojo): IServerInstance {
        return this._models.Server.build(values);
    }

    public clearServers(): Promise<void> {
        return this._models.Server.truncate();
    }

    public getTables(): Promise<ITableInstance[]> {
        return this._models.Table.findAll();
    }

    public getMissions(): Promise<IMissionInstance[]> {
        return this._models.Mission.findAll();
    }

    public getIpBans(): Promise<IpBanInstance[]> {
        return this._models.IpBan.findAll({
                                              where: {
                                                  Expiration: {
                                                      $gt: this.now(),
                                                  },
                                              },
                                          });
    }

    public trimIpBanList(): Promise<void> {
        return this.Models.IpBan.destroy({
                                             where: {
                                                 Expiration: {
                                                     $lt: this.now(),
                                                 },
                                             },
                                         }).then(() => {
            return;
        });
    }

    private now(): any {
        if (this._options.sequelize.dialect === "mysql") {
            // MySQL supports NOW, maybe other too but that isn't tested
            return this._sequelize.fn("NOW");
        } else {
            return new Date();
        }
    }
}
