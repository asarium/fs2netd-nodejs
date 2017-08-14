import * as config from "config";
import {Options} from "sequelize";
import {Sequelize} from "sequelize";
import * as sequelize from "sequelize";
import * as winston from "winston";
import {defineModels} from "./models/index";
import {IModels} from "./models/index";
import {IpBanInstance} from "./models/IpBan";
import {IMissionInstance} from "./models/Mission";
import {IOnlineUserPojo} from "./models/OnlineUser";
import {IOnlineUserInstance} from "./models/OnlineUser";
import {IPilotInstance} from "./models/Pilot";
import {IPilotPojo} from "./models/Pilot";
import {RoleType} from "./models/Role";
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
    logging: (msg: any) => {
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

    public async initialize(options?: IDatabaseOptions): Promise<void> {
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
                                                        Name: RoleType.Admin,
                                                    },
                                                ]);
        }).then(() => {
            return;
        });
    }

    public createUser(data: IUserPojo): IUserInstance {
        return this._models.User.build(data);
    }

    public async getUserByName(username: string): Promise<IUserInstance> {
        return await this._models.User.find({
                                                where: {
                                                    Username: username,
                                                },
                                            });
    }

    public async updateLastLogin(user: IUserInstance): Promise<IUserInstance> {
        return await user.update({
                                     LastLogin: this.now(),
                                 });
    }

    public createOnlineUser(data: IOnlineUserPojo): IOnlineUserInstance {
        return this._models.OnlineUser.build(data);
    }

    public async getPilot(user: IUserInstance, pilotname: string): Promise<IPilotInstance> {
        return await user.getPilots({
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

    public async clearOnlineUsers(): Promise<void> {
        return await this._models.OnlineUser.truncate();
    }

    public createServer(values: IServerPojo): IServerInstance {
        return this._models.Server.build(values);
    }

    public async clearServers(): Promise<void> {
        return await this._models.Server.truncate();
    }

    public async getTables(): Promise<ITableInstance[]> {
        return await this._models.Table.findAll();
    }

    public async getMissions(): Promise<IMissionInstance[]> {
        return await this._models.Mission.findAll();
    }

    public async getIpBans(): Promise<IpBanInstance[]> {
        return await this._models.IpBan.findAll({
                                                    where: {
                                                        Expiration: {
                                                            $gt: this.now(),
                                                        },
                                                    },
                                                });
    }

    public async trimIpBanList(): Promise<void> {
        return await this.Models.IpBan.destroy({
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
