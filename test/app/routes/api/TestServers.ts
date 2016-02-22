import {RouterContext} from "../../../../src/app/WebInterface";
import {initializeTestWeb} from "../../TestWebInterface";

import * as supertest from "supertest";
import * as assert from "assert";
import {ADMIN_JWT} from "../../TestWebInterface";
import {USER_JWT} from "../../TestWebInterface";
import {testAdminAccessControl} from "../../util";

describe("REST API: /servers", () => {
    let context: RouterContext;
    beforeEach(() => {
        return initializeTestWeb().then(test_ctx=> {
            context = test_ctx;

            return context.Database.Models.Server.create({
                                                             Name:       "Test",
                                                             NumPlayers: 8,
                                                             MaxPlayers: 16,
                                                             Ip:         "127.0.0.1",
                                                             Port:       12345
                                                         });
        });
    });

    describe("GET /", () => {
        it("should return the servers in the database", (done) => {
            supertest.agent(context.WebInterface.App).get("/api/v1/servers")
                     .expect("Content-type", /json/).expect(200).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);
                assert.equal(res.body.length, 1);

                assert.equal(res.body[0].name, "Test");
                assert.equal(res.body[0].num_players, 8);
                assert.equal(res.body[0].max_players, 16);
                assert.equal(res.body[0].id, 1);

                done();
            });
        });
    });

    describe("GET /:id", () => {
        it("should return an error for invalid id", (done) => {
            supertest.agent(context.WebInterface.App).get("/api/v1/servers/123").set("Authorization", ADMIN_JWT)
                     .expect(409).expect("Content-type", /json/).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 409);

                done();
            });
        });

        testAdminAccessControl(() => context, "/api/v1/servers/1");

        it("should return more information for an admin", (done) => {
            supertest.agent(context.WebInterface.App).get("/api/v1/servers/1").set("Authorization", ADMIN_JWT)
                     .expect(200).expect("Content-type", /json/).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);

                assert.equal(res.body.name, "Test");
                assert.equal(res.body.num_players, 8);
                assert.equal(res.body.max_players, 16);
                assert.equal(res.body.ip, "127.0.0.1");
                assert.equal(res.body.port, 12345);

                done();
            });
        });
    });
});
