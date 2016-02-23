import {RouterContext} from "../../../../src/app/WebInterface";
import {initializeTestWeb} from "../../TestWebInterface";

import * as supertest from "supertest";
import * as assert from "assert";
import {ADMIN_JWT} from "../../TestWebInterface";
import {USER_JWT} from "../../TestWebInterface";
import {testAdminAccessControl} from "../../util";
import {TestWebContext} from "../../TestWebInterface";

describe("REST API: /ip_bans", () => {
    let context: TestWebContext;
    beforeEach(() => {
        return initializeTestWeb().then(test_ctx=> {
            context = test_ctx;

            return context.Database.Models.IpBan.create({
                                                            IpMask:     "127.0.0.1",
                                                            Expiration: new Date(0),
                                                            Comment:    "Test ban"
                                                        });
        });
    });

    describe("GET /", () => {
        testAdminAccessControl(() => context, "get", "/api/v1/ip_bans");

        it("should return the ip bans in the database", (done) => {
            supertest.agent(context.WebInterface.App).get("/api/v1/ip_bans").set("Authorization", ADMIN_JWT)
                     .expect(200).expect("Content-type", /json/).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);
                assert.equal(res.body.length, 1);

                assert.equal(res.body[0].ip_mask, "127.0.0.1");
                assert.equal(new Date(res.body[0].expiration).toJSON(), new Date(0).toJSON());
                assert.equal(res.body[0].comment, "Test ban");
                assert.equal(res.body[0].id, 1);

                done();
            });
        });
    });

    describe("PUT /", () => {
        testAdminAccessControl(() => context, "put", "/api/v1/ip_bans");

        it("should add a new ip ban to the database", (done) => {
            supertest.agent(context.WebInterface.App).put("/api/v1/ip_bans").set("Authorization", ADMIN_JWT)
                     .expect(201).expect("Content-type", /json/).send({
                                                                          ip_mask:    "::1",
                                                                          expiration: new Date(120),
                                                                          comment:    "New ban"
                                                                      }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 201);
                assert.equal(res.body.ip_mask, "::1");
                assert.equal(new Date(res.body.expiration).toJSON(), new Date(120).toJSON());
                assert.equal(res.body.comment, "New ban");
                assert.equal(res.body.id, 2);

                context.Database.Models.IpBan.findById(res.body.id).then(ban => {
                    assert.equal(ban.IpMask, res.body.ip_mask);
                    assert.equal(ban.Expiration.toJSON(), new Date(res.body.expiration).toJSON());
                    assert.equal(ban.Comment, res.body.comment);

                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });

        it("should reject malformed input", (done) => {
            supertest.agent(context.WebInterface.App).put("/api/v1/ip_bans").set("Authorization", ADMIN_JWT)
                     .expect(409).expect("Content-type", /json/).send({
                                                                          ip_mask:    "::1",
                                                                          expiration: "abcdefg",
                                                                          comment:    "New ban"
                                                                      }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 409);
                done();
            });
        });
    });

    describe("POST /:id", () => {
        testAdminAccessControl(() => context, "post", "/api/v1/ip_bans/1");

        it("should update the ban in the database", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/ip_bans/1").set("Authorization", ADMIN_JWT)
                     .expect(200).send({
                                           ip_mask:    "::1",
                                           expiration: new Date(0),
                                           comment:    "Test ban2"
                                       }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);
                assert.equal(res.body.ip_mask, "::1");
                assert.equal(new Date(res.body.expiration).toJSON(), new Date(0).toJSON());
                assert.equal(res.body.comment, "Test ban2");
                assert.equal(res.body.id, 1);

                context.Database.Models.IpBan.findById(res.body.id).then(ban => {
                    assert.equal(ban.IpMask, res.body.ip_mask);
                    assert.equal(ban.Expiration.toJSON(), new Date(res.body.expiration).toJSON());
                    assert.equal(ban.Comment, res.body.comment);

                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });

        it("should reject malformed input", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/ip_bans/1").set("Authorization", ADMIN_JWT)
                     .expect(409).expect("Content-type", /json/).send({
                                                                          ip_mask:    "::1",
                                                                          expiration: "abcdefg",
                                                                          comment:    "New ban"
                                                                      }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 409);

                context.Database.Models.IpBan.findById(1).then(ban => {
                    assert.equal(ban.IpMask, "127.0.0.1");
                    assert.equal(ban.Expiration.toJSON(), new Date(0).toJSON());
                    assert.equal(ban.Comment, "Test ban");

                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });

        it("should reject a request for an invalid id", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/ip_bans/1000").set("Authorization", ADMIN_JWT)
                     .expect(409).send({
                                           ip_mask:    "::1",
                                           expiration: new Date(0),
                                           comment:    "Test ban2"
                                       }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 409);

                context.Database.Models.IpBan.findById(1).then(ban => {
                    assert.equal(ban.IpMask, "127.0.0.1");
                    assert.equal(ban.Expiration.toJSON(), new Date(0).toJSON());
                    assert.equal(ban.Comment, "Test ban");

                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });
    });

    describe("DELETE /:id", () => {
        testAdminAccessControl(() => context, "delete", "/api/v1/ip_bans/1");

        it("should delete an ip ban from the database", (done) => {
            supertest.agent(context.WebInterface.App).delete("/api/v1/ip_bans/1").set("Authorization", ADMIN_JWT)
                     .expect(200).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);

                context.Database.Models.IpBan.count().then(count => {
                    assert.equal(count, 0);
                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });

        it("should reject a request for an invalid id", (done) => {
            supertest.agent(context.WebInterface.App).delete("/api/v1/ip_bans/1000").set("Authorization", ADMIN_JWT)
                     .expect(409).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 409);

                context.Database.Models.IpBan.count().then(count => {
                    assert.equal(count, 1);
                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });
    });
});