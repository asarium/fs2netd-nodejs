import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {Authentication} from "../../../util/Authentication";
import * as winston from "winston";

export = function (context: RouterContext): Router {
    let router = express.Router();

    router.put("/", (req, res, next) => {
        let username = req.body.user;
        let password = req.body.password;

        if (typeof username !== "string" || typeof password !== "string") {
            res.status(400).json({
                                     err: "Invalid parameters"
                                 });
            return null;
        }

        context.Database.Models.User.find({
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
        }).catch(err => {
            winston.error("Error while getting user list", err);
            res.status(500).json({
                                     err: "Internal server error"
                                 });
        });
    });

    return router;
}