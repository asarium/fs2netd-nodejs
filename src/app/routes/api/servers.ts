import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {json} from "sequelize";
import {authenticate} from "./authentication";
import {ADMIN_ROLE} from "../../../db/models/Role";
import {checkUserRole} from "./authentication";

let promiseRouter = require("express-promise-router");

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.get("/", (req, res) => {
        return context.Database.Models.Server.findAll().then(servers => {
            let jsonData = servers.map(server => {
                return {
                    name:        server.Name,
                    num_players: server.NumPlayers,
                    max_players: server.MaxPlayers,
                    id:          server.id
                }
            });

            res.json(jsonData);
        });
    });

    router.get("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        let server = await context.Database.Models.Server.findById(req.parms.id);

        if (!server) {
            res.status(409).json({
                                     err: "Server does not exist"
                                 });
            return;
        }

        res.status(200).json({
                                 name:        server.Name,
                                 num_players: server.NumPlayers,
                                 max_players: server.MaxPlayers,
                                 id:          server.id,
                                 ip:          server.Ip,
                                 port:        server.Port
                             });
    });

    return router;
}