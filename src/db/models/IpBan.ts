import {DataTypes} from "sequelize";
import {Sequelize} from "sequelize";
import sequelize = require("sequelize");
import {IHasId} from "./index";

export interface IpBanPojo extends IHasId {
    IpMask?: string;
    Expiration?: Date;
    Comment?: string;
}

export interface IpBanInstance extends sequelize.Instance<IpBanPojo>, IpBanPojo {
}

export interface IpBanModel extends sequelize.Model<IpBanInstance, IpBanPojo> {
}

export function defineIpBan(sequ: Sequelize, types: DataTypes): IpBanModel {
    return sequ.define<IpBanInstance, IpBanPojo>("IpBan", {
        IpMask:     types.STRING,
        Expiration: types.DATE,
        Comment:    types.TEXT,
    });
}
