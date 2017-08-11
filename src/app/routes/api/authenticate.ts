import * as config from "config";
import {Router} from "express";
import * as passport from "passport";
import {Authentication} from "../../../util/Authentication";
import {IRouterContext} from "../../WebInterface";

import * as paperwork from "paperwork";

import * as promiseRouter from "express-promise-router";

import * as jwt from "jsonwebtoken";

import {ExtractJwt, Strategy as JwtStrategy} from "passport-jwt";

const JWT_SECRET     = config.get<string>("web.jwt.secret");
const JWT_EXPIRES_IN = config.get<string>("web.jwt.expires_in");

const LOGIN_MODEL = {
    name:     String,
    password: String,
};

export = (context: IRouterContext): Router => {
    const router = promiseRouter();

    router.post("/", paperwork.accept(LOGIN_MODEL), async (req, res): Promise<void> => {
        const user = await context.Database.Models.User.find({
                                                                 where: {
                                                                     Username: req.body.name,
                                                                 },
                                                             });

        if (user == null) {
            res.status(401).json({
                                     err: "Invalid authentication",
                                 });
            return;
        }

        const valid = await Authentication.verifyPassword(user, req.body.password);

        if (!valid) {
            res.status(401).json({
                                     err: "Invalid authentication",
                                 });
            return;
        }

        const userData = {
            id: user.get("id"),
        };
        jwt.sign(userData, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        }, (token) => {
            res.status(200).json({
                                     token: "JWT " + token,
                                 });
        });
    });

    const jwtOptions = {
        secretOrKey:    config.get<string>("web.jwt.secret"),
        jwtFromRequest: ExtractJwt.fromAuthHeader(),
    };

    passport.use(new JwtStrategy(jwtOptions, (payload, done) => {
        if (typeof payload.id !== "number") {
            return done(null, false);
        }

        context.Database.Models.User.findById(payload.id).then((user) => {
            if (user == null) {
                done(null, false);
            } else {
                done(null, user);
            }
            return null; // Silence bluebird warning about creating a promise inside a promise
        }).catch((err) => {
            done(err, false);
        });
    }));

    router.use(passport.initialize());

    return router;
};
