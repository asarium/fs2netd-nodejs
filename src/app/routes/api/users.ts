import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {Authentication} from "../../../util/Authentication";
import {authenticate} from "./authentication";
import {UserInstance} from "../../../db/models/User";
import {ADMIN_ROLE} from "../../../db/models/Role";
import {checkUserRole} from "./authentication";

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
                                         name: user.Username,
                                         id:   user.id
                                     });
            });
        });
    });

    router.get("/", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        let users = await context.Database.Models.User.findAll();

        res.status(200).send(users.map(user => {
            return {
                name:       user.Username,
                last_login: user.LastLogin,
                id:         user.id
            }
        }));
    });

    router.get("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        let requested = await context.Database.Models.User.findById(req.params.id);

        if (!requested) {
            res.status(409).json({
                                     err: "User does not exist"
                                 });
            return;
        }

        let roles = await requested.getRoles();

        let jsonData = {
            name:       requested.Username,
            last_login: requested.LastLogin,
            id:         requested.id,
            roles:      roles.map(r => r.Name)
        };

        res.status(200).json(jsonData);
    });

    router.delete("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
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