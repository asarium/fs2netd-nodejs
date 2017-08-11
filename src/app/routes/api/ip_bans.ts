import {Router} from "express";
import {IpBanPojo} from "../../../db/models/IpBan";
import {ADMIN_ROLE} from "../../../db/models/Role";
import {IRouterContext} from "../../WebInterface";
import {authenticate} from "./authentication";
import {checkUserRole} from "./authentication";

import * as promiseRouter from "express-promise-router";
import * as paperwork from "paperwork";

// This could also be done with JSON schemas but currently this simple template is enough
const IPBAN_TEMPLATE = {
    comment:    String,
    expiration: String,
    id:         paperwork.optional(Number),
    ip_mask:    String,
};

export = (context: IRouterContext): Router => {
    const router = promiseRouter();

    router.get("/", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        const bans = await context.Database.Models.IpBan.findAll();

        res.status(200).json(bans.map((ban) => {
            return {
                comment:    ban.Comment,
                expiration: ban.Expiration,
                id:         ban.id,
                ip_mask:    ban.IpMask,
            };
        }));
    });

    router.put("/", authenticate(), checkUserRole([ADMIN_ROLE]), paperwork.accept(IPBAN_TEMPLATE), async (req, res) => {
        const expiration = Date.parse(req.body.expiration);
        if (expiration !== expiration) { // Check for NaN
            res.status(400).json({
                                     status: "bad_request",
                                     reason: "Body did not satisfy requirements",
                                     errors: [
                                         "Invalid date format",
                                     ],
                                 });
            return;
        }

        const info: IpBanPojo = {
            IpMask:     req.body.ip_mask,
            Expiration: new Date(expiration),
            Comment:    req.body.comment,
        };

        const ban = await context.Database.Models.IpBan.create(info);

        res.status(201).json({
                                 ip_mask:    ban.IpMask,
                                 expiration: ban.Expiration,
                                 comment:    ban.Comment,
                                 id:         ban.id,
                             });
    });

    router.post("/:id", authenticate(), checkUserRole([ADMIN_ROLE]),
                paperwork.accept(IPBAN_TEMPLATE), async (req, res): Promise<void> => {
            let ban = await context.Database.Models.IpBan.findById(req.params.id);

            if (!ban) {
                res.status(400).json({
                                         status: "bad_request",
                                         reason: "Parameters were invalid",
                                         errors: [
                                             "Invalid ID specified",
                                         ],
                                     });
                return;
            }
            const expiration = Date.parse(req.body.expiration);
            if (expiration !== expiration) { // Check for NaN
                res.status(400).json({
                                         status: "bad_request",
                                         reason: "Body did not satisfy requirements",
                                         errors: [
                                             "Invalid date format",
                                         ],
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
                                     id:         ban.id,
                                 });
        });

    router.delete("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res): Promise<void> => {
        const ban = await context.Database.Models.IpBan.findById(req.params.id);

        if (!ban) {
            res.status(400).json({
                                     status: "bad_request",
                                     reason: "Parameters were invalid",
                                     errors: [
                                         "Invalid ID specified",
                                     ],
                                 });
            return;
        }

        await ban.destroy();

        res.status(200).send(null);
    });

    return router;
};
