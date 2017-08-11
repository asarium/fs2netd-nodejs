import * as Promise from "bluebird";
import * as sequelize from "sequelize";
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import {IHasId} from "./index";
import {IOnlineUserInstance} from "./OnlineUser";
import {IPilotInstance} from "./Pilot";
import {IRoleInstance} from "./Role";

export interface IUserPojo extends IHasId {
    Username?: string;
    PasswordHash?: string;
    LastLogin?: Date;
}

export interface IUserInstance extends sequelize.Instance<IUserPojo>, IUserPojo {
    countPilots: (options?: any) => Promise<number>;
    getPilots: (options?: any) => Promise<IPilotInstance[]>;

    getOnlineUsers: (options?: any) => Promise<IOnlineUserInstance[]>;

    getRoles: (options?: any) => Promise<IRoleInstance[]>;
    countRoles: (options?: any) => Promise<number>;
    addRole: (role: IRoleInstance, options?: any) => Promise<void>;
}

export interface IUserModel extends sequelize.Model<IUserInstance, IUserPojo> {
}

export function defineUser(sequ: Sequelize, types: DataTypes): IUserModel {
    return sequ.define<IUserInstance, IUserPojo>("User", {
        Username:     {
            type:   types.STRING,
            unique: true,
        },
        PasswordHash: types.STRING,
        LastLogin:    types.DATE,
    });
}
