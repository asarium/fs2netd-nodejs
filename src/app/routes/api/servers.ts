import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {json} from "sequelize";

let promiseRouter = require("express-promise-router");

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.get("/", (req, res, next) => {
        return context.Database.Models.Server.findAll().then(servers => {
            let jsonData = servers.map(server => {
                return {
                    name: server.Name,
                    num_players: server.NumPlayers,
                    max_players: server.MaxPlayers
                }
            });

            res.json(jsonData);
        });
    });

    return router;
}