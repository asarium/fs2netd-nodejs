import * as express from "express";
import * as bodyParser from "body-parser";
import * as path from "path";

import api = require("./api");
import {RouterContext} from "../WebInterface";
import {Router} from "express";

export = function(context: RouterContext): Router {
    let router = express.Router();

    router.use("/api", api(context));

    router.use((req, res, next) => {
        // Not found handler
        res.type('txt').status(404).send('Not found');
    });

    return router;
}
