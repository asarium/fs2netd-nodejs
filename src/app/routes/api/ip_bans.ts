import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {authenticate} from "./authentication";
import {isAdmin} from "../../../util/Roles";
import {MissionPojo} from "../../../db/models/Mission";
import {checkUserRole} from "./authentication";
import {ADMIN_ROLE} from "../../../db/models/Role";
import {IpBanPojo} from "../../../db/models/IpBan";

let paperwork     = require("paperwork");
let promiseRouter = require("express-promise-router");

// This could also be done with JSON schemas but currently this simple template is enough
const IPBAN_TEMPLATE = {
    ip_mask:    String,
    expiration: String,
    comment:    String,
    id:         paperwork.optional(Number),
};

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.get("/", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        let bans = await context.Database.Models.IpBan.findAll();

        res.status(200).json(bans.map(ban => {
            return {
                ip_mask:    ban.IpMask,
                expiration: ban.Expiration,
                comment:    ban.Comment,
                id:         ban.id,
            }
        }));
    });

    router.put("/", authenticate(), checkUserRole([ADMIN_ROLE]), paperwork.accept(IPBAN_TEMPLATE), async (req, res) => {
        let expiration = Date.parse(req.body.expiration);
        if (expiration != expiration) { // Check for NaN
            res.status(409).json({
                                     err: "Invalid date format"
                                 });
            return;
        }

        let info: IpBanPojo = {
            IpMask:     req.body.ip_mask,
            Expiration: new Date(expiration),
            Comment:    req.body.comment,
        };

        let ban = await context.Database.Models.IpBan.create(info);

        res.status(200).json({
                                 ip_mask:    ban.IpMask,
                                 expiration: ban.Expiration,
                                 comment:    ban.Comment,
                                 id:         ban.id
                             });
    });

    router.post("/:id", authenticate(), checkUserRole([ADMIN_ROLE]),
                paperwork.accept(IPBAN_TEMPLATE), async (req, res) => {
            let ban = await context.Database.Models.IpBan.findById(req.params.id);

            if (!ban) {
                res.status(409).json({
                                         err: "Invalid ID specified"
                                     });
                return;
            }
            let expiration = Date.parse(req.body.expiration);
            if (expiration != expiration) { // Check for NaN
                res.status(409).json({
                                         err: "Invalid date format"
                                     });
                return;
            }

            ban.IpMask     = req.body.ip_mask;
            ban.Expiration = new Date(expiration);
            ban.Comment    = req.body.comment;

            ban = await ban.save();

            res.status(200).json({
                                     ip_mask:    ban.IpMask,
                                     expiration: ban.Expiration,
                                     comment:    ban.Comment,
                                     id:         ban.id
                                 });
        });

    router.delete("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        let ban = await context.Database.Models.IpBan.findById(req.params.id);

        if (!ban) {
            res.status(409).json({
                                     err: "Invalid ID specified"
                                 });
            return;
        }

        await ban.destroy();

        res.status(200).send(null);
    });

    return router;
}