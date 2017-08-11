import {DataTypes} from "sequelize";
import {Sequelize} from "sequelize";
import * as sequelize from "sequelize";
import {IHasId} from "./index";

export interface IServerPojo extends IHasId {
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

export interface IServerInstance extends sequelize.Instance<IServerPojo>, IServerPojo {
}

export interface IServerModel extends sequelize.Model<IServerInstance, IServerPojo> {
}

export function defineServer(sequ: Sequelize, types: DataTypes): IServerModel {
    return sequ.define<IServerInstance, IServerPojo>("Server", {
        Name:        types.STRING,
        MissionName: types.STRING,
        Title:       types.STRING,

        CampaignName: types.STRING,
        CampaignMode: types.INTEGER,

        Flags:     types.INTEGER,
        TypeFlags: types.INTEGER,

        NumPlayers: types.INTEGER,
        MaxPlayers: types.INTEGER,

        Mode: types.INTEGER,

        RankBase: types.INTEGER,

        GameState: types.INTEGER,

        ConnectionSpeed: types.INTEGER,

        TrackerChannel: types.STRING,

        Ip:   types.STRING,
        Port: types.INTEGER,
    });
}
