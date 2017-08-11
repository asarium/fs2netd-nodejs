import * as sequelize from "sequelize";
import * as Promise from "bluebird";
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import {HasId} from "./index";
import {OnlineUserInstance} from "./OnlineUser";
import {PilotInstance} from "./Pilot";
import {RoleInstance} from "./Role";

export interface IUserPojo extends HasId {
    Username?: string;
    PasswordHash?: string;
    LastLogin?: Date;
}

export interface IUserInstance extends sequelize.Instance<IUserPojo>, IUserPojo {
    countPilots: (options?: any) => Promise<number>;
    getPilots: (options?: any) => Promise<PilotInstance[]>;

    getOnlineUsers: (options?: any) => Promise<OnlineUserInstance[]>;

    getRoles: (options?: any) => Promise<RoleInstance[]>;
    countRoles: (options?: any) => Promise<number>;
    addRole: (role: RoleInstance, options?: any) => Promise<void>;
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
