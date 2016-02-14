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
                case Identifiers.PCKT_PILOT_GET:
                    this.int32le("sid").string("pilotname").uint8("create");
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
                    this.string("name").string("mission_name").string("title").string("campaign_name").uin8le("campaign_mode")
                        .int32le("flags").int32le("type_flags").int16le("num_players").int16le("max_players").uint8le("mode")
                        .uint8le("rank_base").uint8le("game_state").uint8le("connection_speed").string("tracker_channel");
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
