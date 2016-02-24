import {RouterContext} from "../../../../src/app/WebInterface";
import {initializeTestWeb} from "../../TestWebInterface";

import * as supertest from "supertest";
import * as assert from "assert";
import {ADMIN_JWT} from "../../TestWebInterface";
import {USER_JWT} from "../../TestWebInterface";
import {testAdminAccessControl} from "../../util";
import {TestWebContext} from "../../TestWebInterface";

describe("REST API: /missions", () => {
    let context: TestWebContext;
    beforeEach(() => {
        return initializeTestWeb().then(test_ctx=> {
            context = test_ctx;

            return context.Database.Models.Mission.bulkCreate([
                                                                  {
                                                                      Filename:    "test.fs2",
                                                                      CRC32:       12345,
                                                                      MissionType: "Test",
                                                                      MaxPlayers:  8,
                                                                      Description: "Test mission",
                                                                  },
                                                                  {
                                                                      Filename:    "foo.fs2",
                                                                      CRC32:       78543,
                                                                      MissionType: "bar",
                                                                      MaxPlayers:  56,
                                                                      Description: "blubb",
                                                                  }
                                                              ]);
        });
    });

    describe("GET /", () => {
        testAdminAccessControl(() => context, "get", "/api/v1/missions");

        it("should return the ip bans in the database", (done) => {
            supertest.agent(context.WebInterface.App).get("/api/v1/missions").set("Authorization", ADMIN_JWT)
                     .expect(200).expect("Content-type", /json/).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);
                assert.equal(res.body.length, 2);

                assert.equal(res.body[0].filename, "test.fs2");
                assert.equal(res.body[0].crc32, 12345);
                assert.equal(res.body[0].mission_type, "Test");
                assert.equal(res.body[0].max_players, 8);
                assert.equal(res.body[0].description, "Test mission");

                assert.equal(res.body[1].filename, "foo.fs2");
                assert.equal(res.body[1].crc32, 78543);
                assert.equal(res.body[1].mission_type, "bar");
                assert.equal(res.body[1].max_players, 56);
                assert.equal(res.body[1].description, "blubb");

                done();
            });
        });
    });

    describe("PUT /", () => {
        testAdminAccessControl(() => context, "put", "/api/v1/missions");

        it("should add a new mission to the database", (done) => {
            supertest.agent(context.WebInterface.App).put("/api/v1/missions").set("Authorization", ADMIN_JWT)
                     .expect(201).expect("Content-type", /json/).send({
                                                                          filename:     "test2.fs2",
                                                                          crc32:        44543,
                                                                          mission_type: "MissionType",
                                                                          max_players:  16,
                                                                          description:  "Another mission",
                                                                      }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 201);

                assert.equal(res.body.filename, "test2.fs2");
                assert.equal(res.body.crc32, 44543);
                assert.equal(res.body.mission_type, "MissionType");
                assert.equal(res.body.max_players, 16);
                assert.equal(res.body.description, "Another mission");

                context.Database.Models.Mission.findById(res.body.id).then(mission => {
                    assert.equal(mission.Filename, res.body.filename);
                    assert.equal(mission.CRC32, res.body.crc32);
                    assert.equal(mission.MissionType, res.body.mission_type);
                    assert.equal(mission.MaxPlayers, res.body.max_players);
                    assert.equal(mission.Description, res.body.description);

                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });

        it("should reject duplicate names", (done) => {
            supertest.agent(context.WebInterface.App).put("/api/v1/missions").set("Authorization", ADMIN_JWT)
                     .expect(409).expect("Content-type", /json/).send({
                                                                          filename:     "foo.fs2",
                                                                          crc32:        44543,
                                                                          mission_type: "MissionType",
                                                                          max_players:  16,
                                                                          description:  "Another mission",
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
        testAdminAccessControl(() => context, "post", "/api/v1/missions/1");

        it("should update the mission in the database", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/missions/1").set("Authorization", ADMIN_JWT)
                     .expect(200).send({
                                           filename:     "test2.fs2",
                                           crc32:        44543,
                                           mission_type: "MissionType",
                                           max_players:  16,
                                           description:  "Another mission",
                                       }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.body.filename, "test2.fs2");
                assert.equal(res.body.crc32, 44543);
                assert.equal(res.body.mission_type, "MissionType");
                assert.equal(res.body.max_players, 16);
                assert.equal(res.body.description, "Another mission");

                context.Database.Models.Mission.findById(res.body.id).then(mission => {
                    assert.equal(mission.Filename, res.body.filename);
                    assert.equal(mission.CRC32, res.body.crc32);
                    assert.equal(mission.MissionType, res.body.mission_type);
                    assert.equal(mission.MaxPlayers, res.body.max_players);
                    assert.equal(mission.Description, res.body.description);

                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });

        it("should reject a rename that would lead to a duplicate name", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/missions/1").set("Authorization", ADMIN_JWT)
                     .expect(409).expect("Content-type", /json/).send({
                                                                          filename:     "foo.fs2",
                                                                          crc32:        44543,
                                                                          mission_type: "MissionType",
                                                                          max_players:  16,
                                                                          description:  "Another mission",
                                                                      }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 409);

                context.Database.Models.Mission.findById(1).then(mission => {
                    assert.equal(mission.Filename, "test.fs2");
                    assert.equal(mission.CRC32, 12345);
                    assert.equal(mission.MissionType, "Test");
                    assert.equal(mission.MaxPlayers, 8);
                    assert.equal(mission.Description, "Test mission");

                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });

        it("should reject a request for an invalid id", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/missions/1000").set("Authorization", ADMIN_JWT)
                     .expect(400).send({
                                           filename:     "test2.fs2",
                                           crc32:        44543,
                                           mission_type: "MissionType",
                                           max_players:  16,
                                           description:  "Another mission",
                                       }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 400);
                done();
            });
        });
    });

    describe("DELETE /:id", () => {
        testAdminAccessControl(() => context, "delete", "/api/v1/missions/1");

        it("should delete a mission from the database", (done) => {
            supertest.agent(context.WebInterface.App).delete("/api/v1/missions/1").set("Authorization", ADMIN_JWT)
                     .expect(200).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);

                context.Database.Models.Mission.count().then(count => {
                    assert.equal(count, 1);
                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });

        it("should reject a request for an invalid id", (done) => {
            supertest.agent(context.WebInterface.App).delete("/api/v1/missions/1000")
                     .set("Authorization", ADMIN_JWT)
                     .expect(400).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 400);

                context.Database.Models.Mission.count().then(count => {
                    assert.equal(count, 2);
                    done();
                }).catch(err => {
                    done(err);
                });
            });
        });
    });
});
