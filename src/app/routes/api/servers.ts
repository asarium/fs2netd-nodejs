import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {json} from "sequelize";

export = function (context: RouterContext): Router {
    let router = express.Router();

    router.get("/", (req, res, next) => {
        context.Database.Models.Server.findAll().then(servers => {
            let jsonData = servers.map(server => {
                return {
                    name: server.Name,
                    num_players: server.NumPlayers,
                    max_players: server.MaxPlayers
                }
            });

            res.json(jsonData);
        }).catch(() => {
            res.status(500).json({
                                     err: "Internal server error"
                                 });
        });

    });

    return router;
}