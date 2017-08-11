import {defineTable} from "./Table";
import {definePilot} from "./Pilot";

import {Sequelize} from "sequelize";
import {IpBanModel} from "./IpBan";
import {MissionModel} from "./Mission";
import {TableModel} from "./Table";
import {ServerModel} from "./Server";
import {PilotModel} from "./Pilot";
import {IUserModel} from "./User";
import {OnlineUserModel} from "./OnlineUser";
import sequelize = require("sequelize");
import {defineIpBan} from "./IpBan";
import {defineOnlineUser} from "./OnlineUser";
import {defineMission} from "./Mission";
import {defineServer} from "./Server";
import {defineUser} from "./User";
import {RoleModel} from "./Role";
import {defineRole} from "./Role";

export interface HasId {
    id?: number;
}

export interface Models {
    OnlineUser: OnlineUserModel,
    User: IUserModel,
    Pilot: PilotModel,
    Server: ServerModel,
    Table: TableModel,
    Mission: MissionModel,
    IpBan: IpBanModel,
    Role: RoleModel,
}

export function defineModels(sequ: Sequelize): Models {
    let models: Models = {
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
