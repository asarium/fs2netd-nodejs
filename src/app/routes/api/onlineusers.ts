import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {json} from "sequelize";

let promiseRouter = require("express-promise-router");

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.get("/", (req, res) => {
        return context.Database.Models.OnlineUser.findAll().then(online_users => {
            return Promise.all(online_users.map(user => {
                return user.getUser().then(user => {
                    return {
                        name: user.Username
                    }
                });
            }));
        }).then(array => {
            res.json(array);
        })
    });

    return router;
}