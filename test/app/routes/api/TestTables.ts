import * as assert from "assert";
import * as supertest from "supertest";
import {IRouterContext} from "../../../../src/app/WebInterface";
import {initializeTestWeb} from "../../TestWebInterface";
import {ADMIN_JWT} from "../../TestWebInterface";
import {USER_JWT} from "../../TestWebInterface";
import {ITestWebContext} from "../../TestWebInterface";
import {testAdminAccessControl} from "../../util";

describe("REST API: /tables", () => {
    let context: ITestWebContext;
    beforeEach(() => {
        return initializeTestWeb().then((testCtx) => {
            context = testCtx;

            return context.Database.Models.Table.bulkCreate([
                                                                  {
                                                                      Filename:    "test.tbl",
                                                                      CRC32:       12345,
                                                                      Description: "Test table",
                                                                  },
                                                                  {
                                                                      Filename:    "foo.tbl",
                                                                      CRC32:       78543,
                                                                      Description: "blubb",
                                                                  },
                                                              ]);
        });
    });

    describe("GET /", () => {
        testAdminAccessControl(() => context, "get", "/api/v1/tables");

        it("should return the ip bans in the database", (done) => {
            supertest.agent(context.WebInterface.App).get("/api/v1/tables").set("Authorization", ADMIN_JWT)
                     .expect(200).expect("Content-type", /json/).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);
                assert.equal(res.body.length, 2);

                assert.equal(res.body[0].filename, "test.tbl");
                assert.equal(res.body[0].crc32, 12345);
                assert.equal(res.body[0].description, "Test table");

                assert.equal(res.body[1].filename, "foo.tbl");
                assert.equal(res.body[1].crc32, 78543);
                assert.equal(res.body[1].description, "blubb");

                done();
            });
        });
    });

    describe("PUT /", () => {
        testAdminAccessControl(() => context, "put", "/api/v1/tables");

        it("should add a new table to the database", (done) => {
            supertest.agent(context.WebInterface.App).put("/api/v1/tables").set("Authorization", ADMIN_JWT)
                     .expect(201).expect("Content-type", /json/).send({
                                                                          filename:     "test2.tbl",
                                                                          crc32:        44543,
                                                                          description:  "Another table",
                                                                      }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 201);

                assert.equal(res.body.filename, "test2.tbl");
                assert.equal(res.body.crc32, 44543);
                assert.equal(res.body.description, "Another table");

                context.Database.Models.Table.findById(res.body.id).then((table) => {
                    assert.equal(table.Filename, res.body.filename);
                    assert.equal(table.CRC32, res.body.crc32);
                    assert.equal(table.Description, res.body.description);

                    done();
                }).catch((dbErr) => {
                    done(dbErr);
                });
            });
        });

        it("should reject duplicate names", (done) => {
            supertest.agent(context.WebInterface.App).put("/api/v1/tables").set("Authorization", ADMIN_JWT)
                     .expect(409).expect("Content-type", /json/).send({
                                                                          filename:     "foo.tbl",
                                                                          crc32:        44543,
                                                                          description:  "Another table",
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
        testAdminAccessControl(() => context, "post", "/api/v1/tables/1");

        it("should update the table in the database", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/tables/1").set("Authorization", ADMIN_JWT)
                     .expect(200).send({
                                           filename:     "test2.tbl",
                                           crc32:        44543,
                                           description:  "Another table",
                                       }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.body.filename, "test2.tbl");
                assert.equal(res.body.crc32, 44543);
                assert.equal(res.body.description, "Another table");

                context.Database.Models.Table.findById(res.body.id).then((table) => {
                    assert.equal(table.Filename, res.body.filename);
                    assert.equal(table.CRC32, res.body.crc32);
                    assert.equal(table.Description, res.body.description);

                    done();
                }).catch((dbErr) => {
                    done(dbErr);
                });
            });
        });

        it("should reject a rename that would lead to a duplicate name", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/tables/1").set("Authorization", ADMIN_JWT)
                     .expect(409).expect("Content-type", /json/).send({
                                                                          filename:     "foo.tbl",
                                                                          crc32:        44543,
                                                                          description:  "Another table",
                                                                      }).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 409);

                context.Database.Models.Table.findById(1).then((table) => {
                    assert.equal(table.Filename, "test.tbl");
                    assert.equal(table.CRC32, 12345);
                    assert.equal(table.Description, "Test table");

                    done();
                }).catch((dbErr) => {
                    done(dbErr);
                });
            });
        });

        it("should reject a request for an invalid id", (done) => {
            supertest.agent(context.WebInterface.App).post("/api/v1/tables/1000").set("Authorization", ADMIN_JWT)
                     .expect(400).send({
                                           filename:     "test2.tbl",
                                           crc32:        44543,
                                           description:  "Another table",
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
        testAdminAccessControl(() => context, "delete", "/api/v1/tables/1");

        it("should delete a table from the database", (done) => {
            supertest.agent(context.WebInterface.App).delete("/api/v1/tables/1").set("Authorization", ADMIN_JWT)
                     .expect(200).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 200);

                context.Database.Models.Table.count().then((count) => {
                    assert.equal(count, 1);
                    done();
                }).catch((dbErr) => {
                    done(dbErr);
                });
            });
        });

        it("should reject a request for an invalid id", (done) => {
            supertest.agent(context.WebInterface.App).delete("/api/v1/tables/1000")
                     .set("Authorization", ADMIN_JWT)
                     .expect(400).end((err, res) => {
                if (err) {
                    return done(err);
                }

                assert.equal(res.status, 400);

                context.Database.Models.Table.count().then((count) => {
                    assert.equal(count, 2);
                    done();
                }).catch((dbErr) => {
                    done(dbErr);
                });
            });
        });
    });
});
