
import {DataTypes} from "sequelize";
import {Sequelize} from "sequelize";
import sequelize = require("sequelize");
export interface ServerPojo {
    Name?: string;
    MissionName?: string;
    Title?: string;

    CampaignName?: string;
    CampaignMode?: number;

    Flags?: number;
    TypeFlags?: number;

    NumPlayers?: number;
    MaxPlayers?: number;

    Mode?: number;

    RankBase?: number;

    GameState?: number;

    ConnectionSpeed?: number;

    TrackerChannel?: string;

    Ip?: string;
    Port?: number;

}
export interface ServerInstance extends sequelize.Instance<ServerPojo>, ServerPojo {
}
export interface ServerModel extends sequelize.Model<ServerInstance, ServerPojo> {
}

export function defineServer(sequelize: Sequelize, DataTypes: DataTypes): ServerModel {
    return sequelize.define<ServerInstance, ServerPojo>("Server", {
        "Name": DataTypes.STRING,
        "MissionName": DataTypes.STRING,
        "Title": DataTypes.STRING,

        "CampaignName": DataTypes.STRING,
        "CampaignMode": DataTypes.INTEGER,

        "Flags": DataTypes.INTEGER,
        "TypeFlags": DataTypes.INTEGER,

        "NumPlayers": DataTypes.INTEGER,
        "MaxPlayers": DataTypes.INTEGER,

        "Mode": DataTypes.INTEGER,

        "RankBase": DataTypes.INTEGER,

        "GameState": DataTypes.INTEGER,

        "ConnectionSpeed": DataTypes.INTEGER,

        "TrackerChannel": DataTypes.STRING,

        "Ip": DataTypes.STRING,
        "Port": DataTypes.INTEGER,
    });
}
