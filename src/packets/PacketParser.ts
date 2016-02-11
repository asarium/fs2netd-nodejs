import * as Dissolve from "dissolve";
import * as util from "util";

import {Identifiers} from "./PacketIdentifiers";

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
