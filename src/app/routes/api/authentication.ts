import {RequestHandler} from "express";
import * as passport from "passport";
import {IRoleInstance} from "../../../db/models/Role";

export function authenticate(): RequestHandler {
    return passport.authenticate("jwt", {session: false});
}

export function checkUserRole(validRoles: string[]): RequestHandler {
    return (req, res, next) => {
        return req.user.getRoles().then((roles: IRoleInstance[]): void => {
            let result = false;
            for (const role of roles) {
                for (const valid of validRoles) {
                    if (role.Name === valid) {
                        result = true;
                        break;
                    }
                }
            }

            if (result) {
                next();
                return;
            }

            res.status(403).json({
                                     err: "Insufficient user rights",
                                 });
            return;
        });
    };
}
