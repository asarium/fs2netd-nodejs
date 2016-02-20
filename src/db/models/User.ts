import * as sequelize from "sequelize";
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import {OnlineUserInstance} from "./OnlineUser";
import {PilotInstance} from "./Pilot";
import {RoleInstance} from "./Role";

export interface UserPojo {
    Username?: string;
    PasswordHash?: string;
    LastLogin?: Date;
}
export interface UserInstance extends sequelize.Instance<UserPojo>, UserPojo {
    countPilots:(options?: any) => Promise<number>
    getPilots:(options?: any) => Promise<PilotInstance[]>

    getOnlineUsers:(options?: any) => Promise<OnlineUserInstance[]>

    getRoles:(options?: any) => Promise<RoleInstance[]>
    countRoles:(options?: any) => Promise<number>
    addRole:(role: RoleInstance, options?: any) => Promise<void>
}
export interface UserModel extends sequelize.Model<UserInstance, UserPojo> {
}

export function defineUser(sequelize: Sequelize, DataTypes: DataTypes): UserModel {
    return sequelize.define<UserInstance, UserPojo>("User", {
        "Username": {
            type: DataTypes.STRING,
            unique: true
        },
        "PasswordHash": DataTypes.STRING,
        "LastLogin": DataTypes.DATE,
    });
}