import * as express from "express";
import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import * as passport from "passport";
import * as config from "config";
import {Authentication} from "../../../util/Authentication";
import * as winston from "winston";
import * as Promise from "bluebird";

let paperwork = require("paperwork");

let promiseRouter = require("express-promise-router");
let jwt = require("jsonwebtoken");

const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const JWT_SECRET = config.get<string>("web.jwt.secret");
const JWT_EXPIRES_IN = config.get<string>("web.jwt.expires_in");

let LOGIN_MODEL = {
    name: String,
    password: String
};

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.post("/", paperwork.accept(LOGIN_MODEL), (req, res, next) => {
        return context.Database.Models.User.find({
                                              where: {
                                                  Username: req.body.name
                                              }
                                          }).then(user => {
            if (user == null) {
                res.status(401).json({
                                         err: "Invalid authentication"
                                     });
                return;
            }

            return Authentication.verifyPassword(user, req.body.password).then(valid => {
                if (!valid) {
                    res.status(401).json({
                                             err: "Invalid authentication"
                                         });
                    return;
                }

                let user_data = {
                    id: user.get("id")
                };
                jwt.sign(user_data, JWT_SECRET, {
                    expiresIn: JWT_EXPIRES_IN
                }, token => {
                    res.status(200).json({
                                             token: "JWT " + token
                                         });
                });
            });
        });
    });

    let jwtOptions = {
        secretOrKey: config.get<string>("web.jwt.secret"),
        jwtFromRequest: ExtractJwt.fromAuthHeader(),
    };

    passport.use(new JwtStrategy(jwtOptions, (payload, done) => {
        if (typeof payload.id !== "number") {
            return done(null, false);
        }

        context.Database.Models.User.findById(payload.id).then(user => {
            if (user == null) {
                done(null, false);
            } else {
                done(null, user);
            }
            return null; // Silence bluebird warning about creating a promise inside a promise
        }).catch(err => {
            done(err, false);
        });
    }));

    router.use(passport.initialize());

    return router;
}