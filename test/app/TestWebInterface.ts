import {WebInterface} from "../../src/app/WebInterface";
import {IRouterContext} from "../../src/app/WebInterface";
import {Database} from "../../src/db/Database";
import {initializeTestDatabase} from "../db/TestDatabase";
import * as winston from "winston";
import {ADMIN_ROLE} from "../../src/db/models/Role";
import * as config from "config";
import {IUserInstance} from "../../src/db/models/User";

let jwt = require("jsonwebtoken");

// Disable logging while testing
winston.clear();

export const ADMIN_JWT = "JWT " + <string>jwt.sign({
                                                       id: 1
                                                   }, config.get<string>("web.jwt.secret"), {});

export const USER_JWT = "JWT " + <string>jwt.sign({
                                                      id: 2
                                                  }, config.get<string>("web.jwt.secret"), {});

export interface TestWebContext extends IRouterContext {
    TestAdmin: IUserInstance;
    TestUser: IUserInstance;
}

export async function initializeTestWeb(): Promise<TestWebContext> {
    let db = await initializeTestDatabase();

    // Add a test admin
    let admin = await db.Models.User.create({
                                                Username:     "test_admin",
                                                PasswordHash: "$2a$10$YZyuPWiSasB/5bGVHd88DOMCBf.JbKfhtR9Y7wojlXtHxCyrd3ygm"
                                            });
    await admin.addRole(await db.Models.Role.findById(ADMIN_ROLE));

    // Add a test user
    let user = await db.Models.User.create({
                                               Username:     "test_user",
                                               PasswordHash: "$2a$10$YZyuPWiSasB/5bGVHd88DOMCBf.JbKfhtR9Y7wojlXtHxCyrd3ygm"
                                           });

    let web = new WebInterface(db, {
        logging: false
    });

    return {
        Database:     db,
        WebInterface: web,
        TestAdmin:    admin,
        TestUser:     user
    }
}
