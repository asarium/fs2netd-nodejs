import {DataTypes} from "sequelize";
import {Sequelize} from "sequelize";
import sequelize = require("sequelize");
import {HasId} from "./index";

export interface IpBanPojo extends HasId {
    IpMask?: string;
    Expiration?: Date;
    Comment?: string;
}
export interface IpBanInstance extends sequelize.Instance<IpBanPojo>, IpBanPojo {
}
export interface IpBanModel extends sequelize.Model<IpBanInstance, IpBanPojo> {
}
export function defineIpBan(sequelize: Sequelize, DataTypes: DataTypes): IpBanModel {
    return sequelize.define<IpBanInstance, IpBanPojo>("IpBan", {
        "IpMask": DataTypes.STRING,
        "Expiration": DataTypes.DATE,
        "Comment": DataTypes.TEXT,
    });
}