
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import * as sequelize from "sequelize";
import {IHasId} from "./index";

export interface ITablePojo extends IHasId {
    Filename?: string;

    CRC32?: number;
    Description?: string;
}
export interface ITableInstance extends sequelize.Instance<ITablePojo>, ITablePojo {
}
export interface ITableModel extends sequelize.Model<ITableInstance, ITablePojo> {
}

export function defineTable(sequ: Sequelize, types: DataTypes): ITableModel {
    return sequ.define<ITableInstance, ITablePojo>("Table", {
        Filename: {
            type: types.STRING,
            unique: true,
        },

        CRC32: types.INTEGER,
        Description: types.TEXT,
    });
}
