
import {Session} from "../../src/tracker/Session";
import * as assert from "assert";

describe("Session", () => {
    it("should accept a valid session id", () => {
        return Session.createSession().then(session => {
            assert.equal(session.isValid(session.Id), true);
        });
    });
    it("should not accept an invalid session id", () => {
        return Session.createSession().then(session => {
            assert.equal(session.isValid(session.Id + 1), true);
        });
    });
});