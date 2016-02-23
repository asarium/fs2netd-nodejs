import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {json} from "sequelize";

let promiseRouter = require("express-promise-router");

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.get("/", (req, res) => {
        // TODO: Returns duplicate values when a user is logged in twice
        return context.Database.Models.OnlineUser.findAll().then(online_users => {
            return Promise.all(online_users.map(user => {
                return user.getUser().then(user => {
                    return {
                        name: user.Username
                    }
                });
            }));
        }).then(array => {
            res.status(200).json(array);
        })
    });

    return router;
}