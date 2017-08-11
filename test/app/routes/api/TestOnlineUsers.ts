import {IRouterContext} from "../../../../src/app/WebInterface";
import {initializeTestWeb} from "../../TestWebInterface";

import * as supertest from "supertest";
import * as assert from "assert";
import * as Promise from "bluebird";
import {TestWebContext} from "../../TestWebInterface";

describe("REST API: /authenticate", () => {
    let context: TestWebContext;
    beforeEach(() => {
        return initializeTestWeb().then(test_ctx=> {
            context = test_ctx;

            return context.Database.Models.OnlineUser.bulkBuild([
                                                                     {
                                                                         PilotName: "test"
                                                                     },
                                                                     {
                                                                         PilotName: "test2"
                                                                     }
                                                                 ]);
        }).then(onlineusers => {
            return Promise.all([onlineusers[0].setUser(context.TestAdmin), onlineusers[1].setUser(context.TestUser)]);
        });
    });

    describe("GET /", () => {
        it("should return all online users", (done) => {
            supertest.agent(context.WebInterface.App).get("/api/v1/onlineusers")
                     .expect(200).expect("Content-type", /json/).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);
                assert.equal(res.body.length, 2);

                assert.equal(res.body[0].name, "test_admin");
                assert.equal(res.body[1].name, "test_user");

                done();
            });
        });
    });
});
