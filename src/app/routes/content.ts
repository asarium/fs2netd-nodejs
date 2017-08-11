import * as express from "express";
import {Router} from "express";
import * as path from "path";
import {IRouterContext} from "../WebInterface";

export = (context: IRouterContext): Router => {
    const router = express.Router();

    router.get("/", (req, res, next) => {
        // Everything that wasn't matched before will just return the default index file
        // Displaying the right content will be handled by the JavaScript in that file
        res.sendFile(path.join(process.cwd(), "public", "index.html"));
    });

    return router;
};
