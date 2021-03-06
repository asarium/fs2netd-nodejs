import * as assert from "assert";
import * as Promise from "bluebird";
import {IMissionPojo} from "../../../src/db/models/Mission";
import {ITablePojo} from "../../../src/db/models/Table";
import {handleMissionListRequest} from "../../../src/tracker/handlers/FilesHandler";
import {handleTableValidation} from "../../../src/tracker/handlers/FilesHandler";
import {TableRequestMessage} from "../../../src/tracker/packets/Messages";
import {TablesReply} from "../../../src/tracker/packets/Messages";
import {INameCRC} from "../../../src/tracker/packets/Messages";
import {MissionListRequest} from "../../../src/tracker/packets/Messages";
import {MissionListReply} from "../../../src/tracker/packets/Messages";
import {getHandlerContext} from "./TestHandlers";
import {ITestContext} from "./TestHandlers";

describe("FilesHandler", () => {
    let context: ITestContext;
    beforeEach(() => {
        return getHandlerContext().then((ctx) => {
            context                = ctx;
            const data: ITablePojo[] = [
                {
                    Filename: "weapons.tbl",
                    CRC32: 20,
                },
                {
                    Filename: "ships.tbl",
                    CRC32: 500,
                },
                {
                    Filename: "test.tbl",
                    CRC32: 42,
                },
            ];

            return Promise.all(data.map((tbl) => ctx.Database.Models.Table.create(tbl)));
        }).then(() => {
            const data: IMissionPojo[] = [
                {
                    Filename: "test1.fs2",
                    CRC32: 5,
                },
                {
                    Filename: "bla.fs2",
                    CRC32: 16,
                },
                {
                    Filename: "foo.fs2",
                    CRC32: 42,
                },
                {
                    Filename: "bar.fs2",
                    CRC32: 12345,
                },
                {
                    Filename: "baz.fs2",
                    CRC32: 3534987,
                },
            ];
            return Promise.all(data.map((d) => context.Database.Models.Mission.create(d)));
        });
    });

    describe("#handleTableValidation()", () => {
        it("should handle an empty list correctly", () => {
            const msg = new TableRequestMessage([]);

            return handleTableValidation(msg, context).then(() => {
                const lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof TablesReply, true);
                assert.equal((lastMsg as TablesReply).Valids.length, 0);
            });
        });

        it("should validate tables correctly", () => {
            const crcs: INameCRC[] = [
                {
                    Name: "ships.tbl",
                    CRC32: 10,
                },
                {
                    Name: "test.tbl",
                    CRC32: 42,
                },
                {
                    Name: "weapons.tbl",
                    CRC32: 20,
                },
                {
                    Name: "doesnotexist",
                    CRC32: 123456,
                },
            ];

            return handleTableValidation(new TableRequestMessage(crcs), context).then(() => {
                const lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof TablesReply, true);
                const reply = lastMsg as TablesReply;

                assert.equal(reply.Valids.length, 4);

                assert.equal(reply.Valids[0], false);
                assert.equal(reply.Valids[1], true);
                assert.equal(reply.Valids[2], true);
                assert.equal(reply.Valids[3], false);
            });
        });
    });

    describe("#handleMissionListRequest()", () => {
        it("should return all missions in the databas", () => {
            return handleMissionListRequest(new MissionListRequest(), context).then(() => {
                const lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof MissionListReply, true);
                const reply = lastMsg as MissionListReply;

                assert.equal(reply.MissionList.length, 5);

                assert.equal(reply.MissionList[0].Name, "test1.fs2");
                assert.equal(reply.MissionList[0].CRC32, 5);

                assert.equal(reply.MissionList[1].Name, "bla.fs2");
                assert.equal(reply.MissionList[1].CRC32, 16);

                assert.equal(reply.MissionList[2].Name, "foo.fs2");
                assert.equal(reply.MissionList[2].CRC32, 42);

                assert.equal(reply.MissionList[3].Name, "bar.fs2");
                assert.equal(reply.MissionList[3].CRC32, 12345);

                assert.equal(reply.MissionList[4].Name, "baz.fs2");
                assert.equal(reply.MissionList[4].CRC32, 3534987);
            });
        });
    });
});
