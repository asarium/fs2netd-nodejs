
import sequelize = require("sequelize");
import {IUserInstance} from "./User";
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
export interface PilotPojo {
    PilotName?: string;

    Score?: number;
    MissionsFlown?: number;
    FlightTime?: number;
    LastFlown?: Date;
    KillCount?: number;
    KillCountOk?: number;
    Assists?: number;

    PrimaryShotsFired?: number;
    PrimaryShotsHits?: number;
    PrimaryBoneheadHits?: number;

    SecondaryShotsFired?: number;
    SecondaryShotsHits?: number;
    SecondaryBoneheadHits?: number;

    Rank?: number;

    NumShipKills?: number;
    ShipKillsPacked?: string;

    NumMedals?: number;
    MedalsPacked?: string;
}
export interface PilotInstance extends sequelize.Instance<PilotPojo>, PilotPojo {
    getUser:() => Promise<IUserInstance>
    setUser:(UserInstance) => Promise<void>
}
export interface PilotModel extends sequelize.Model<PilotInstance, PilotPojo> {
}

export function definePilot(sequelize: Sequelize, DataType: DataTypes): PilotModel {
    return sequelize.define<PilotInstance, PilotPojo>("Pilot", {
        "PilotName": DataType.STRING,

        "Score": DataType.INTEGER,
        "MissionsFlown": DataType.INTEGER,
        "FlightTime": DataType.INTEGER,
        "LastFlown": DataType.INTEGER,
        "KillCount": DataType.INTEGER,
        "KillCountOk": DataType.INTEGER,
        "Assists": DataType.INTEGER,

        "PrimaryShotsFired": DataType.INTEGER,
        "PrimaryShotsHits": DataType.INTEGER,
        "PrimaryBoneheadHits": DataType.INTEGER,

        "SecondaryShotsFired": DataType.INTEGER,
        "SecondaryShotsHits": DataType.INTEGER,
        "SecondaryBoneheadHits": DataType.INTEGER,

        "Rank": DataType.INTEGER,

        "NumShipKills": DataType.INTEGER,
        "ShipKillsPacked": DataType.TEXT,

        "NumMedals": DataType.INTEGER,
        "MedalsPacked": DataType.TEXT
    });
}