
import * as sequelize from "sequelize";
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import {UserInstance} from "./User";

export interface OnlineUserPojo {
    ClientIp?: string;
    ClientPort?: number;
    PilotName?: string;
    SessionId?: number;
}
export interface OnlineUserInstance extends sequelize.Instance<OnlineUserPojo>, OnlineUserPojo {
    getUser:() => Promise<UserInstance>
    setUser:(UserInstance) => Promise<void>
}
export interface OnlineUserModel extends sequelize.Model<OnlineUserInstance, OnlineUserPojo> {
}

export function defineOnlineUser(sequelize: Sequelize, DataType: DataTypes): OnlineUserModel {
    return sequelize.define<OnlineUserInstance, OnlineUserPojo>("OnlineUser", {
        "ClientIp": DataType.STRING,
        "ClientPort": DataType.INTEGER,
        "PilotName": DataType.STRING,
        "SessionId": DataType.INTEGER,
    });
}