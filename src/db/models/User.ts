import * as sequelize from "sequelize";
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import {OnlineUserInstance} from "./OnlineUser";
import {PilotInstance} from "./Pilot";

export interface UserPojo {
    Username?: string;
    PasswordHash?: string;
    LastLogin?: Date;
}
export interface UserInstance extends sequelize.Instance<UserPojo>, UserPojo {
    countPilots:(options?: any) => Promise<number>
    getPilots:(options?: any) => Promise<PilotInstance[]>

    getOnlineUsers:(options?: any) => Promise<OnlineUserInstance[]>
}
export interface UserModel extends sequelize.Model<UserInstance, UserPojo> {
}

export function defineUser(sequelize: Sequelize, DataTypes: DataTypes): UserModel {
    return sequelize.define<UserInstance, UserPojo>("User", {
        "Username": DataTypes.STRING,
        "PasswordHash": DataTypes.STRING,
        "LastLogin": DataTypes.DATE,
    });
}