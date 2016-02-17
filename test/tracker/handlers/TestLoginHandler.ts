import {getHandlerContext} from "./TestHandlers";
import {TestContext} from "./TestHandlers";
import {handleDuplicateLoginMessage} from "../../../src/tracker/handlers/LoginHandler";
import {DuplicateLoginRequest} from "../../../src/tracker/packets/Messages";
import * as assert from "assert";
import * as Promise from "bluebird";
import {DuplicateLoginReply} from "../../../src/tracker/packets/Messages";
import {UserInstance} from "../../../src/tracker/db/models/User";
import {OnlineUserPojo} from "../../../src/tracker/db/models/OnlineUser";
import {on} from "cluster";

describe("LoginHandler", () => {
    let context: TestContext;
    beforeEach(() => {
        return getHandlerContext().then(ctx => context = ctx);
    });

    describe("#handleDuplicateLoginMessage()", () => {
        beforeEach(() => {
            return context.Database.Models.User.create({
                                                           Username: "test"
                                                       }).then(userInstance => context.Client.User = userInstance);
        });

        it("should reject a wrong session id", () => {
            return handleDuplicateLoginMessage(new DuplicateLoginRequest(0, []), context).then(() => {
                let lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof DuplicateLoginReply, true);

                assert.equal((<DuplicateLoginReply>lastMsg).Invalid, true);
            });
        });

        it("should identify a single login as valid", () => {
            return context.Database.Models.OnlineUser.create({
                                                                 SessionId: 42
                                                             }).then(onlineUser => {
                return onlineUser.setUser(context.Client.User);
            }).then(() => {
                return handleDuplicateLoginMessage(new DuplicateLoginRequest(42, [42]), context);
            }).then(() => {
                let lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof DuplicateLoginReply, true);

                assert.equal((<DuplicateLoginReply>lastMsg).Invalid, false);
            });
        });

        it("should identify a duplicate login as invalid", () => {
            let data: OnlineUserPojo[] = [
                {
                    SessionId: 42,
                },
                {
                    SessionId: 5
                }
            ];

            return Promise.all(data.map(ou => context.Database.Models.OnlineUser.create(ou))).then(online_users => {
                return Promise.all(online_users.map(user => user.setUser(context.Client.User)));
            }).then(() => {
                return handleDuplicateLoginMessage(new DuplicateLoginRequest(42, [42, 5]), context);
            }).then(() => {
                let lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof DuplicateLoginReply, true);

                assert.equal((<DuplicateLoginReply>lastMsg).Invalid, true);
            });
        });
    });
});
