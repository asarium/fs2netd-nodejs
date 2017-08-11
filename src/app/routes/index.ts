import * as express from "express";
import * as bodyParser from "body-parser";
import * as path from "path";

import api = require("./api");
import content = require("./content");
import {IRouterContext} from "../WebInterface";
import {Router} from "express";

export = function(context: IRouterContext): Router {
    let router = express.Router();

    router.use("/api/v1", api(context));

    router.use(express.static(path.join(process.cwd(), "public")));

    // Server everything else using the content router
    router.use(content(context));

    router.use((req, res, next) => {
        // Not found handler
        res.type('txt').status(404).send('Not found');
    });

    return router;
}
