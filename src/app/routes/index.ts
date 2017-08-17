import * as express from "express";
import * as path from "path";

import {Router} from "express";
import {IRouterContext} from "../WebInterface";
import api = require("./api");
import content = require("./content");

export = (context: IRouterContext): Router => {
    const router = express.Router();

    router.use("/api/v1", api(context));

    // This is the router for rendering the frontend
    router.use(content(context));

    // Serve everything else from the static file directory
    router.use(express.static(path.join(process.cwd(), "public")));

    router.use((req, res) => {
        // Not found handler
        res.type("txt").status(404).send("Not found");
    });

    return router;
};
