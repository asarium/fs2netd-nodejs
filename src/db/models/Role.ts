import * as sequelize from "sequelize";
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import {IUserInstance} from "./User";

export const ADMIN_ROLE: string = "Admin";

export interface IRolePojo {
    Name?: string;
}

export interface IRoleInstance extends sequelize.Instance<IRolePojo>, IRolePojo {
    getUsers: (options?: any) => Promise<IUserInstance[]>;
}

export interface IRoleModel extends sequelize.Model<IRoleInstance, IRolePojo> {
}

export function defineRole(sequ: Sequelize, types: DataTypes): IRoleModel {
    return sequ.define<IRoleInstance, IRolePojo>("Role", {
        Name: {
            type:       types.STRING,
            primaryKey: true,
            unique:     true,
        },
    });
}
