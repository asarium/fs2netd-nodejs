import * as bodyParser from "body-parser";
import session = require("client-sessions");
import * as config from "config";
import flash = require("connect-flash");
import {Router} from "express";
import * as promiseRouter from "express-promise-router";
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

    router.use(flash());
    // Make error and success messages available in views
    router.use((req, res, next) => {
        res.locals.success = req.flash("success");
        res.locals.errors = req.flash("error");
        next();
    });

    router.use(async (req, res, next) => {
        if (req.session && req.session.user_id) {
            const user = await context.Database.Models.User.findById(req.session.user_id);

            if (user === null) {
                // User not found in database
                req.session.reset();
            } else {
                req.user        = user;
                res.locals.user = user;
            }
            next();
        } else {
            next();
        }
    });

    router.get("/", async (req, res) => {
        // Index always needs the server list
        const servers = await context.Database.Models.Server.findAll();

        res.render("index", {servers});
    });

    router.get("/register", async (req, res) => {
        res.render("register");
    });

    router.post("/register", async (req, res) => {
        if (req.session && req.session.user_id) {
            req.flash("error", "You need to log out before registering a new user!");
            res.redirect("/");
            return;
        }

        const username = req.body.username;
        const existing = await context.Database.getUserByName(username);

        if (existing !== null) {
            // User already exists
            req.flash("error", "A user with that name already exists!");
            res.render("register");
            return;
        }

        const password = req.body.password;
        const confirm  = req.body.confirm;

        if (password !== confirm) {
            // Because relying on client side validation is stupid.
            req.flash("error", "The two password fields did not match!");
            res.render("register");
            return;
        }

        if (password.length === 0) {
            req.flash("error", "The password may not be empty!");
            res.render("register");
            return;
        }

        let user = context.Database.Models.User.build({Username: username});

        user = await setPassword(user, req.body.password);

        // Registration successful. Automatically log in as this user
        req.session.user_id = user.id;

        req.flash("success", "The user \"" + user.Username + "\" has been successfully registered!");
        res.redirect("/");
    });

    router.post("/login", async (req, res) => {
        const name     = req.body.username;
        const password = req.body.password;
        try {
            const user = await context.ApiFunctions.verifyLogin(name, password);

            req.session.user_id = user.id;

            req.flash("success", "Successfully logged in as " + user.Username);
            res.redirect("/");
        } catch (err) {
            req.flash("error", "Invalid username or password!");
            res.redirect("/");
        }
    });

    router.post("/logout", async (req, res) => {
        if (req.session && req.session.user_id) {
            req.session.reset();

            // Remove the user that was previously set from the session
            delete res.locals.user;

            req.flash("success", "You have been logged out!");
            res.redirect("/");
        } else {
            req.flash("error", "You were not logged in!");
            res.redirect("/");
        }
    });

    return router;
};
