import {HandlerContext} from "../../../src/tracker/handlers/Handlers";
import {TestContext} from "./TestHandlers";
import {getHandlerContext} from "./TestHandlers";
import {handleValidSessionIDRequest} from "../../../src/tracker/handlers/MinorHandlers";
import {ValidSessionIDRequest} from "../../../src/tracker/packets/Messages";
import * as assert from "assert";
import {ValidSidReply} from "../../../src/tracker/packets/Messages";
import {handlePing} from "../../../src/tracker/handlers/MinorHandlers";
import {PingMessage} from "../../../src/tracker/packets/Messages";
import {PongMessage} from "../../../src/tracker/packets/Messages";
import {handlePong} from "../../../src/tracker/handlers/MinorHandlers";
import {getTimeMilliseconds} from "../../../src/tracker/Utils";
import {IpBanInstance} from "../../../src/tracker/db/models/IpBan";
import {IpBanPojo} from "../../../src/tracker/db/models/IpBan";
import {handleIpBanListRequest} from "../../../src/tracker/handlers/MinorHandlers";
import {IpBanListRequest} from "../../../src/tracker/packets/Messages";
import {IpBanListReply} from "../../../src/tracker/packets/Messages";
import * as Promise from "bluebird";
import * as sinon from "sinon";

describe("MinorHandlers", () => {
    let context: TestContext;
    beforeEach(() => {
        return getHandlerContext().then(ctx => context = ctx);
    });

    describe("#handleValidSessionIDRequest", () => {
        it("should accept a valid session id", () => {
            return handleValidSessionIDRequest(new ValidSessionIDRequest(42), context).then(() => {
                let lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof ValidSidReply, true);
                assert.equal((<ValidSidReply>lastMsg).Valid, true);
            });
        });
        it("should reject an invalid session id", () => {
            return handleValidSessionIDRequest(new ValidSessionIDRequest(5), context).then(() => {
                let lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof ValidSidReply, true);
                assert.equal((<ValidSidReply>lastMsg).Valid, false);
            });
        });
    });

    describe("#handlePing()", () => {
        it("should send back a pong message", () => {
            return handlePing(new PingMessage(5), context).then(() => {
                let lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof PongMessage, true);
                assert.equal((<PongMessage>lastMsg).Time, 5);
            });
        });
    });

    describe("#handlePong()", () => {
        let clock;
        before(() => {
            clock = sinon.useFakeTimers();
        });
        after(() => {
            clock.restore();
        });

        it("should update the ping of a client", () => {
            let time = getTimeMilliseconds();

            clock.tick(20);

            return handlePong(new PongMessage(time), context).then(() => {
                let lastMsg = context.Client.LastMessage;

                assert.equal(context.Client.LastPing, 20);
                assert.equal(lastMsg, null);
            });
        });
    });

    describe("#handleIpBanListRequest()", () => {
        it("should send the ip masks that are in the database", () => {
            let ipBanModel = context.Database.Models.IpBan;

            let ipBans: IpBanPojo[] = [
                {
                    IpMask: "127.0.0.1",
                    TTL: 5
                },
                {
                    IpMask: "192.168.0.0",
                    TTL: 0
                },
                {
                    IpMask: "2001:0db8:0a0b:12f0:0000:0000:0000:0001",
                    TTL: 0
                }
            ];

            return Promise.all(ipBans.map(ban => ipBanModel.create(ban))).then(() => {
                return handleIpBanListRequest(new IpBanListRequest(), context);
            }).then(() => {
                let lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof IpBanListReply, true);
                let listReply = <IpBanListReply>lastMsg;

                assert.equal(listReply.List.length, 2);

                // This implies that the order is fixed but that's not the case!
                // TODO: maybe use a library that supports testing equality of list permutations
                assert.equal(listReply.List[0], "192.168.0.0");
                assert.equal(listReply.List[1], "2001:0db8:0a0b:12f0:0000:0000:0000:0001");
            });
        });
    });
});