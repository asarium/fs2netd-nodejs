
import * as supertest from "supertest";
import * as assert from "assert";
import {ADMIN_JWT} from "./TestWebInterface";
import {USER_JWT} from "./TestWebInterface";
import {TestContext} from "./TestWebInterface";

export function testAdminAccessControl(context: () => TestContext, path: string) {
    it("should deny an unauthorized user", (done) => {
        supertest.agent(context().WebInterface.App).get(path)
                 .expect(401).end((err, res) => {
            if (err) {
                return done(err);
            }

            assert.equal(res.status, 401);

            done();
        });
    });
    it("should deny access for a user without admin rights", (done) => {
        supertest.agent(context().WebInterface.App).get(path).set("Authorization", USER_JWT)
                 .expect(403).expect("Content-type", /json/).end((err, res) => {
            if (err) {
                return done(err);
            }

            assert.equal(res.status, 403);

            done();
        });
    });
}
