import {Router} from "express";
import e = require("express");
import * as promiseRouter from "express-promise-router";
import {RoleType} from "../../../db/models/Role";
import {IRouterContext} from "../../WebInterface";
import {authenticate} from "./authentication";
import {checkUserRole} from "./authentication";

export = (context: IRouterContext): Router => {
    const router = promiseRouter();

    router.get("/", (req: e.Request, res: e.Response) => {
        return context.Database.Models.Server.findAll().then((servers) => {
            const jsonData = servers.map((server) => {
                return {
                    name:        server.Name,
                    num_players: server.NumPlayers,
                    max_players: server.MaxPlayers,
                    mission:     server.MissionName,
                    title:       server.Title,
                    id:          server.id,
                };
            });

            res.json(jsonData);
        });
    });

    router.get("/:id", authenticate(), checkUserRole([RoleType.Admin]), async (req: e.Request, res: e.Response) => {
        const server = await context.Database.Models.Server.findById(req.params.id);

        if (!server) {
            res.status(400).json({
                                     status: "bad_request",
                                     reason: "Parameters were invalid",
                                     errors: [
                                         "Invalid ID specified",
                                     ],
                                 });
            return;
        }

        res.status(200).json({
                                 name:        server.Name,
                                 num_players: server.NumPlayers,
                                 max_players: server.MaxPlayers,
                                 id:          server.id,
                                 ip:          server.Ip,
                                 port:        server.Port,
                             });
    });

    return router;
};
