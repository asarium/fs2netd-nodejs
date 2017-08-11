import {DataTypes} from "sequelize";
import {Sequelize} from "sequelize";
import * as sequelize from "sequelize";
import {IHasId} from "./index";

export interface IMissionPojo extends IHasId {
    Filename?: string;
    CRC32?: number;
    MissionType?: string;
    MaxPlayers?: number;
    Description?: string;
}

export interface IMissionInstance extends sequelize.Instance<IMissionPojo>, IMissionPojo {
}

export interface IMissionModel extends sequelize.Model<IMissionInstance, IMissionPojo> {
}

export function defineMission(sequ: Sequelize, types: DataTypes): IMissionModel {
    return sequ.define<IMissionInstance, IMissionPojo>("Mission", {
        Filename:    {
            type:   types.STRING,
            unique: true,
        },
        CRC32:       types.INTEGER,
        MissionType: types.STRING,
        MaxPlayers:  types.INTEGER,
        Description: types.TEXT,
    });
}
