import {HandlerContext} from "../../../src/tracker/handlers/Handlers";
import {TestContext} from "./TestHandlers";
import {getHandlerContext} from "./TestHandlers";
import {handleValidSessionIDRequest} from "../../../src/tracker/handlers/MinorHandlers";
import {ValidSessionIDRequest} from "../../../src/tracker/packets/Messages";
import * as assert from "assert";
import {ValidSidReply} from "../../../src/tracker/packets/Messages";

describe("Handlers", () => {
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
});