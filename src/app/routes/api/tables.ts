import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import * as winston from "winston";
import {authenticate} from "./authentication";
import {UserInstance} from "../../../db/models/User";
import {isAdmin} from "../../../util/Roles";
import {TablePojo} from "../../../db/models/Table";

export = function (context: RouterContext): Router {
    let router = express.Router();

    router.get("/", authenticate(), (req, res) => {
        let user = <UserInstance>req.user;

        isAdmin(user).then(admin => {
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
                        description: table.Description
                    }
                });

                res.status(200).json(jsondata);
            });
        }).catch(err => {
            winston.error("Error while getting table list", err);
            res.status(500).json({
                                     err: "Internal server error"
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
            return;
        }

        isAdmin(user).then(admin => {
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
                return context.Database.Models.Table.create(data).then(() => {
                    res.status(201).send(null);
                });
            }).catch(err => {
                winston.error("Error while creating table", err);
                res.status(500).json({
                                         err: "Internal server error"
                                     });
            });
        });
    });

    return router;
}