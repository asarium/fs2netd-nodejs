import * as express from "express";
import {Router} from "express";
import {RequestHandler} from "express";
import {ADMIN_ROLE} from "../../../db/models/Role";
import {TablePojo} from "../../../db/models/Table";
import {IUserInstance} from "../../../db/models/User";
import {IRouterContext} from "../../WebInterface";
import {authenticate} from "./authentication";
import {checkUserRole} from "./authentication";

import * as promiseRouter from "express-promise-router";

export = (context: IRouterContext): Router => {
    const router = promiseRouter();

    router.get("/", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        const tables = await context.Database.Models.Table.findAll();

        const jsondata = tables.map((table) => {
            return {
                filename:    table.Filename,
                crc32:       table.CRC32,
                description: table.Description,
                id:          table.id,
            };
        });

        res.status(200).json(jsondata);
    });

    router.put("/", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        if (typeof req.body.filename !== "string" || typeof req.body.crc32 !== "number" ||
            typeof req.body.description !== "string") {
            res.status(400).json({
                                     status: "bad_request",
                                     reason: "Parameters were invalid",
                                     errors: [
                                         "Invalid ID specified",
                                     ],
                                 });
            return;
        }

        const data: TablePojo = {
            Filename:    req.body.filename,
            CRC32:       req.body.crc32,
            Description: req.body.description,
        };

        const count = await context.Database.Models.Table.count({
                                                                    where: {
                                                                        Filename: req.body.filename,
                                                                    },
                                                                });
        if (count !== 0) {
            res.status(409).json({
                                     err: "Table already exists!",
                                 });
            return null;
        }

        const table = await context.Database.Models.Table.create(data);

        res.status(201).json({
                                 filename:    table.Filename,
                                 crc32:       table.CRC32,
                                 description: table.Description,
                                 id:          table.id,
                             });
    });

    router.post("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        const table = await context.Database.Models.Table.findById(req.params.id);

        if (!table) {
            res.status(400).json({
                                     status: "bad_request",
                                     reason: "Parameters were invalid",
                                     errors: [
                                         "Invalid ID specified",
                                     ],
                                 });
            return;
        }

        if (req.body.filename !== table.Filename) {
            // Name will be changed, check if there is another table with the same name
            const count = await context.Database.Models.Table.count({
                                                                        where: {
                                                                            Filename: req.body.filename,
                                                                        },
                                                                    });

            if (count !== 0) {
                res.status(409).json({
                                         err: "Table with specified name already exists",
                                     });
                return;
            }
        }

        // At this point all values are valid
        table.Filename    = req.body.filename;
        table.CRC32       = req.body.crc32;
        table.Description = req.body.description;

        await table.save();
        res.status(200).json({
                                 filename:    table.Filename,
                                 crc32:       table.CRC32,
                                 description: table.Description,
                                 id:          table.id,
                             });
    });

    router.delete("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        const table = await context.Database.Models.Table.findById(req.params.id);

        if (!table) {
            res.status(400).json({
                                     status: "bad_request",
                                     reason: "Parameters were invalid",
                                     errors: [
                                         "Invalid ID specified",
                                     ],
                                 });
            return;
        }

        await table.destroy();

        res.status(200).send(null);
    });

    return router;
};
