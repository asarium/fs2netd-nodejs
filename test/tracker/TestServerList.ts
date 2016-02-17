import {Database} from "../../src/tracker/db/Database";
import {initializeTestDatabase} from "./db/TestDatabase";
import {ServerList} from "../../src/tracker/ServerList";
import * as assert from "assert";
import * as sinon from "sinon";

describe("ServerList", () => {
    let list: ServerList;
    let db: Database;
    let clock;
    before(() => {
        clock = sinon.useFakeTimers();
    });
    after(() => {
        clock.restore();
    });

    beforeEach(() => {
        return initializeTestDatabase().then(testDb => {
            db = testDb;
            list = new ServerList(testDb);
        });
    });

    it("should start with an empty list", () => {
        assert.equal(list.Servers.length, 0);
    });

    it("should initialize with the servers from the database", () => {
        return db.Models.Server.create({
                                           Name: "TestServer"
                                       }).then(() => {
            return list.initialize();
        }).then(() => {
            assert.equal(list.Servers.length, 1);
            assert.equal(list.Servers[0].Name, "TestServer");
        });
    });

    it("should add a server to the database", () => {
        return list.addServer({
                                  Name: "Test",
                              }).then(() => {
            return db.Models.Server.findAll();
        }).then(servers => {
            assert.equal(servers.length, 1);
            assert.equal(servers[0].Name, "Test");
        });
    });

    it("should handle getting a server properly", () => {
        return list.addServer({
                                  Name: "Test",
                                  Ip: "127.0.0.1",
                                  Port: 12345,
                              }).then(() => {
            let server = list.getServer("127.0.0.1", 12345);

            assert.notEqual(server, null);
        });
    });

    it("should update a server properly", () => {
        return list.addServer({
                                  Name: "Test",
                                  Ip: "127.0.0.1",
                                  Port: 12345,
                              }).then(() => {
            return db.Models.Server.find();
        }).then(server => {
            server.Name = "Test2";

            return list.updateServer(server);
        }).then(() => {
            return db.Models.Server.find();
        }).then(server => {
            assert.equal(server.Name, "Test2");
        });
    });

    it("should remove a server properly", () => {
        return list.addServer({
                                  Name: "Test",
                                  Ip: "127.0.0.1",
                                  Port: 12345,
                              }).then(server => {
            return list.removeServer(server);
        }).then(() => {
            return db.Models.Server.count();
        }).then(count => {
            assert.equal(count, 0);
        });
    });

    it("should expire servers correctly", () => {
        return list.addServer({
                                  Name: "test1"
                              }).then(() => {
            clock.tick(60 * 1000);

            return list.addServer({
                                      Name: "test2"
                                  });
        }).then(() => {
            clock.tick(4.5 * 60 * 1000);

            return list.expireServers();
        }).then(() => {
            assert.equal(list.Servers.length, 1);
            assert.equal(list.Servers[0].Name, "test2");

            return db.Models.Server.findAll();
        }).then(servers => {
            assert.equal(servers.length, 1);
            assert.equal(servers[0].Name, "test2");
        });
    });
});