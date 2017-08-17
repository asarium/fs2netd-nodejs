import * as bodyParser from "body-parser";
import session = require("client-sessions");
import * as config from "config";
import {Router} from "express";
import * as promiseRouter from "express-promise-router";
import * as winston from "winston";
import {setPassword} from "../../util/Authentication";
import {IRouterContext} from "../WebInterface";

export = (context: IRouterContext): Router => {
    const router = promiseRouter();

    router.use(session({
                           cookieName:     "session",
                           secret:         config.get<string>("web.session.secret"),
                           duration:       24 * 60 * 60 * 1000, // how long the session will stay valid in ms
                           activeDuration: 1000 * 60 * 5, // if expiresIn < activeDuration, the session will be
                                                          // extended by activeDuration milliseconds
                           cookie:         {
                               httpOnly: true,
                               secure:   config.has("web.tls.key"),
                           },
                       }));
    router.use(bodyParser.urlencoded({extended: true}));

    router.get("/", async (req, res) => {
        // Index always needs the server list
        const servers = await context.Database.Models.Server.findAll();

        if (req.session && req.session.user_id) {
            const user = await context.Database.Models.User.findById(req.session.user_id);

            if (user === null) {
                // User not found in database
                req.session.reset();
                res.render("index", {servers});
            } else {
                res.render("index", {user, servers});
            }
        } else {
            res.render("index", {servers});
        }
    });

    router.post("/register", async (req, res) => {
        winston.info("Start register");
        if (req.session && req.session.user_id) {
            res.render("index", {
                success_message: "You need to log out before registering a new user!",
                redirect:        "/",
            });
            return;
        }

        const username = req.body.username;
        winston.info("Check user");
        const existing = await context.Database.getUserByName(username);

        if (existing !== null) {
            // User already exists
            res.render("index", {
                error_message: "A user with that name already exists!",
                redirect:      "/",
            });
            return;
        }

        const password = req.body.password;
        const confirm  = req.body.confirm;

        winston.info("Check password");
        if (password !== confirm) {
            // Because relying on client side validation is stupid.
            res.render("index", {
                error_message: "The two password fields did not match!",
                redirect:      "/",
            });
            return;
        }

        winston.info("Build user");
        let user = context.Database.Models.User.build({Username: username});

        winston.info("Set password");
        user = await setPassword(user, req.body.password);

        // Registration successful. Automatically log in as this user
        req.session.user_id = user.id;

        winston.info("Render view " + user.Username);
        const options = {
            success_message: "The user \"" + user.Username + "\" has been successfully registered!",
            redirect:        "/",
            user,
        };
        res.render("index", options);
    });

    router.post("/login", async (req, res) => {
        const name     = req.body.username;
        const password = req.body.password;
        try {
            const user = await context.ApiFunctions.verifyLogin(name, password);

            req.session.user_id = user.id;

            res.render("index", {
                success_message: "Successfully logged in as " + user.Username,
                redirect:        "/",
            });
        } catch (err) {
            res.render("index", {
                error_message: "Could not log in user!",
                redirect:      "/",
            });
        }
    });

    router.post("/logout", async (req, res) => {
        if (req.session && req.session.user_id) {
            req.session.reset();
            res.render("index", {
                success_message: "You have been logged out!",
                redirect:        "/",
            });
        } else {
            res.render("index", {
                error_message: "You were not logged in!",
                redirect:      "/",
            });
        }
    });

    return router;
};
