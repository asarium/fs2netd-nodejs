import * as sequelize from "sequelize";
import {Sequelize} from "sequelize";
import {DataTypes} from "sequelize";
import {IUserInstance} from "./User";

export interface IPilotPojo {
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

export interface IPilotInstance extends sequelize.Instance<IPilotPojo>, IPilotPojo {
    getUser: () => Promise<IUserInstance>;
    setUser: (user: IUserInstance) => Promise<void>;
}

export interface IPilotModel extends sequelize.Model<IPilotInstance, IPilotPojo> {
}

export function definePilot(sequ: Sequelize, types: DataTypes): IPilotModel {
    return sequ.define<IPilotInstance, IPilotPojo>("Pilot", {
        PilotName: types.STRING,

        Score:         types.INTEGER,
        MissionsFlown: types.INTEGER,
        FlightTime:    types.INTEGER,
        LastFlown:     types.INTEGER,
        KillCount:     types.INTEGER,
        KillCountOk:   types.INTEGER,
        Assists:       types.INTEGER,

        PrimaryShotsFired:   types.INTEGER,
        PrimaryShotsHits:    types.INTEGER,
        PrimaryBoneheadHits: types.INTEGER,

        SecondaryShotsFired:   types.INTEGER,
        SecondaryShotsHits:    types.INTEGER,
        SecondaryBoneheadHits: types.INTEGER,

        Rank: types.INTEGER,

        NumShipKills:    types.INTEGER,
        ShipKillsPacked: types.TEXT,

        NumMedals:    types.INTEGER,
        MedalsPacked: types.TEXT,
    });
}
