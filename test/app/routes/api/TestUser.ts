import * as assert from "assert";
import * as supertest from "supertest";
import {ITestWebContext} from "../../TestWebInterface";
import {initializeTestWeb} from "../../TestWebInterface";
import {ADMIN_JWT} from "../../TestWebInterface";
import {testAdminAccessControl} from "../../util";

describe("REST API: /users", () => {
    let context: ITestWebContext;
    beforeEach(() => {
        return initializeTestWeb().then((testCtx) => {
            context = testCtx;
        });
    });

    describe("PUT /", () => {
        it("should create a new user", (done) => {
            supertest.agent(context.WebInterface.App).put("/api/v1/users")
                     .expect("Content-type", /json/).expect(201).send({
                                                                          name:     "test",
                                                                          password: "test",
                                                                      }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 201);

                assert.equal(res.body.name, "test");

                context.Database.Models.User.count({
                                                       where: {
                                                           Username: "test",
                                                       },
                                                   }).then((count) => {
                    assert.equal(count, 1);

                    done();
                }).catch((dbErr) => {
                    done(dbErr);
                });
            });
        });
        it("should reject a duplicate user", (done) => {
            supertest.agent(context.WebInterface.App).put("/api/v1/users")
                     .expect("Content-type", /json/).expect(409).send({
                                                                          name:     "test_user",
                                                                          password: "test",
                                                                      }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 409);
                done();
            });
        });
    });

    describe("GET /", () => {
        testAdminAccessControl(() => context, "get", "/api/v1/users");

        it("should return all users in the database", (done) => {
            supertest.agent(context.WebInterface.App).get("/api/v1/users").set("Authorization", ADMIN_JWT)
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

    describe("GET /:id", () => {
        testAdminAccessControl(() => context, "get", "/api/v1/users/1");

        it("should return the ip bans in the database", (done) => {
            supertest.agent(context.WebInterface.App).get("/api/v1/users/1").set("Authorization", ADMIN_JWT)
                     .expect(200).expect("Content-type", /json/).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);
                assert.deepEqual(res.body, {
                    name:       "test_admin",
                    id:         1,
                    last_login: null,
                    roles:      [
                        "Admin",
                    ],
                });
                done();
            });
        });

        it("should reject an invalid id", (done) => {
            supertest.agent(context.WebInterface.App).get("/api/v1/users/1000").set("Authorization", ADMIN_JWT)
                     .expect(400).expect("Content-type", /json/).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 400);
                done();
            });
        });
    });

    describe("DELETE /:id", () => {
        testAdminAccessControl(() => context, "delete", "/api/v1/users/1");

        it("should remove a user from the database", (done) => {
            supertest.agent(context.WebInterface.App).delete("/api/v1/users/1").set("Authorization", ADMIN_JWT)
                     .expect(200).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);

                context.Database.Models.User.count({
                                                       where: {
                                                           Username: "test_admin",
                                                       },
                                                   }).then((count) => {
                    assert.equal(count, 0);
                    done();
                }).catch((dbErr) => {
                    done(dbErr);
                });
            });
        });

        it("should reject an invalid id", (done) => {
            supertest.agent(context.WebInterface.App).delete("/api/v1/users/1000").set("Authorization", ADMIN_JWT)
                     .expect(400).expect("Content-type", /json/).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 400);
                done();
            });
        });
    });
});
