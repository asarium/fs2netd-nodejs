import {GetPilotMessage} from "./Messages";
'use strict';

import {Message} from "./Messages";

import {Socket} from "net";
import {PacketParser} from "./PacketParser";
import {Identifiers} from "./PacketIdentifiers";

import winston = require("winston");
import {LiteEvent} from "./../Events";
import {ILiteEvent} from "./../Events";
import {LoginMessage} from "./Messages";
import {ValidSessionIDRequest} from "./Messages";
import {PingMessage} from "./Messages";
import {PongMessage} from "./Messages";
import {ServerListMessage} from "./Messages";
import {TableRequestMessage} from "./Messages";
import {NameCRC} from "./Messages";
import {MissionListRequest} from "./Messages";
import {IpBanListRequest} from "./Messages";
import {ServerStartMessage} from "./Messages";
import {ServerUpdateMessage} from "./Messages";
import {ServerDisconnectMessage} from "./Messages";
import {DuplicateLoginRequest} from "./Messages";
import {UpdatePilotMessage} from "./Messages";
import {packString} from "../Utils";
import {ChannelCountRequest} from "./Messages";
import {PilotPojo} from "../db/models/Pilot";

function convertData(data: any): Message {
    switch (data.id) {
        case Identifiers.PCKT_LOGIN_AUTH:
            return new LoginMessage(data.username, data.password, data.port);
        case Identifiers.PCKT_DUP_LOGIN_RQST:
            return new DuplicateLoginRequest(data.sid, data.ids.map(entry => entry.id));

        case Identifiers.PCKT_PILOT_GET:
            return new GetPilotMessage(data.sid, data.pilotname, data.create != 0);
        case Identifiers.PCKT_PILOT_UPDATE:
            let pilotData: PilotPojo = {
                PilotName: data.pilot_name,
                Score:data.score,
                MissionsFlown:data.missions_flown,
                FlightTime:data.flight_time,
                LastFlown:new Date(data.last_flown * 1000),
                KillCount:data.kill_count,
                KillCountOk:data.kill_count_ok,
                Assists:data.assists,
                PrimaryShotsFired:data.p_shots_fired,
                PrimaryShotsHits:data.p_shots_hit,
                PrimaryBoneheadHits:data.p_bonehead_hits,
                SecondaryShotsFired:data.s_shots_fired,
                SecondaryShotsHits:data.s_shots_hit,
                SecondaryBoneheadHits:data.s_bonehead_hits,
                Rank:data.rank,
                NumShipKills:data.num_ship_kills,
                ShipKillsPacked:packString(data.ship_kills.map(kill => {
                    return {
                        Name: kill.name,
                        Count: kill.count,
                    };
                })),
                NumMedals:data.num_medals,
                MedalsPacked:packString(data.medals.map(medal => {
                    return {
                        Name: "",
                        Count: medal.count,
                    }
                })),
            };
            return new UpdatePilotMessage(data.sid, data.user_name, pilotData);

        case Identifiers.PCKT_VALID_SID_RQST:
            return new ValidSessionIDRequest(data.sid);

        case Identifiers.PCKT_PING:
            return new PingMessage(data.time);
        case Identifiers.PCKT_PONG:
            return new PongMessage(data.time);

        case Identifiers.PCKT_SLIST_REQUEST:
            return new ServerListMessage(data.type, data.status);
        case Identifiers.PCKT_SLIST_REQUEST_FILTER:

            return new ServerListMessage(data.type, data.status, data.filter);
        case Identifiers.PCKT_TABLES_RQST:

            return new TableRequestMessage(data.files.map(entry => {
                return {
                    Name: entry.name,
                    CRC32: entry.crc32
                }
            }));

        case Identifiers.PCKT_MISSIONS_RQST:
            return new MissionListRequest();
        case Identifiers.PCKT_BANLIST_RQST:
            return new IpBanListRequest();

        case Identifiers.PCKT_SERVER_START:
            return new ServerStartMessage(data);
        case Identifiers.PCKT_SERVER_UPDATE:
            return new ServerUpdateMessage(data);
        case Identifiers.PCKT_SERVER_DISCONNECT:
            return new ServerDisconnectMessage();

        case Identifiers.PCKT_SLIST_HB_2:
            return null; // Ignore

        case Identifiers.PCKT_CHAT_CHANNEL_UPD:
            return null; // Ignore
        case Identifiers.PCKT_CHAT_CHAN_COUNT_RQST:
            return new ChannelCountRequest(data.channel);
            break;

        default:
            winston.error(`Unknown packet type 0x${data.id.toString(16)} encountered!`, data);
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