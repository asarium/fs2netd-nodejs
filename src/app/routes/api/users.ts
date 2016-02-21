import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {Authentication} from "../../../util/Authentication";
import {authenticate} from "./authentication";
import {isAdmin} from "../../../util/Roles";
import {UserInstance} from "../../../db/models/User";

let promiseRouter = require("express-promise-router");

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.put("/", (req, res) => {
        let username = req.body.name;
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

            return Authentication.setPassword(user, password).then(user => {
                res.status(201).json({
                                         name: user.Username
                                     });
            });
        });
    });

    router.get("/", authenticate(), async (req, res) => {
        let user = <UserInstance>req.user;

        let admin = await isAdmin(user);

        if (!admin) {
            res.status(403).json({
                                     err: "Only admins may execute this action"
                                 });
            return;
        }

        let delete_user = await context.Database.Models.User.findById(req.params.id);

        if (!delete_user) {
            res.status(409).json({
                                     err: "User does not exist"
                                 });
            return;
        }

        await delete_user.destroy();

        res.status(200).send(null);
    });

    router.delete("/:id", authenticate(), async (req, res) => {
        let user = <UserInstance>req.user;

        let admin = await isAdmin(user);

        if (!admin) {
            res.status(403).json({
                                     err: "Only admins may execute this action"
                                 });
            return;
        }

        let delete_user = await context.Database.Models.User.findById(req.params.id);

        if (!delete_user) {
            res.status(409).json({
                                     err: "User does not exist"
                                 });
            return;
        }

        await delete_user.destroy();

        res.status(200).send(null);
    });

    return router;
}