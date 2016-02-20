import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {json} from "sequelize";
import * as winston from "winston";

export = function (context: RouterContext): Router {
    let router = express.Router();

    router.get("/", (req, res, next) => {
        context.Database.Models.OnlineUser.findAll().then(online_users => {
            return Promise.all(online_users.map(user => {
                return user.getUser().then(user => {
                    return {
                        name: user.Username
                    }
                });
            }));
        }).then(array => {
            res.json(array);
        }).catch(err => {
            winston.error("Error while getting online users", err);
            res.status(500).json({
                                     err: "Internal server error"
                                 });
        });
    });

    return router;
}