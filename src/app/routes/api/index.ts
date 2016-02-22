import * as express from "express";
import * as bodyParser from "body-parser";
import * as winston from "winston";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {Request} from "express";
import {Response} from "express";
import {NextFunction} from "express";

export = function (context: RouterContext): Router {
    let router = express.Router();

    router.use(bodyParser.urlencoded({extended: true}));
    router.use(bodyParser.json());

    router.use("/authenticate", require("./authenticate")(context));

    router.use("/servers", require("./servers")(context));
    router.use("/users", require("./users")(context));
    router.use("/onlineusers", require("./onlineusers")(context));
    router.use("/tables", require("./tables")(context));
    router.use("/missions", require("./missions")(context));
    router.use("/ip_bans", require("./ip_bans")(context));

    router.use((err: any, req: Request, res: Response, next: NextFunction) => {
        winston.error("Error in API function!", err);
        res.status(500).json({
                                 err: "Internal server error"
                             });
    });

    return router;
}