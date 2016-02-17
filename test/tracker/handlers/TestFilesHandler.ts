
import * as Promise from "bluebird";
import * as assert from "assert";
import {TestContext} from "./TestHandlers";
import {getHandlerContext} from "./TestHandlers";
import {TablePojo} from "../../../src/tracker/db/models/Table";
import {TableRequestMessage} from "../../../src/tracker/packets/Messages";
import {handleTableValidation} from "../../../src/tracker/handlers/FilesHandler";
import {TablesReply} from "../../../src/tracker/packets/Messages";
import {NameCRC} from "../../../src/tracker/packets/Messages";

describe("FilesHandler", () => {
    let context: TestContext;
    beforeEach(() => {
        return getHandlerContext().then(ctx => {
            context = ctx;
            let data: TablePojo[] = [
                {
                    Filename: "weapons.tbl",
                    CRC32: 20
                },
                {
                    Filename: "ships.tbl",
                    CRC32: 500
                },
                {
                    Filename: "test.tbl",
                    CRC32: 42
                }
            ];

            return Promise.all(data.map(tbl => ctx.Database.Models.Table.create(tbl)));
        });
    });

    describe("#handleTableValidation()", () => {
        it("should handle an empty list correctly", () => {
            let msg = new TableRequestMessage([]);

            return handleTableValidation(msg, context).then(() => {
                let lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof TablesReply, true);
                assert.equal((<TablesReply>lastMsg).Valids.length, 0);
            });
        });

        it("should validate tables correctly", () => {
            let crcs: NameCRC[] = [
                {
                    Name: "ships.tbl",
                    CRC32: 10
                },
                {
                    Name: "test.tbl",
                    CRC32: 42
                },
                {
                    Name: "weapons.tbl",
                    CRC32: 20
                },
                {
                    Name: "doesnotexist",
                    CRC32: 123456
                }
            ];

            return handleTableValidation(new TableRequestMessage(crcs), context).then(() => {
                let lastMsg = context.Client.LastMessage;

                assert.equal(lastMsg instanceof TablesReply, true);
                let reply = <TablesReply>lastMsg;

                assert.equal(reply.Valids.length, 4);

                assert.equal(reply.Valids[0], false);
                assert.equal(reply.Valids[1], true);
                assert.equal(reply.Valids[2], true);
                assert.equal(reply.Valids[3], false);
            });
        });
    });
});