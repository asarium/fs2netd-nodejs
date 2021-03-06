import e = require("express");
import {Router} from "express";
import * as promiseRouter from "express-promise-router";
import {RoleType} from "../../../db/models/Role";
import {ITablePojo} from "../../../db/models/Table";
import {IRouterContext} from "../../WebInterface";
import {authenticate} from "./authentication";
import {checkUserRole} from "./authentication";

export = (context: IRouterContext): Router => {
    const router = promiseRouter();

    router.get("/", authenticate(), checkUserRole([RoleType.Admin]), async (req: e.Request, res: e.Response) => {
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

    router.put("/", authenticate(), checkUserRole([RoleType.Admin]),
               async (req: e.Request, res: e.Response): Promise<void> => {
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

                   const data: ITablePojo = {
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
                       return;
                   }

                   const table = await context.Database.Models.Table.create(data);

                   res.status(201).json({
                                            filename:    table.Filename,
                                            crc32:       table.CRC32,
                                            description: table.Description,
                                            id:          table.id,
                                        });
               });

    router.post("/:id", authenticate(), checkUserRole([RoleType.Admin]), async (req: e.Request, res: e.Response) => {
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

    router.delete("/:id", authenticate(), checkUserRole([RoleType.Admin]), async (req: e.Request, res: e.Response) => {
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
