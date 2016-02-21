import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {Authentication} from "../../../util/Authentication";

let promiseRouter = require("express-promise-router");

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.put("/", (req, res) => {
        let username = req.body.user;
        let password = req.body.password;

        if (typeof username !== "string" || typeof password !== "string") {
            res.status(400).json({
                                     err: "Invalid parameters"
                                 });
            return Promise.resolve();
        }

        return context.Database.Models.User.find({
                                              where: {
                                                  Username: username
                                              }
                                          }).then(user => {
            if (user != null) {
                res.status(409).json({
                                         err: "User already exists!"
                                     });
                return null;
            }

            user = context.Database.Models.User.build({Username: username});

            return Authentication.setPassword(user, password).then(() => {
                res.status(201).send(null);
            });
        });
    });

    return router;
}