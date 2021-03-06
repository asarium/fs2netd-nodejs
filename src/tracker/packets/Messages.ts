"use strict";

import {IPilotPojo} from "../../db/models/Pilot";
import {IServerPojo} from "../../db/models/Server";
import {parsePackedString} from "../Utils";
import {Identifiers} from "./PacketIdentifiers";

export abstract class Message {
    private _id: number;

    constructor(id: number) {
        this._id = id;
    }

    get Id(): number {
        return this._id;
    }
}

export class LoginMessage extends Message {
    private _username: string;
    private _password: string;
    private _port: number;

    constructor(username: string, password: string, port: number) {
        super(Identifiers.PCKT_LOGIN_AUTH);
        this._username = username;
        this._password = password;
        this._port     = port;
    }

    get Username(): string {
        return this._username;
    }

    get Password(): string {
        return this._password;
    }

    get Port(): number {
        return this._port;
    }
}

export class DuplicateLoginRequest extends Message {
    private _sid: number;
    private _ids: number[];

    constructor(sid: number, ids: number[]) {
        super(Identifiers.PCKT_DUP_LOGIN_RQST);
        this._sid = sid;
        this._ids = ids;
    }

    get SessionId(): number {
        return this._sid;
    }

    get IDs(): number[] {
        return this._ids;
    }
}

export class GetPilotMessage extends Message {
    private _sessionId: number;
    private _pilotname: string;
    private _create: boolean;

    constructor(sessionId: number, pilotname: string, create: boolean) {
        super(Identifiers.PCKT_PILOT_GET);
        this._sessionId = sessionId;
        this._pilotname = pilotname;
        this._create    = create;
    }

    get SessionId(): number {
        return this._sessionId;
    }

    get Pilotname(): string {
        return this._pilotname;
    }

    get CreatePilot(): boolean {
        return this._create;
    }
}

export class UpdatePilotMessage extends Message {
    private _pilotData: IPilotPojo;
    private _sid: number;
    private _userName: string;

    constructor(sid: number, userName: string, params: IPilotPojo) {
        super(Identifiers.PCKT_PILOT_UPDATE);
        this._sid       = sid;
        this._userName  = userName;
        this._pilotData = params;
    }

    get PilotData(): IPilotPojo {
        return this._pilotData;
    }

    get SessionId(): number {
        return this._sid;
    }

    get UserName(): string {
        return this._userName;
    }
}

export class ValidSessionIDRequest extends Message {
    private _sessionId: number;

    constructor(sessionId: number) {
        super(Identifiers.PCKT_VALID_SID_RQST);
        this._sessionId = sessionId;
    }

    get SessionId(): number {
        return this._sessionId;
    }
}

//
// Messages from Server to client following
//

class BufferWriter {
    private static DEFAULT_BUFFER_SIZE = 32768;

    private _buffer: Buffer;
    private _offset: number = 0;

    constructor() {
        this._buffer = new Buffer(BufferWriter.DEFAULT_BUFFER_SIZE);
    }

    public finalize(): Buffer {
        // Write the size of the buffer
        this._buffer.writeInt32LE(this._offset, 1);

        return this._buffer.slice(0, this._offset);
    }

    public writeUInt8(x: number): void {
        this._buffer.writeUInt8(x, this._offset);
        this._offset += 1;
    }

    public writeInt16(x: number): void {
        this._buffer.writeInt16LE(x, this._offset);
        this._offset += 2;
    }

    public writeUInt16(x: number): void {
        this._buffer.writeUInt16LE(x, this._offset);
        this._offset += 2;
    }

    public writeInt32(x: number): void {
        this._buffer.writeInt32LE(x, this._offset);
        this._offset += 4;
    }

    public writeUInt32(x: number): void {
        this._buffer.writeUInt32LE(x, this._offset);
        this._offset += 4;
    }

    public writeString(x: string): void {
        // write length
        this.writeInt32(x.length);
        this._offset += this._buffer.write(x, this._offset, x.length, "utf-8");
    }
}

export class ServerListMessage extends Message {
    private _type: number;
    private _status: number;
    private _filter: string;

    constructor(type: number, status: number, filter?: string) {
        super(Identifiers.PCKT_SLIST_REQUEST_FILTER);
        this._type   = type;
        this._status = status;
        this._filter = filter;
    }

    get Type(): number {
        return this._type;
    }

    get Status(): number {
        return this._status;
    }

    get Filter(): string {
        return this._filter;
    }
}

export interface INameCRC {
    Name: string;
    CRC32: number;
}

export class TableRequestMessage extends Message {
    public crcs: INameCRC[];

    constructor(_crcs: INameCRC[]) {
        super(Identifiers.PCKT_TABLES_RQST);
        this.crcs = _crcs;
    }
}

export class MissionListRequest extends Message {
    constructor() {
        super(Identifiers.PCKT_MISSIONS_RQST);
    }
}

export class IpBanListRequest extends Message {
    constructor() {
        super(Identifiers.PCKT_BANLIST_RQST);
    }
}

export interface IServerProperties {
    name?: string;
    mission_name?: string;
    title?: string;
    campaign_name?: string;
    campaign_mode?: number;
    flags?: number;
    type_flags?: number;
    num_players?: number;
    max_players?: number;
    mode?: number;
    rank_base?: number;
    game_state?: number;
    connection_speed?: number;
    tracker_channel?: string;
}

export class ServerStartMessage extends Message {
    public properties: IServerProperties;

    constructor(props: IServerProperties) {
        super(Identifiers.PCKT_SERVER_START);
        this.properties = props;
    }
}

export class ServerUpdateMessage extends Message {
    public properties: IServerProperties;

    constructor(props: IServerProperties) {
        super(Identifiers.PCKT_SERVER_START);
        this.properties = props;
    }
}

export class ServerDisconnectMessage extends Message {
    constructor() {
        super(Identifiers.PCKT_SERVER_DISCONNECT);
    }
}

export class ChannelCountRequest extends Message {
    private _channel: string;

    constructor(channel: string) {
        super(Identifiers.PCKT_CHAT_CHAN_COUNT_RQST);
        this._channel = channel;
    }

    get Channel(): string {
        return this._channel;
    }
}

export abstract class ClientMessage extends Message {
    public abstract serialize(): Buffer;

    protected createBuffer(): BufferWriter {
        const writer: BufferWriter = new BufferWriter();
        writer.writeUInt8(this.Id);
        writer.writeInt32(0); // Dummy field which will be initialized later

        return writer;
    }
}

export class LoginReply extends ClientMessage {
    private _loginStatus: boolean;
    private _sessionId: number;
    private _numPilots: number;

    constructor(loginStatus: boolean, sessionId: number, numPilots: number) {
        super(Identifiers.PCKT_LOGIN_REPLY);
        this._loginStatus = loginStatus;
        this._sessionId   = sessionId;
        this._numPilots   = numPilots;
    }

    get LoginStatus(): boolean {
        return this._loginStatus;
    }

    get SessionId(): number {
        return this._sessionId;
    }

    get NumPilots(): number {
        return this._numPilots;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();

        buffer.writeUInt8(this._loginStatus ? 1 : 0);
        buffer.writeInt32(this._sessionId);
        buffer.writeInt16(this._numPilots);

        return buffer.finalize();
    }

}

export class PilotReply extends ClientMessage {
    private _replytype: number;
    private _pilot: IPilotPojo;

    constructor(replytype: number, pilot?: IPilotPojo) {
        super(Identifiers.PCKT_PILOT_REPLY);
        this._replytype = replytype;
        this._pilot     = pilot;
    }

    get Replytype(): number {
        return this._replytype;
    }

    get PilotData(): IPilotPojo {
        return this._pilot;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();
        buffer.writeUInt8(this._replytype);

        if (this._pilot != null) {
            let lastFlown = 0;
            if (this._pilot.LastFlown != null) {
                lastFlown = this._pilot.LastFlown.getTime() / 1000;
            }

            buffer.writeUInt32(this._pilot.Score);
            buffer.writeUInt32(this._pilot.MissionsFlown);
            buffer.writeUInt32(this._pilot.FlightTime);
            buffer.writeInt32(lastFlown); // WARNING: Will break when the 32 bit int overflows!
            buffer.writeUInt32(this._pilot.KillCount);
            buffer.writeUInt32(this._pilot.KillCountOk);
            buffer.writeUInt32(this._pilot.Assists);

            buffer.writeUInt32(this._pilot.PrimaryShotsFired);
            buffer.writeUInt32(this._pilot.PrimaryShotsHits);
            buffer.writeUInt32(this._pilot.PrimaryBoneheadHits);

            buffer.writeUInt32(this._pilot.SecondaryShotsFired);
            buffer.writeUInt32(this._pilot.SecondaryShotsHits);
            buffer.writeUInt32(this._pilot.SecondaryBoneheadHits);

            buffer.writeInt32(this._pilot.Rank);

            const shipKills = parsePackedString(this._pilot.ShipKillsPacked);
            buffer.writeInt16(shipKills.length);
            for (const entry of shipKills) {
                buffer.writeString(entry.Name);
                buffer.writeUInt16(entry.Count);
            }

            const medals = parsePackedString(this._pilot.MedalsPacked);
            buffer.writeInt16(medals.length);
            for (const entry of medals) {
                buffer.writeUInt16(entry.Count);
            }
        }

        return buffer.finalize();
    }
}

export class ValidSidReply extends ClientMessage {
    private _valid: boolean;

    constructor(valid: boolean) {
        super(Identifiers.PCKT_VALID_SID_REPLY);
        this._valid = valid;
    }

    get Valid(): boolean {
        return this._valid;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();
        buffer.writeUInt8(this._valid ? 1 : 0);

        return buffer.finalize();
    }
}

export class PingMessage extends ClientMessage {
    private _time: number;

    constructor(time: number) {
        super(Identifiers.PCKT_PING);
        this._time = time;
    }

    get Time(): number {
        return this._time;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();
        buffer.writeInt32(this._time);

        return buffer.finalize();
    }
}

export class PongMessage extends ClientMessage {
    private _time: number;

    constructor(time: number) {
        super(Identifiers.PCKT_PONG);
        this._time = time;
    }

    get Time(): number {
        return this._time;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();
        buffer.writeInt32(this._time);

        return buffer.finalize();
    }
}

export class ServerListReply extends ClientMessage {
    private _list: IServerPojo[];

    constructor(list: IServerPojo[]) {
        super(Identifiers.PCKT_SLIST_REPLY);
        this._list = list;
    }

    get List(): IServerPojo[] {
        return this._list;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();

        buffer.writeUInt16(this._list.length);
        for (const server of this._list) {
            buffer.writeInt32(server.Flags);
            buffer.writeUInt16(server.Port);
            buffer.writeString(server.Ip);
        }

        return buffer.finalize();
    }
}

export class TablesReply extends ClientMessage {
    private _valids: boolean[];

    constructor(valids: boolean[]) {
        super(Identifiers.PCKT_TABLES_REPLY);
        this._valids = valids;
    }

    get Valids(): boolean[] {
        return this._valids;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();

        buffer.writeUInt16(this._valids.length);
        for (const valid of this._valids) {
            buffer.writeUInt16(valid ? 1 : 0);
        }

        return buffer.finalize();
    }
}

export class MissionListReply extends ClientMessage {
    private _missionList: INameCRC[];

    constructor(missionList: INameCRC[]) {
        super(Identifiers.PCKT_MISSIONS_REPLY);
        this._missionList = missionList;
    }

    get MissionList(): INameCRC[] {
        return this._missionList;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();

        buffer.writeInt32(this._missionList.length);
        for (const crc of this._missionList) {
            buffer.writeString(crc.Name);
            buffer.writeUInt32(crc.CRC32);
        }

        return buffer.finalize();
    }
}

export class IpBanListReply extends ClientMessage {
    private _list: string[];

    constructor(list: string[]) {
        super(Identifiers.PCKT_BANLIST_RPLY);
        this._list = list;
    }

    get List(): string[] {
        return this._list;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();

        buffer.writeInt32(this._list.length);
        for (const entry of this._list) {
            buffer.writeString(entry);
        }

        return buffer.finalize();
    }
}

export class DuplicateLoginReply extends ClientMessage {
    private _invalid: boolean;

    constructor(invalid: boolean) {
        super(Identifiers.PCKT_DUP_LOGIN_REPLY);
        this._invalid = invalid;
    }

    get Invalid(): boolean {
        return this._invalid;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();

        buffer.writeUInt8(this._invalid ? 1 : 0);

        return buffer.finalize();
    }
}

export class PilotUpdateReply extends ClientMessage {

    private _reply: number;

    constructor(reply: number) {
        super(Identifiers.PCKT_PILOT_UREPLY);
        this._reply = reply;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();

        buffer.writeUInt8(this._reply);

        return buffer.finalize();
    }
}

export class ChannelCountReply extends ClientMessage {
    private _channel: string;
    private _count: number;

    constructor(channel: string, count: number) {
        super(Identifiers.PCKT_CHAT_CHAN_COUNT_RQST);
        this._channel = channel;
        this._count   = count;
    }

    get Channel(): string {
        return this._channel;
    }

    get Count(): number {
        return this._count;
    }

    public serialize(): Buffer {
        const buffer = this.createBuffer();

        buffer.writeString(this._channel);
        buffer.writeInt32(this._count);

        return buffer.finalize();
    }
}
