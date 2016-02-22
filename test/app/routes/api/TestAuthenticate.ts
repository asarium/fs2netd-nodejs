import {RouterContext} from "../../../../src/app/WebInterface";
import {initializeTestWeb} from "../../TestWebInterface";

import * as supertest from "supertest";
import * as assert from "assert";

describe("REST API: /authenticate", () => {
    let context: RouterContext;
    beforeEach(() => {
        return initializeTestWeb().then(test_ctx=> {
            context = test_ctx;
        });
    });

    describe("POST /", () => {
        it("should authorize a valid login", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/authenticate").send({
                                                                                            name:     "test_user",
                                                                                            password: "test"
                                                                                        })
                     .expect("Content-type", /json/).expect(200).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);
                assert.notEqual(res.body.token, null);

                done();
            });
        });
        it("should not authorize an invalid login", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/authenticate").send({
                                                                                            name:     "test_user",
                                                                                            password: "nottest"
                                                                                        })
                     .expect("Content-type", /json/).expect(401).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 401);

                done();
            });
        });
    });
});
