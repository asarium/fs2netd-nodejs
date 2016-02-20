import {RequestHandler} from "express";
import * as passport from "passport";

export function authenticate(): RequestHandler {
    return passport.authenticate('jwt', {session: false});
}
