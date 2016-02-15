import * as util from "util";

import {Identifiers} from "./PacketIdentifiers";

let Dissolve = require("dissolve");

export function PacketParser() {
    Dissolve.call(this);

    this.loop(function (end) {
        this.uint8le("id").int32le("length").tap(function () {
            switch (this.vars.id) {
                case Identifiers.PCKT_LOGIN_AUTH:
                    this.string("username").string("password").uint16le("port");
                    break;
                case Identifiers.PCKT_DUP_LOGIN_RQST:
                    let id_count = 0;
                    this.int32le("sid").uint8("num_ids").loop("ids", (end) => {
                        if (id_count++ === this.vars.num_ids) {
                            return end(true);
                        }

                        this.int32le("id");
                    });
                    break;

                case Identifiers.PCKT_PILOT_GET:
                    this.int32le("sid").string("pilotname").uint8("create");
                    break;
                case Identifiers.PCKT_PILOT_UPDATE:
                    let ship_kill_count = 0;
                    let medal_count = 0;
                    this.int32le("sid").string("pilot_name").string("user_name").uint32le("score")
                        .uint32le("missions_flown").uint32le("flight_time").int32le("last_flown").uint32le("kill_count")
                        .uint32le("kill_count_ok").uint32le("assists").uint32le("p_shots_fired")
                        .uint32le("p_shots_hit").uint32le("p_bonehead_hits").uint32le("s_shots_fired")
                        .uint32le("s_shots_hit").uint32le("s_bonehead_hits").int32le("rank").uint16le("num_ship_kills")
                        .loop("ship_kills", end => {
                            if (ship_kill_count++ === this.vars.num_ship_kills) {
                                return end(true);
                            }

                            this.string("name").uint16le("count");
                        }).uint16le("num_medals")
                        .loop("medals", end => {
                            if (medal_count++ === this.vars.num_medals) {
                                return end(true);
                            }

                            this.int32le("count");
                        });
                    break;

                case Identifiers.PCKT_VALID_SID_RQST:
                    this.int32le("sid");
                    break;

                case Identifiers.PCKT_PING:
                    this.int32le("time");
                    break;
                case Identifiers.PCKT_PONG:
                    this.int32le("time");
                    break;

                case Identifiers.PCKT_SLIST_REQUEST:
                    this.int32le("type").int32le("status");
                    break;
                case Identifiers.PCKT_SLIST_REQUEST_FILTER:
                    this.int32le("type").int32le("status").string("filter");
                    break;

                case Identifiers.PCKT_SERVER_START:
                    this.string("name").string("mission_name").string("title").string("campaign_name")
                        .uint8le("campaign_mode")
                        .int32le("flags").int32le("type_flags").int16le("num_players").int16le("max_players")
                        .uint8le("mode")
                        .uint8le("rank_base").uint8le("game_state").uint8le("connection_speed")
                        .string("tracker_channel");
                    break;
                case Identifiers.PCKT_SERVER_UPDATE:
                    this.string("mission_name").string("title").string("campaign_name").uint8("campaign_mode")
                        .int16le("num_players")
                        .uint8("game_state");
                    break;
                case Identifiers.PCKT_SERVER_DISCONNECT:
                    break;

                case Identifiers.PCKT_TABLES_RQST:
                    let file_count = 0;
                    this.uint16le("num_files").loop("files", (end) => {
                        if (file_count++ === this.vars.num_files) {
                            return end(true);
                        }

                        this.string("name").uint32le("crc32");
                    });
                    break;

                default:
                    // Consume all data, maybe someone else can do something with it...
                    this.buffer("data", this.vars.length - 5); // subtract 5 to account for id and length
                    break;
            }
        }).tap(function () {
            this.push(this.vars);
            this.vars = Object.create(null);
        });
    });
}
util.inherits(PacketParser, Dissolve);

PacketParser.prototype.string = function (name) {
    var len = [name, "len"].join("_");

    return this.int32le(len).tap(function () {
        this.buffer(name, this.vars[len]).tap(function () {
            delete this.vars[len];

            this.vars[name] = this.vars[name].toString("ascii");
        });
    });
};
