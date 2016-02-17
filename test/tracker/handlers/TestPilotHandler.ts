import {handleGetPilotMessage} from "../../../src/tracker/handlers/PilotHandler";
import {getHandlerContext} from "./TestHandlers";
import {TestContext} from "./TestHandlers";
import {GetPilotMessage} from "../../../src/tracker/packets/Messages";
import * as assert from "assert";
import {PilotReply} from "../../../src/tracker/packets/Messages";
import {PilotPojo} from "../../../src/tracker/db/models/Pilot";
import {handleUpdatePilotMessage} from "../../../src/tracker/handlers/PilotHandler";
import {UpdatePilotMessage} from "../../../src/tracker/packets/Messages";
import {PilotUpdateReply} from "../../../src/tracker/packets/Messages";

describe("PilotHandler", () => {
    let context: TestContext;
    beforeEach(() => {
        return getHandlerContext().then(ctx => {
            context = ctx;

            return context.Database.createUser({
                                                   Username: "test"
                                               }).save();
        }).then(user => context.Client.User = user);
    });

    describe("#handleGetPilotMessage()", () => {
        it("should reject an invalid session id", () => {
            return handleGetPilotMessage(new GetPilotMessage(0, "", false), context).then(() => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof PilotReply, true);

                assert.equal((<PilotReply>message).Replytype, 3);
            });
        });

        it("should create a pilot if it doesn't exist", () => {
            return handleGetPilotMessage(new GetPilotMessage(42, "test-pilot", true), context).then(() => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof PilotReply, true);

                assert.equal((<PilotReply>message).Replytype, 1);
                assert.equal(context.Client.Session.ActivePilot, "test-pilot");

                return context.Client.User.getPilots();
            }).then(pilots => {
                assert.equal(pilots.length, 1);

                assert.equal(pilots[0].PilotName, "test-pilot");
            });
        });

        it("should not create a pilot if it wasn't requested", () => {
            return handleGetPilotMessage(new GetPilotMessage(42, "test-pilot", false), context).then(() => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof PilotReply, true);

                assert.equal((<PilotReply>message).Replytype, 5);
                assert.equal(context.Client.Session.ActivePilot, null);

                return context.Client.User.getPilots();
            }).then(pilots => {
                assert.equal(pilots.length, 0);
            });
        });

        it("should send the pilot data ", () => {
            let pilotData: PilotPojo = {
                PilotName: "test-pilot",
                Score: 42
            };

            return context.Database.createPilot(pilotData).save().then(instance => {
                return instance.setUser(context.Client.User);
            }).then(() => {
                return handleGetPilotMessage(new GetPilotMessage(42, "test-pilot", true), context);
            }).then(() => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof PilotReply, true);
                let msg = <PilotReply>message;

                assert.equal(msg.Replytype, 0);
                assert.equal(msg.PilotData.PilotName, "test-pilot");
                assert.equal(msg.PilotData.Score, 42);

                return context.Client.User.getPilots();
            }).then(pilots => {
                assert.equal(pilots.length, 1);

                assert.equal(pilots[0].PilotName, "test-pilot");
            });
        });
    });

    describe("#handleUpdatePilotMessage()", () => {
        let pilotData: PilotPojo = {
            PilotName: "test-pilot",
            Score: 42
        };

        it("should reject an invalid session", () => {
            it("should reject an invalid session id", () => {
                return handleUpdatePilotMessage(new UpdatePilotMessage(0, "test", pilotData), context).then(() => {
                    let message = context.Client.LastMessage;

                    assert.equal(message instanceof PilotUpdateReply, true);

                    assert.equal((<PilotReply>message).Replytype, 2);
                });
            });

            it("should reject a message with the wrong user name", () => {
                return handleUpdatePilotMessage(new UpdatePilotMessage(0, "nottest", pilotData), context).then(() => {
                    let message = context.Client.LastMessage;

                    assert.equal(message instanceof PilotUpdateReply, true);

                    assert.equal((<PilotReply>message).Replytype, 2);
                });
            });

            let oldData: PilotPojo = {
                PilotName: "test-pilot",
                Score: 120
            };
            it("should reject the request if there is no such pilot", () => {
                return context.Database.createPilot(oldData).save().then(instance => {
                    return instance.setUser(context.Client.User);
                }).then(() => {
                    return handleUpdatePilotMessage(new UpdatePilotMessage(0, "test", pilotData), context);
                }).then(() => {
                    let message = context.Client.LastMessage;

                    assert.equal(message instanceof PilotUpdateReply, true);

                    assert.equal((<PilotReply>message).Replytype, 0);

                    return context.Client.User.getPilots();
                }).then(pilots => {
                    assert.equal(pilots.length, 1);

                    assert.equal(pilots[0].PilotName, "test-pilot");
                    assert.equal(pilots[0].Score, 42);
                });
            });
        });
    });
});