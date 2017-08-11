import * as express from "express";
import {IRouterContext} from "../../WebInterface";
import {Router} from "express";
import {json} from "sequelize";
import {authenticate} from "./authentication";
import {ADMIN_ROLE} from "../../../db/models/Role";
import {checkUserRole} from "./authentication";

let promiseRouter = require("express-promise-router");

export = function (context: IRouterContext): Router {
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
        let server = await context.Database.Models.Server.findById(req.params.id);

        if (!server) {
            res.status(400).json({
                                     status: 'bad_request',
                                     reason: 'Parameters were invalid',
                                     errors:  [
                                         "Invalid ID specified"
                                     ]
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