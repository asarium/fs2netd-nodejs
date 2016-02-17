
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import sequelize = require("sequelize");
export interface TablePojo {
    Filename?: string;

    CRC32?: number;
    Description?: string;
}
export interface TableInstance extends sequelize.Instance<TablePojo>, TablePojo {
}
export interface TableModel extends sequelize.Model<TableInstance, TablePojo> {
}

export function defineTable(sequelize: Sequelize, DataTypes: DataTypes): TableModel {
    return sequelize.define<TableInstance, TablePojo>("Table", {
        "Filename": DataTypes.STRING,

        "CRC32": DataTypes.INTEGER,
        "Description": DataTypes.TEXT,
    });
}