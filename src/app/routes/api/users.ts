import {Router} from "express";
import e = require("express");
import * as promiseRouter from "express-promise-router";
import * as paperwork from "paperwork";
import {IRoleInstance, RoleType} from "../../../db/models/Role";
import {setPassword} from "../../../util/Authentication";
import {IRouterContext} from "../../WebInterface";
import {authenticate} from "./authentication";
import {checkUserRole} from "./authentication";

const LOGIN_MODEL = {
    name:     String,
    password: String,
};

export = (context: IRouterContext): Router => {
    const router = promiseRouter();

    router.put("/", paperwork.accept(LOGIN_MODEL), async (req: e.Request, res: e.Response) => {
        let user = await context.Database.Models.User.find({
                                                               where: {
                                                                   Username: req.body.name,
                                                               },
                                                           });
        if (user != null) {
            res.status(409).json({
                                     err: "User already exists!",
                                 });
            return;
        }

        user = context.Database.Models.User.build({Username: req.body.name});

        user = await setPassword(user, req.body.password);

        res.status(201).json({
                                 name: user.Username,
                                 id:   user.id,
                             });
    });

    router.get("/", authenticate(), checkUserRole([RoleType.Admin]), async (req: e.Request, res: e.Response) => {
        const users = await context.Database.Models.User.findAll();

        res.status(200).send(users.map((user) => {
            return {
                name:       user.Username,
                last_login: user.LastLogin,
                id:         user.id,
            };
        }));
    });

    router.get("/me", authenticate(), async (req: e.Request, res: e.Response) => {
        const roles = await req.user.getRoles();

        const jsonData = {
            name:       req.user.Username,
            last_login: req.user.LastLogin,
            id:         req.user.id,
            roles:      roles.map((r: IRoleInstance) => r.Name),
        };

        res.status(200).json(jsonData);
    });

    router.get("/:id", authenticate(), checkUserRole([RoleType.Admin]), async (req: e.Request, res: e.Response) => {
        const requested = await context.Database.Models.User.findById(req.params.id);

        if (!requested) {
            res.status(400).json({
                                     status: "bad_request",
                                     reason: "Parameters were invalid",
                                     errors: [
                                         "Invalid ID specified",
                                     ],
                                 });
            return;
        }

        const roles = await requested.getRoles();

        const jsonData = {
            name:       requested.Username,
            last_login: requested.LastLogin,
            id:         requested.id,
            roles:      roles.map((r) => r.Name),
        };

        res.status(200).json(jsonData);
    });

    router.delete("/:id", authenticate(), checkUserRole([RoleType.Admin]), async (req: e.Request, res: e.Response) => {
        const deleteUser = await context.Database.Models.User.findById(req.params.id);

        if (!deleteUser) {
            res.status(400).json({
                                     status: "bad_request",
                                     reason: "Parameters were invalid",
                                     errors: [
                                         "Invalid ID specified",
                                     ],
                                 });
            return;
        }

        await deleteUser.destroy();

        res.status(200).send(null);
    });

    return router;
};
