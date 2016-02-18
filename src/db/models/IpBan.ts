

import {DataTypes} from "sequelize";
import {Sequelize} from "sequelize";
import sequelize = require("sequelize");

export interface IpBanPojo {
    IpMask?: string;
    TTL?: number;
    Comment?: string;
}
export interface IpBanInstance extends sequelize.Instance<IpBanPojo>, IpBanPojo {
}
export interface IpBanModel extends sequelize.Model<IpBanInstance, IpBanPojo> {
}
export function defineIpBan(sequelize: Sequelize, DataTypes: DataTypes): IpBanModel {
    return sequelize.define<IpBanInstance, IpBanPojo>("IpBan", {
        "IpMask": DataTypes.STRING,
        "TTL": DataTypes.INTEGER,
        "Comment": DataTypes.TEXT,
    });
}