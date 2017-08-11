import {Router} from "express";
import {IRouterContext} from "../../WebInterface";

import * as promiseRouter from "express-promise-router";

export = (context: IRouterContext): Router => {
    const router = promiseRouter();

    router.get("/", async (req, res) => {
        // TODO: Returns duplicate values when a user is logged in twice
        const onlineUsers = await context.Database.Models.OnlineUser.findAll();

        const users = await Promise.all(onlineUsers.map((user) => {
            return user.getUser().then((dbUser) => {
                return {
                    name: dbUser.Username,
                };
            });
        }));

        res.status(200).json(users);
    });

    return router;
};
