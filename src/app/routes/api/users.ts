import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {Authentication} from "../../../util/Authentication";
import {authenticate} from "./authentication";
import {UserInstance} from "../../../db/models/User";
import {ADMIN_ROLE} from "../../../db/models/Role";
import {checkUserRole} from "./authentication";

let paperwork = require("paperwork");

let promiseRouter = require("express-promise-router");

let LOGIN_MODEL = {
    name: String,
    password: String
};

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.put("/", paperwork.accept(LOGIN_MODEL), (req, res) => {
        return context.Database.Models.User.find({
                                                     where: {
                                                         Username: req.body.name
                                                     }
                                                 }).then(user => {
            if (user != null) {
                res.status(409).json({
                                         err: "User already exists!"
                                     });
                return null;
            }

            user = context.Database.Models.User.build({Username: req.body.name});

            return Authentication.setPassword(user, req.body.password).then(user => {
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

    router.get("/me", authenticate(), async (req, res) => {
        let roles = await req.user.getRoles();

        let jsonData = {
            name:       req.user.Username,
            last_login: req.user.LastLogin,
            id:         req.user.id,
            roles:      roles.map(r => r.Name)
        };

        res.status(200).json(jsonData);
    });

    router.get("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        let requested = await context.Database.Models.User.findById(req.params.id);

        if (!requested) {
            res.status(400).json({
                                     status: 'bad_request',
                                     reason: 'Parameters were invalid',
                                     errors:  [
                                         "Invalid ID specified"
                                     ]
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
            res.status(400).json({
                                     status: 'bad_request',
                                     reason: 'Parameters were invalid',
                                     errors:  [
                                         "Invalid ID specified"
                                     ]
                                 });
            return;
        }

        await delete_user.destroy();

        res.status(200).send(null);
    });

    return router;
}