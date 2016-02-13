/// <reference path="../../typings/tsd.d.ts" />

import * as sequelize from "sequelize";
import * as Promise from "bluebird";
import {Sequelize} from "sequelize";
import {Model} from "sequelize";

export interface OnlineUserPojo {
    ClientIp?: string;
    ClientPort?: number;
    PilotName?: string;
    SessionId?: number;
}
export interface OnlineUserInstance extends sequelize.Instance<OnlineUserPojo>, OnlineUserPojo {
    getUser:() => Promise<UserInstance>
    setUser:(UserInstance) => Promise<void>
}
export interface OnlineUserModel extends sequelize.Model<OnlineUserInstance, OnlineUserPojo> {
}
function defineOnlineUser(sequ: Sequelize): OnlineUserModel {
    return sequ.define<OnlineUserInstance, OnlineUserPojo>("OnlineUser", {
        "ClientIp": sequelize.STRING,
        "ClientPort": sequelize.INTEGER,
        "PilotName": sequelize.STRING,
        "SessionId": sequelize.INTEGER,
    });
}

export interface UserPojo {
    Username?: string;
    PasswordHash?: string;
    LastLogin?: Date;
}
export interface UserInstance extends sequelize.Instance<UserPojo>, UserPojo {
    countPilots:(options?: any) => Promise<number>
    getPilots:(options?: any) => Promise<PilotInstance[]>
}
export interface UserModel extends sequelize.Model<UserInstance, UserPojo> {
}
function defineUser(sequ: Sequelize): UserModel {
    // The UserInstance interface functions are defined below, it's a bit ugly but I don't see a better way
    return sequ.define<UserInstance, UserPojo>("User", {
        "Username": sequelize.STRING,
        "PasswordHash": sequelize.STRING,
        "LastLogin": sequelize.DATE,
    });
}

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
    getUser:() => Promise<UserInstance>
    setUser:(UserInstance) => Promise<void>
}
export interface PilotModel extends sequelize.Model<PilotInstance, PilotPojo> {
}
function definePilot(sequ: Sequelize): PilotModel {
    return sequ.define<PilotInstance, PilotPojo>("Pilot", {
        "PilotName": sequelize.STRING,

        "Score": sequelize.INTEGER,
        "MissionsFlown": sequelize.INTEGER,
        "FlightTime": sequelize.INTEGER,
        "LastFlown": sequelize.INTEGER,
        "KillCount": sequelize.INTEGER,
        "KillCountOk": sequelize.INTEGER,
        "Assists": sequelize.INTEGER,

        "PrimaryShotsFired": sequelize.INTEGER,
        "PrimaryShotsHits": sequelize.INTEGER,
        "PrimaryBoneheadHits": sequelize.INTEGER,

        "SecondaryShotsFired": sequelize.INTEGER,
        "SecondaryShotsHits": sequelize.INTEGER,
        "SecondaryBoneheadHits": sequelize.INTEGER,

        "Rank": sequelize.INTEGER,

        "NumShipKills": sequelize.INTEGER,
        "ShipKillsPacked": sequelize.TEXT,

        "NumMedals": sequelize.INTEGER,
        "MedalsPacked": sequelize.TEXT
    });
}

export interface Models {
    OnlineUser: OnlineUserModel,
    User: UserModel,
    Pilot: PilotModel,
}

export function defineModels(sequ: Sequelize): Models {
    let models: Models = {
        OnlineUser: defineOnlineUser(sequ),
        User: defineUser(sequ),
        Pilot: definePilot(sequ),
    };

    models.User.hasMany(models.OnlineUser, {foreignKey: "UserId"});
    models.OnlineUser.belongsTo(models.User, {foreignKey: "UserId"});

    models.User.hasMany(models.Pilot, {foreignKey: "UserId"});
    models.Pilot.belongsTo(models.User, {foreignKey: "UserId"});

    return models;
}
