import * as assert from "assert";
import * as Promise from "bluebird";
import {getHandlerContext} from "./TestHandlers";
import {TestContext} from "./TestHandlers";
import {ServerPojo} from "../../../src/db/models/Server";
import {handleServerListMessage} from "../../../src/tracker/handlers/ServerListHandler";
import {ServerListMessage} from "../../../src/tracker/packets/Messages";
import {ServerListReply} from "../../../src/tracker/packets/Messages";
import {handleServerStartMessage} from "../../../src/tracker/handlers/ServerListHandler";
import {ServerStartMessage} from "../../../src/tracker/packets/Messages";
import {handleServerUpdateMessage} from "../../../src/tracker/handlers/ServerListHandler";
import {ServerUpdateMessage} from "../../../src/tracker/packets/Messages";
import {ServerDisconnectMessage} from "../../../src/tracker/packets/Messages";
import {handleServerDisconnectMessage} from "../../../src/tracker/handlers/ServerListHandler";
import {handleChannelCountRequest} from "../../../src/tracker/handlers/ServerListHandler";
import {ChannelCountRequest} from "../../../src/tracker/packets/Messages";
import {ChannelCountReply} from "../../../src/tracker/packets/Messages";

describe("ServerListHandler", () => {
    let context: TestContext;
    beforeEach(() => {
        return getHandlerContext().then(ctx => {
            context = ctx;
        });
    });

    describe("#handleServerListMessage()", () => {
        beforeEach(() => {
            let servers: ServerPojo[] = [
                {
                    Name: "test1",
                    TrackerChannel: "test"
                },
                {
                    Name: "test2",
                    TrackerChannel: ""
                },
                {
                    Name: "test3",
                    TrackerChannel: "foo"
                }
            ];

            return Promise.all(servers.map(data => context.Database.createServer(data).save()))
                          .then(() => context.Server.ServerList.initialize());
        });

        it("should send all servers for an unfiltered message", () => {
            return handleServerListMessage(new ServerListMessage(0, 0), context).then(() => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof ServerListReply, true);
                let msg = <ServerListReply>message;

                assert.equal(msg.List.length, 3);

                assert.equal(msg.List[0].Name, "test1");
                assert.equal(msg.List[0].TrackerChannel, "test");

                assert.equal(msg.List[1].Name, "test2");
                assert.equal(msg.List[1].TrackerChannel, "");

                assert.equal(msg.List[2].Name, "test3");
                assert.equal(msg.List[2].TrackerChannel, "foo");
            });
        });

        it("should send the right servers for a filter message", () => {
            return handleServerListMessage(new ServerListMessage(0, 0, "test"), context).then(() => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof ServerListReply, true);
                let msg = <ServerListReply>message;

                assert.equal(msg.List.length, 2);

                assert.equal(msg.List[0].Name, "test1");
                assert.equal(msg.List[0].TrackerChannel, "test");

                assert.equal(msg.List[1].Name, "test2");
                assert.equal(msg.List[1].TrackerChannel, "");
            });
        });
    });

    describe("#handleServerStartMessage()", () => {
        it("should add the server to the database", () => {
            return handleServerStartMessage(new ServerStartMessage({
                name: "test"
            }), context).then(() => {
                assert.equal(context.Client.IsServer, true);
                assert.equal(context.Client.LastMessage, null);

                return context.Database.Models.Server.findAll();
            }).then(servers => {
                assert.equal(servers.length, 1);

                assert.equal(servers[0].Name, "test");
            });
        });
    });

    describe("#handleServerUpdateMessage()", () => {
        it("should properly handle a non existing server", () => {
            context.Client.RemoteAddress = "::1";
            context.Client.RemotePort = 12435;

            return handleServerUpdateMessage(new ServerUpdateMessage({}), context).then(() => {
                return context.Database.Models.Server.findAll();
            }).then(servers => {
                assert.equal(servers.length, 0);
            });
        });

        it("should update an existing server", () => {
            context.Client.RemoteAddress = "::1";
            context.Client.RemotePort = 12435;
            context.Client.IsServer = true;

            return context.Server.ServerList.addServer({
                                                           Name: "test",
                                                           Ip: "::1",
                                                           Port: 12435,
                                                           MissionName: "test1"
                                                       }).then(() => {
                return handleServerUpdateMessage(new ServerUpdateMessage({mission_name: "test2"}), context);
            }).then(() => {
                return context.Database.Models.Server.findAll();
            }).then(servers => {
                assert.equal(servers.length, 1);

                assert.equal(servers[0].MissionName, "test2");
            });
        });
    });

    describe("#handleServerDisconnectMessage()", () => {
        it("should remove a disconnecting server", () => {
            context.Client.RemoteAddress = "::1";
            context.Client.RemotePort = 12435;
            context.Client.IsServer = true;

            return context.Server.ServerList.addServer({
                                                           Name: "test",
                                                           Ip: "::1",
                                                           Port: 12435,
                                                           MissionName: "test1"
                                                       }).then(() => {
                return handleServerDisconnectMessage(new ServerDisconnectMessage(), context);
            }).then(() => {
                assert.equal(context.Client.IsServer, false);

                return context.Database.Models.Server.findAll();
            }).then(servers => {
                assert.equal(servers.length, 0);
            });
        });
    });

    describe("#handleChannelCountRequest()", () => {
        beforeEach(() => {
            let servers: ServerPojo[] = [
                {
                    Name: "test1",
                    TrackerChannel: "test"
                },
                {
                    Name: "test2",
                    TrackerChannel: ""
                },
                {
                    Name: "test3",
                    TrackerChannel: "foo"
                }
            ];

            return Promise.all(servers.map(data => context.Database.createServer(data).save()))
                          .then(() => context.Server.ServerList.initialize());
        });

        it("should send the correct channel count", () => {
            return handleChannelCountRequest(new ChannelCountRequest("test"), context).then(() => {
                let message = context.Client.LastMessage;

                assert.equal(message instanceof ChannelCountReply, true);

                assert.equal((<ChannelCountReply>message).Channel, "test");
                assert.equal((<ChannelCountReply>message).Count, 2);
            });
        });
    });
});