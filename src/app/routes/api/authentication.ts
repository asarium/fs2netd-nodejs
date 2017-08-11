import {RequestHandler} from "express";
import * as passport from "passport";
import {IHandlerContext} from "../../../tracker/handlers/Handlers";
import {IRouterContext} from "../../WebInterface";

export function authenticate(): RequestHandler {
    return passport.authenticate("jwt", {session: false});
}

export function checkUserRole(validRoles: string[]): RequestHandler {
    return (req, res, next) => {
        return req.user.getRoles().then((roles) => {
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
                return null;
            }

            res.status(403).json({
                                     err: "Insufficient user rights",
                                 });
            return null;
        });
    };
}
