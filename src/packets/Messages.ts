import {Identifiers} from "./PacketIdentifiers";
import {PilotInstance} from "./../db/sequelize-types";
import {parsePackedString} from "./../Utils";
import {ServerInstance} from "./../db/sequelize-types";
'use strict';

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

    constructor(id: number, username: string, password: string, port: number) {
        super(id);
        this._username = username;
        this._password = password;
        this._port = port;
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

export class GetPilotMessage extends Message {
    private _sessionId: number;
    private _pilotname: string;
    private _create: boolean;

    constructor(sessionId: number, pilotname: string, create: boolean) {
        super(Identifiers.PCKT_PILOT_GET);
        this._sessionId = sessionId;
        this._pilotname = pilotname;
        this._create = create;
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

    finalize(): Buffer {
        // Write the size of the buffer
        this._buffer.writeInt32LE(this._offset, 1);

        return this._buffer.slice(0, this._offset);
    }

    writeUInt8(x: number): void {
        this._buffer.writeUInt8(x, this._offset);
        this._offset += 1;
    }

    writeInt16(x: number): void {
        this._buffer.writeInt16LE(x, this._offset);
        this._offset += 2;
    }

    writeUInt16(x: number): void {
        this._buffer.writeUInt16LE(x, this._offset);
        this._offset += 2;
    }

    writeInt32(x: number): void {
        this._buffer.writeInt32LE(x, this._offset);
        this._offset += 4;
    }

    writeUInt32(x: number): void {
        this._buffer.writeUInt32LE(x, this._offset);
        this._offset += 4;
    }

    writeString(x: string): void {
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
        this._type = type;
        this._status = status;
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

export interface NameCRC {
    Name: string;
    CRC32: number;
}

export class TableRequestMessage extends Message {
    CRCs: NameCRC[];

    constructor(CRCs: NameCRC[]) {
        super(Identifiers.PCKT_TABLES_RQST);
        this.CRCs = CRCs;
    }
}

export abstract class ClientMessage extends Message {
    public abstract serialize(): Buffer;

    protected createBuffer(): BufferWriter {
        let writer: BufferWriter = new BufferWriter();
        writer.writeUInt8(this.Id);
        writer.writeInt32(0); // Dummy field which will be initialized later

        return writer;
    }
}

export class LoginReply extends ClientMessage {
    private _login_status: boolean;
    private _session_id: number;
    private _num_pilots: number;


    constructor(login_status: boolean, session_id: number, num_pilots: number) {
        super(Identifiers.PCKT_LOGIN_REPLY);
        this._login_status = login_status;
        this._session_id = session_id;
        this._num_pilots = num_pilots;
    }

    serialize(): Buffer {
        var buffer = this.createBuffer();

        buffer.writeUInt8(this._login_status ? 1 : 0);
        buffer.writeInt32(this._session_id);
        buffer.writeInt16(this._num_pilots);

        return buffer.finalize();
    }

}

export class PilotReply extends ClientMessage {
    private _replytype: number;
    private _pilot: PilotInstance;

    constructor(replytype: number, pilot?: PilotInstance) {
        super(Identifiers.PCKT_PILOT_REPLY);
        this._replytype = replytype;
        this._pilot = pilot;
    }

    serialize(): Buffer {
        var buffer = this.createBuffer();
        buffer.writeUInt8(this._replytype);

        if (this._pilot != null) {
            let lastFlown = 0;
            if (this._pilot.LastFlown != null) {
                lastFlown = this._pilot.LastFlown.getTime();
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

            let shipKills = parsePackedString(this._pilot.ShipKillsPacked);
            buffer.writeInt16(shipKills.length);
            for (let entry of shipKills) {
                buffer.writeString(entry.Name);
                buffer.writeUInt16(entry.Count);
            }

            let medals = parsePackedString(this._pilot.MedalsPacked);
            buffer.writeInt16(medals.length);
            for (let entry of medals) {
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

    public serialize(): Buffer {
        var buffer = this.createBuffer();
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
        var buffer = this.createBuffer();
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
        var buffer = this.createBuffer();
        buffer.writeInt32(this._time);

        return buffer.finalize();
    }
}

export class ServerListReply extends ClientMessage {
    private _list: ServerInstance[];

    constructor(list: ServerInstance[]) {
        super(Identifiers.PCKT_SLIST_REPLY);
        this._list = list;
    }

    serialize(): Buffer {
        var buffer = this.createBuffer();

        buffer.writeUInt16(this._list.length);
        for (let server of this._list) {
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

    serialize(): Buffer {
        var buffer = this.createBuffer();

        buffer.writeUInt16(this._valids.length);
        for (let valid of this._valids) {
            buffer.writeUInt16(valid ? 1 : 0);
        }

        return buffer.finalize();
    }
}
