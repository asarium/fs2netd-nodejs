import {getHandlerContext} from "./TestHandlers";
import {TestContext} from "./TestHandlers";
import {handleDuplicateLoginMessage} from "../../../src/tracker/handlers/LoginHandler";
import {DuplicateLoginRequest} from "../../../src/tracker/packets/Messages";
import * as assert from "assert";
import * as Promise from "bluebird";
import {DuplicateLoginReply} from "../../../src/tracker/packets/Messages";
import {UserInstance} from "../../../src/db/models/User";
import {OnlineUserPojo} from "../../../src/db/models/OnlineUser";
import {handleLoginMessage} from "../../../src/tracker/handlers/LoginHandler";
import {LoginMessage} from "../../../src/tracker/packets/Messages";
import {LoginReply} from "../../../src/tracker/packets/Messages";
import {Session} from "../../../src/tracker/Session";

let PASSWORD_HASH = "$2a$10$YZyuPWiSasB/5bGVHd88DOMCBf.JbKfhtR9Y7wojlXtHxCyrd3ygm";

let USER = "test";
let PASSWORD = "test";

describe("LoginHandler", () => {
    let context: TestContext;
    let user;
    beforeEach(() => {
        return getHandlerContext().then(ctx => context = ctx).then(() => {
            return context.Database.createUser({
                                                   Username: USER,
                                                   PasswordHash: PASSWORD_HASH
                                               }).save();
        }).then(new_user => {
            user = new_user;
            context.Client.RemotePort = 0;
            context.Client.Session = null;
        });
    });

    describe("#handleLoginMessage()", () => {
        it("should accept an already authenticated user", () => {
            context.Client.Authenticated = true;
            context.Client.User = user;
            context.Client.Session = new Session(42);

            return handleLoginMessage(new LoginMessage(USER, PASSWORD, 20), context).then(() => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof LoginReply, true);
                let msg = <LoginReply>message;

                assert.equal(msg.LoginStatus, true);
                assert.equal(msg.SessionId, 42);
                assert.equal(msg.NumPilots, 0);

                assert.equal(context.Client.RemotePort, 20);
                assert.equal(context.Client.Authenticated, true);
            });
        });

        it("should reject an unknown user", () => {
            return handleLoginMessage(new LoginMessage("unknown", "foo", 20), context).then(() => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof LoginReply, true);
                let msg = <LoginReply>message;

                assert.equal(msg.LoginStatus, false);
                assert.equal(msg.SessionId, -1);
                assert.equal(msg.NumPilots, -1);

                assert.equal(context.Client.RemotePort, 0);
                assert.equal(context.Client.Authenticated, false);
            });
        });

        it("should reject a wrong password", () => {
            return handleLoginMessage(new LoginMessage(USER, "wrong", 20), context).then(() => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof LoginReply, true);
                let msg = <LoginReply>message;

                assert.equal(msg.LoginStatus, false);
                assert.equal(msg.SessionId, -1);
                assert.equal(msg.NumPilots, -1);

                assert.equal(context.Client.RemotePort, 0);
                assert.equal(context.Client.Authenticated, false);
            });
        });

        it("should accept a valid login and update the client accordingly", () => {
            return handleLoginMessage(new LoginMessage(USER, PASSWORD, 20), context).then(() => {
                return context.Database.getUserByName(USER);
            }).then(user => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof LoginReply, true);
                let msg = <LoginReply>message;

                assert.equal(msg.LoginStatus, true);
                assert.notEqual(msg.SessionId, 42); // Need a new session id
                assert.equal(msg.NumPilots, 0);

                assert.notEqual(user.LastLogin, null);
                assert.notEqual(context.Client.Session.Id, 42);
                assert.notEqual(context.Client.OnlineUser, null);

                assert.equal(context.Client.RemotePort, 20);
                assert.equal(context.Client.Authenticated, true);

                return context.Client.OnlineUser.getUser().then(associated_user => {
                    assert.equal(associated_user.Username, user.Username);
                    assert.equal(associated_user.LastLogin.getTime(), user.LastLogin.getTime());
                });
            });
        });
    });

    describe("#handleDuplicateLoginMessage()", () => {
        beforeEach(() => {
            context.Client.Session = new Session(42);
            context.Client.User = user;
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
