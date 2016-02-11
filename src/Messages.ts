import {Identifiers} from "./packets/PacketIdentifiers";
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

    writeUInt8(x: number) {
        this._buffer.writeUInt8(x, this._offset);
        this._offset += 1;
    }

    writeInt16(x: number) {
        this._buffer.writeInt16LE(x, this._offset);
        this._offset += 2;
    }

    writeInt32(x: number) {
        this._buffer.writeInt32LE(x, this._offset);
        this._offset += 4;
    }

    writeString(x: string) {
        // write length
        this.writeInt32(x.length);
        this._offset += this._buffer.write(x, this._offset, x.length, "utf-8");
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

    constructor(replytype: number) {
        super(Identifiers.PCKT_PILOT_REPLY);
        this._replytype = replytype;
    }

    serialize(): Buffer {
        var buffer = this.createBuffer();
        buffer.writeUInt8(this._replytype);

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
