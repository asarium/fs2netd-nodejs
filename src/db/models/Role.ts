import * as sequelize from "sequelize";
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import {UserInstance} from "./User";

export const ADMIN_ROLE: string = "Admin";

export interface RolePojo {
    Name?: string;
}
export interface RoleInstance extends sequelize.Instance<RolePojo>, RolePojo {
    getUsers:(options?: any) => Promise<UserInstance[]>
}
export interface RoleModel extends sequelize.Model<RoleInstance, RolePojo> {
}

export function defineRole(sequelize: Sequelize, DataTypes: DataTypes): RoleModel {
    return sequelize.define<RoleInstance, RolePojo>("Role", {
        "Name": {
            type: DataTypes.STRING,
            unique: true
        },
    });
}