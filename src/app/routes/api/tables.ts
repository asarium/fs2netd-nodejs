import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {authenticate} from "./authentication";
import {UserInstance} from "../../../db/models/User";
import {TablePojo} from "../../../db/models/Table";
import {RequestHandler} from "express";
import {ADMIN_ROLE} from "../../../db/models/Role";
import {checkUserRole} from "./authentication";

let promiseRouter = require("express-promise-router");

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.get("/", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        let tables = await context.Database.Models.Table.findAll();

        let jsondata = tables.map(table => {
            return {
                filename:    table.Filename,
                crc32:       table.CRC32,
                description: table.Description,
                id:          table.id
            }
        });

        res.status(200).json(jsondata);
    });

    router.put("/", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        if (typeof req.body.filename !== "string" || typeof req.body.crc32 !== "number" ||
            typeof req.body.description !== "string") {
            res.status(400).json({
                                     err: "Invalid parameters"
                                 });
            return;
        }

        let data: TablePojo = {
            Filename:    req.body.filename,
            CRC32:       req.body.crc32,
            Description: req.body.description
        };

        let count = await context.Database.Models.Table.count({
                                                                  where: {
                                                                      Filename: req.body.filename
                                                                  }
                                                              });
        if (count !== 0) {
            res.status(409).json({
                                     err: "Table already exists!"
                                 });
            return null;
        }

        let table = await context.Database.Models.Table.create(data);

        res.status(201).json({
                                 filename:    table.Filename,
                                 crc32:       table.CRC32,
                                 description: table.Description,
                                 id:          table.id
                             });
    });

    router.post("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        let table = await context.Database.Models.Table.findById(req.params.id);

        if (!table) {
            res.status(409).json({
                                     err: "Table does not exist"
                                 });
            return;
        }

        if (req.body.filename !== table.Filename) {
            // Name will be changed, check if there is another table with the same name
            let count = await context.Database.Models.Table.count({
                                                                      where: {
                                                                          Filename: req.body.filename
                                                                      }
                                                                  });

            if (count != 0) {
                res.status(409).json({
                                         err: "Table with specified name already exists"
                                     });
                return;
            }
        }

        // At this point all values are valid
        table.Filename    = req.body.filename;
        table.CRC32       = req.body.crc32;
        table.Description = req.body.description;

        await table.save();
        res.status(201).json({
                                 filename:    table.Filename,
                                 crc32:       table.CRC32,
                                 description: table.Description,
                                 id:          table.id
                             });
    });

    router.delete("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        let table = await context.Database.Models.Table.findById(req.params.id);

        if (!table) {
            res.status(409).json({
                                     err: "Table does not exist"
                                 });
            return;
        }

        await table.destroy();

        res.status(200).send(null);
    });

    return router;
}