import {definePilot} from "./Pilot";
import {defineTable} from "./Table";

import sequelize = require("sequelize");
import {Sequelize} from "sequelize";
import {defineIpBan} from "./IpBan";
import {IpBanModel} from "./IpBan";
import {defineMission} from "./Mission";
import {IMissionModel} from "./Mission";
import {IOnlineUserModel} from "./OnlineUser";
import {defineOnlineUser} from "./OnlineUser";
import {IPilotModel} from "./Pilot";
import {IRoleModel} from "./Role";
import {defineRole} from "./Role";
import {IServerModel} from "./Server";
import {defineServer} from "./Server";
import {ITableModel} from "./Table";
import {IUserModel} from "./User";
import {defineUser} from "./User";

export interface IHasId {
    id?: number;
}

export interface IModels {
    OnlineUser: IOnlineUserModel;
    User: IUserModel;
    Pilot: IPilotModel;
    Server: IServerModel;
    Table: ITableModel;
    Mission: IMissionModel;
    IpBan: IpBanModel;
    Role: IRoleModel;
}

export function defineModels(sequ: Sequelize): IModels {
    const models: IModels = {
        OnlineUser: defineOnlineUser(sequ, sequelize),
        User: defineUser(sequ, sequelize),
        Pilot: definePilot(sequ, sequelize),
        Server: defineServer(sequ, sequelize),
        Table: defineTable(sequ, sequelize),
        Mission: defineMission(sequ, sequelize),
        IpBan: defineIpBan(sequ, sequelize),
        Role: defineRole(sequ, sequelize),
    };

    models.User.hasMany(models.OnlineUser, {foreignKey: "UserId", onDelete: "cascade"});
    models.OnlineUser.belongsTo(models.User, {foreignKey: "UserId"});

    models.User.hasMany(models.Pilot, {foreignKey: "UserId", onDelete: "cascade"});
    models.Pilot.belongsTo(models.User, {foreignKey: "UserId"});

    models.User.belongsToMany(models.Role, {through: "UserRoles"});
    models.Role.belongsToMany(models.User, {through: "UserRoles"});

    return models;
}
