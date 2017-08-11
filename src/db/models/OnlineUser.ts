import * as sequelize from "sequelize";
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import {IUserInstance} from "./User";

export interface IOnlineUserPojo {
    ClientIp?: string;
    ClientPort?: number;
    PilotName?: string;
    SessionId?: number;
}

export interface IOnlineUserInstance extends sequelize.Instance<IOnlineUserPojo>, IOnlineUserPojo {
    getUser: () => Promise<IUserInstance>;
    setUser: (user: IUserInstance) => Promise<void>;
}

export interface IOnlineUserModel extends sequelize.Model<IOnlineUserInstance, IOnlineUserPojo> {
}

export function defineOnlineUser(sequ: Sequelize, types: DataTypes): IOnlineUserModel {
    return sequ.define<IOnlineUserInstance, IOnlineUserPojo>("OnlineUser", {
        ClientIp:   types.STRING,
        ClientPort: types.INTEGER,
        PilotName:  types.STRING,
        SessionId:  types.INTEGER,
    });
}
