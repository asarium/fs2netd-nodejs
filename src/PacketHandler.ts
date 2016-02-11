import {GetPilotMessage} from "./Messages";
'use strict';

import {Message} from "./Messages";

import {Socket} from "net";
import PacketParser = require("./js/parser");
import ids = require("./js/identifiers");

import winston = require("winston");
import {LiteEvent} from "./Events";
import {ILiteEvent} from "./Events";
import {LoginMessage} from "./Messages";
import {ValidSessionIDRequest} from "./Messages";

function convertData(data: any): Message {
    switch (data.id) {
        case ids.PCKT_LOGIN_AUTH:
            return new LoginMessage(data.id, data.username, data.password, data.port);
        case ids.PCKT_PILOT_GET:
            return new GetPilotMessage(data.sid, data.pilotname, data.create != 0);
        case ids.PCKT_VALID_SID_RQST:
            return new ValidSessionIDRequest(data.sid);
        default:
            winston.error("Unknown packet type 0x%s encountered!", data.id.toString(16));
            return null;
    }
}

export class PacketHandler {
    private _socket: Socket;
    private _parser;
    private _onMessage: LiteEvent<Message> = new LiteEvent<Message>();

    public get Message(): ILiteEvent<Message> {
        return this._onMessage;
    }

    constructor(socket: Socket) {
        this._socket = socket;

        this._parser = new PacketParser();
        this._parser.on("readable", () => {
            let e;
            while (e = this._parser.read()) {
                let message = convertData(e);

                if (message != null) {
                    this._onMessage.trigger(message);
                }
            }
        });

        this._socket.on("data", (data: Buffer) => {
            this._parser.write(data);
        });
    }
}