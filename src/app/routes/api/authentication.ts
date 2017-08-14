import {RequestHandler} from "express";
import * as passport from "passport";

export function authenticate(): RequestHandler {
    return passport.authenticate("jwt", {session: false});
}

export function checkUserRole(validRoles: string[]): RequestHandler {
    return async (req, res, next) => {
        const roles = await req.user.getRoles();

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
    };
}
