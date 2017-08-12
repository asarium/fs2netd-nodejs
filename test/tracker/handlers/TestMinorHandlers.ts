import * as assert from "assert";
import * as Promise from "bluebird";
import * as sinon from "sinon";
import {IpBanPojo} from "../../../src/db/models/IpBan";
import {handlePong} from "../../../src/tracker/handlers/MinorHandlers";
import {handlePing} from "../../../src/tracker/handlers/MinorHandlers";
import {handleValidSessionIDRequest} from "../../../src/tracker/handlers/MinorHandlers";
import {handleIpBanListRequest} from "../../../src/tracker/handlers/MinorHandlers";
import {ValidSessionIDRequest} from "../../../src/tracker/packets/Messages";
import {IpBanListRequest} from "../../../src/tracker/packets/Messages";
import {PingMessage} from "../../../src/tracker/packets/Messages";
import {IpBanListReply} from "../../../src/tracker/packets/Messages";
import {ValidSidReply} from "../../../src/tracker/packets/Messages";
import {PongMessage} from "../../../src/tracker/packets/Messages";
import {getTimeMilliseconds} from "../../../src/tracker/Utils";
import {ITestContext} from "./TestHandlers";
import {getHandlerContext} from "./TestHandlers";

describe("MinorHandlers", () => {
    let context: ITestContext;
    beforeEach(() => {
        return getHandlerContext().then((ctx) => context = ctx);
    });

    describe("#handleValidSessionIDRequest", () => {
        it("should accept a valid session id", () => {
            return handleValidSessionIDRequest(new ValidSessionIDRequest(42), context).then(() => {
                const lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof ValidSidReply, true);
                assert.equal((lastMsg as ValidSidReply).Valid, true);
            });
        });
        it("should reject an invalid session id", () => {
            return handleValidSessionIDRequest(new ValidSessionIDRequest(5), context).then(() => {
                const lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof ValidSidReply, true);
                assert.equal((lastMsg as ValidSidReply).Valid, false);
            });
        });
    });

    describe("#handlePing()", () => {
        it("should send back a pong message", () => {
            return handlePing(new PingMessage(5), context).then(() => {
                const lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof PongMessage, true);
                assert.equal((lastMsg as PongMessage).Time, 5);
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
            const time = getTimeMilliseconds();

            clock.tick(20);

            return handlePong(new PongMessage(time), context).then(() => {
                const lastMsg = context.Client.LastMessage;

                assert.equal(context.Client.LastPing, 20);
                assert.equal(lastMsg, null);
            });
        });
    });

    describe("#handleIpBanListRequest()", () => {
        it("should send the ip masks that are in the database", () => {
            const ipBanModel = context.Database.Models.IpBan;

            const ipBans: IpBanPojo[] = [
                {
                    IpMask: "127.0.0.1",
                    Expiration: new Date(0),
                },
                {
                    IpMask: "192.168.0.0",
                    Expiration: new Date(Date.now() + 5000),
                },
                {
                    IpMask: "2001:0db8:0a0b:12f0:0000:0000:0000:0001",
                    Expiration: new Date(Date.now() + 5000),
                },
            ];

            return Promise.all(ipBans.map((ban) => ipBanModel.create(ban))).then(() => {
                return handleIpBanListRequest(new IpBanListRequest(), context);
            }).then(() => {
                const lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof IpBanListReply, true);
                const listReply = lastMsg as IpBanListReply;

                assert.equal(listReply.List.length, 2);

                // This implies that the order is fixed but that's not the case!
                // TODO: maybe use a library that supports testing equality of list permutations
                assert.equal(listReply.List[0], "192.168.0.0");
                assert.equal(listReply.List[1], "2001:0db8:0a0b:12f0:0000:0000:0000:0001");
            });
        });
    });
});
