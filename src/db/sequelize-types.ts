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
function defineServer(sequ: Sequelize): ServerModel {
    return sequ.define<ServerInstance, ServerPojo>("Server", {
        "Name": sequelize.STRING,
        "MissionName": sequelize.STRING,
        "Title": sequelize.STRING,

        "CampaignName": sequelize.STRING,
        "CampaignMode": sequelize.INTEGER,

        "Flags": sequelize.INTEGER,
        "TypeFlags": sequelize.INTEGER,

        "NumPlayers": sequelize.INTEGER,
        "MaxPlayers": sequelize.INTEGER,

        "Mode": sequelize.INTEGER,

        "RankBase": sequelize.INTEGER,

        "GameState": sequelize.INTEGER,

        "ConnectionSpeed": sequelize.INTEGER,

        "TrackerChannel": sequelize.STRING,

        "Ip": sequelize.STRING,
        "Port": sequelize.INTEGER,
    });
}

export interface TablePojo {
    Filename?: string;

    CRC32?: number;
    Description?: string;
}
export interface TableInstance extends sequelize.Instance<TablePojo>, TablePojo {
}
export interface TableModel extends sequelize.Model<TableInstance, TablePojo> {
}
function defineTable(sequ: Sequelize): TableModel {
    return sequ.define<TableInstance, TablePojo>("Table", {
        "Filename": sequelize.STRING,

        "CRC32": sequelize.INTEGER,
        "Description": sequelize.TEXT,
    });
}

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
function defineMission(sequ: Sequelize): MissionModel {
    return sequ.define<MissionInstance, MissionPojo>("Mission", {
        "Filename": sequelize.STRING,
        "CRC32": sequelize.INTEGER,
        "MissionType": sequelize.STRING,
        "MaxPlayers": sequelize.INTEGER,
        "Description": sequelize.TEXT,
    });
}

export interface IpBanPojo {
    IpMask?: string;
    TTL?: number;
    Comment?: string;
}
export interface IpBanInstance extends sequelize.Instance<IpBanPojo>, IpBanPojo {
}
export interface IpBanModel extends sequelize.Model<IpBanInstance, IpBanPojo> {
}
function defineIpBan(sequ: Sequelize): IpBanModel {
    return sequ.define<IpBanInstance, IpBanPojo>("IpBan", {
        "IpMask": sequelize.STRING,
        "TTL": sequelize.INTEGER,
        "Comment": sequelize.TEXT,
    });
}

export interface Models {
    OnlineUser: OnlineUserModel,
    User: UserModel,
    Pilot: PilotModel,
    Server: ServerModel,
    Table: TableModel,
    Mission: MissionModel,
    IpBan: IpBanModel,
}

export function defineModels(sequ: Sequelize): Models {
    let models: Models = {
        OnlineUser: defineOnlineUser(sequ),
        User: defineUser(sequ),
        Pilot: definePilot(sequ),
        Server: defineServer(sequ),
        Table: defineTable(sequ),
        Mission: defineMission(sequ),
        IpBan: defineIpBan(sequ),
    };

    models.User.hasMany(models.OnlineUser, {foreignKey: "UserId"});
    models.OnlineUser.belongsTo(models.User, {foreignKey: "UserId"});

    models.User.hasMany(models.Pilot, {foreignKey: "UserId"});
    models.Pilot.belongsTo(models.User, {foreignKey: "UserId"});

    return models;
}
