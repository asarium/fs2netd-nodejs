import * as express from "express";
import * as path from "path";

import {Router} from "express";
import {IRouterContext} from "../WebInterface";
import api = require("./api");
import content = require("./content");

export = (context: IRouterContext): Router => {
    const router = express.Router();

    router.use("/api/v1", api(context));

    router.use(express.static(path.join(process.cwd(), "public")));

    // Server everything else using the content router
    router.use(content(context));

    router.use((req, res) => {
        // Not found handler
        res.type("txt").status(404).send("Not found");
    });

    return router;
};
