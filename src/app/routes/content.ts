
import * as express from "express";
import * as path from "path";
import {IRouterContext} from "../WebInterface";
import {Router} from "express";

export = function(context: IRouterContext): Router {
    let router = express.Router();

    router.get("/", (req, res, next) => {
        // Everything that wasn't matched before will just return the default index file
        // Displaying the right content will be handled by the JavaScript in that file
        res.sendFile(path.join(process.cwd(), "public", "index.html"));
    });

    return router;
}