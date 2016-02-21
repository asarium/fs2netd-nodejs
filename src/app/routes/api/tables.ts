import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {authenticate} from "./authentication";
import {UserInstance} from "../../../db/models/User";
import {isAdmin} from "../../../util/Roles";
import {TablePojo} from "../../../db/models/Table";
import {RequestHandler} from "express";

let promiseRouter = require("express-promise-router");

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.get("/", authenticate(), (req, res) => {
        let user = <UserInstance>req.user;

        return isAdmin(user).then(admin => {
            if (!admin) {
                res.status(403).json({
                                         err: "Only admins may execute this action"
                                     });
                return;
            }

            return context.Database.Models.Table.findAll().then(tables => {
                let jsondata = tables.map(table => {
                    return {
                        filename: table.Filename,
                        crc32: table.CRC32,
                        description: table.Description,
                        id: table.id
                    }
                });

                res.status(200).json(jsondata);
            });
        });
    });

    router.put("/", authenticate(), (req, res) => {
        let user = <UserInstance>req.user;

        if (typeof req.body.filename !== "string" || typeof req.body.crc32 !== "number" ||
            typeof req.body.description !== "string") {
            res.status(400).json({
                                     err: "Invalid parameters"
                                 });
            return Promise.resolve();
        }

        return isAdmin(user).then(admin => {
            if (!admin) {
                res.status(403).json({
                                         err: "Only admins may execute this action"
                                     });
                return;
            }

            let data: TablePojo = {
                Filename: req.body.filename,
                CRC32: req.body.crc32,
                Description: req.body.description
            };

            return context.Database.Models.Table.count({
                                                           where: {
                                                               Filename: req.body.filename
                                                           }
                                                       }).then(count => {
                if (count !== 0) {
                    res.status(409).json({
                                             err: "Table already exists!"
                                         });
                    return null;
                }
                return context.Database.Models.Table.create(data).then(table => {
                    res.status(201).json({
                                             filename: table.Filename,
                                             crc32: table.CRC32,
                                             description: table.Description,
                                             id: table.id
                                         });
                });
            });
        });
    });

    router.post("/:id", authenticate(), async (req, res) => {
        let user = <UserInstance>req.user;

        let admin = await isAdmin(user);

        if (!admin) {
            res.status(403).json({
                                     err: "Only admins may execute this action"
                                 });
            return;
        }

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
        table.Filename = req.body.filename || table.Filename;
        table.CRC32 = req.body.crc32 || table.CRC32;
        table.Description = req.body.description || table.Description;

        await table.save();
        res.status(201).json({
                                 filename: table.Filename,
                                 crc32: table.CRC32,
                                 description: table.Description,
                                 id: table.id
                             });
    });

    router.delete("/:id", authenticate(), async (req, res) => {
        let user = <UserInstance>req.user;

        let admin = await isAdmin(user);

        if (!admin) {
            res.status(403).json({
                                     err: "Only admins may execute this action"
                                 });
            return;
        }

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