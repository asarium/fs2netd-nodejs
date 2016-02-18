import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {json} from "sequelize";

export = function (context: RouterContext): Router {
    let router = express.Router();

    router.get("/", (req, res, next) => {
        let jsonData = context.GameServer.ServerList.Servers.map(server => {
            return {
                name: server.Name,
                num_players: server.NumPlayers,
                max_players: server.MaxPlayers
            }
        });

        res.json(jsonData);
    });

    return router;
}