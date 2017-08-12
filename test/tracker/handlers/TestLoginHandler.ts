import * as assert from "assert";
import * as Promise from "bluebird";
import {IOnlineUserPojo} from "../../../src/db/models/OnlineUser";
import {handleDuplicateLoginMessage} from "../../../src/tracker/handlers/LoginHandler";
import {handleLoginMessage} from "../../../src/tracker/handlers/LoginHandler";
import {DuplicateLoginReply} from "../../../src/tracker/packets/Messages";
import {DuplicateLoginRequest} from "../../../src/tracker/packets/Messages";
import {LoginReply} from "../../../src/tracker/packets/Messages";
import {LoginMessage} from "../../../src/tracker/packets/Messages";
import {Session} from "../../../src/tracker/Session";
import {ITestContext} from "./TestHandlers";
import {getHandlerContext} from "./TestHandlers";

const PASSWORD_HASH = "$2a$10$YZyuPWiSasB/5bGVHd88DOMCBf.JbKfhtR9Y7wojlXtHxCyrd3ygm";

const USER = "test";
const PASSWORD = "test";

describe("LoginHandler", () => {
    let context: ITestContext;
    let user;
    beforeEach(() => {
        return getHandlerContext().then((ctx) => context = ctx).then(() => {
            return context.Database.createUser({
                                                   Username: USER,
                                                   PasswordHash: PASSWORD_HASH,
                                               }).save();
        }).then((new_user) => {
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
                const message = context.Client.LastMessage;

                assert.equal(message instanceof LoginReply, true);
                const msg = message as LoginReply;

                assert.equal(msg.LoginStatus, true);
                assert.equal(msg.SessionId, 42);
                assert.equal(msg.NumPilots, 0);

                assert.equal(context.Client.RemotePort, 20);
                assert.equal(context.Client.Authenticated, true);
            });
        });

        it("should reject an unknown user", () => {
            return handleLoginMessage(new LoginMessage("unknown", "foo", 20), context).then(() => {
                const message = context.Client.LastMessage;

                assert.equal(message instanceof LoginReply, true);
                const msg = message as LoginReply;

                assert.equal(msg.LoginStatus, false);
                assert.equal(msg.SessionId, -1);
                assert.equal(msg.NumPilots, -1);

                assert.equal(context.Client.RemotePort, 0);
                assert.equal(context.Client.Authenticated, false);
            });
        });

        it("should reject a wrong password", () => {
            return handleLoginMessage(new LoginMessage(USER, "wrong", 20), context).then(() => {
                const message = context.Client.LastMessage;

                assert.equal(message instanceof LoginReply, true);
                const msg = message as LoginReply;

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
            }).then((dbUser) => {
                const message = context.Client.LastMessage;

                assert.equal(message instanceof LoginReply, true);
                const msg = message as LoginReply;

                assert.equal(msg.LoginStatus, true);
                assert.notEqual(msg.SessionId, 42); // Need a new session id
                assert.equal(msg.NumPilots, 0);

                assert.notEqual(dbUser.LastLogin, null);
                assert.notEqual(context.Client.Session.Id, 42);
                assert.notEqual(context.Client.OnlineUser, null);

                assert.equal(context.Client.RemotePort, 20);
                assert.equal(context.Client.Authenticated, true);

                return context.Client.OnlineUser.getUser().then((associated_user) => {
                    assert.equal(associated_user.Username, dbUser.Username);
                    assert.equal(associated_user.LastLogin.getTime(), dbUser.LastLogin.getTime());
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
                const lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof DuplicateLoginReply, true);

                assert.equal((lastMsg as DuplicateLoginReply).Invalid, true);
            });
        });

        it("should identify a single login as valid", () => {
            return context.Database.Models.OnlineUser.create({
                                                                 SessionId: 42,
                                                             }).then((onlineUser) => {
                return onlineUser.setUser(context.Client.User);
            }).then(() => {
                return handleDuplicateLoginMessage(new DuplicateLoginRequest(42, [42]), context);
            }).then(() => {
                const lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof DuplicateLoginReply, true);

                assert.equal((lastMsg as DuplicateLoginReply).Invalid, false);
            });
        });

        it("should identify a duplicate login as invalid", () => {
            const data: IOnlineUserPojo[] = [
                {
                    SessionId: 42,
                },
                {
                    SessionId: 5,
                },
            ];

            return Promise.all(data.map((ou) => context.Database.Models.OnlineUser.create(ou))).then((online_users) => {
                return Promise.all(online_users.map((dbUser) => dbUser.setUser(context.Client.User)));
            }).then(() => {
                return handleDuplicateLoginMessage(new DuplicateLoginRequest(42, [42, 5]), context);
            }).then(() => {
                const lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof DuplicateLoginReply, true);

                assert.equal((lastMsg as DuplicateLoginReply).Invalid, true);
            });
        });
    });
});
