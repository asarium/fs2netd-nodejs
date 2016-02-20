import * as express from "express";
import * as bodyParser from "body-parser";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";

export = function (context: RouterContext): Router {
    let router = express.Router();

    router.use(bodyParser.urlencoded({extended: true}));
    router.use(bodyParser.json());

    router.use("/", require("./authenticate")(context));
    router.use("/servers", require("./servers")(context));
    router.use("/users", require("./users")(context));
    router.use("/onlineusers", require("./onlineusers")(context));
    router.use("/tables", require("./tables")(context));

    return router;
}