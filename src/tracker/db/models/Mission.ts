
import {DataTypes} from "sequelize";
import {Sequelize} from "sequelize";
import sequelize = require("sequelize");
export interface MissionPojo {
    Filename?: string;
    CRC32?: number;
    MissionType?: string;
    MaxPlayers?: number;
    Description?: string;
}
export interface MissionInstance extends sequelize.Instance<MissionPojo>, MissionPojo {
}
export interface MissionModel extends sequelize.Model<MissionInstance, MissionPojo> {
}
export function defineMission(sequelize: Sequelize, DataType: DataTypes): MissionModel {
    return sequelize.define<MissionInstance, MissionPojo>("Mission", {
        "Filename": DataType.STRING,
        "CRC32": DataType.INTEGER,
        "MissionType": DataType.STRING,
        "MaxPlayers": DataType.INTEGER,
        "Description": DataType.TEXT,
    });
}
