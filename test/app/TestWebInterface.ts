import {WebInterface} from "../../src/app/WebInterface";
import {RouterContext} from "../../src/app/WebInterface";
import {Database} from "../../src/db/Database";
import {initializeTestDatabase} from "../db/TestDatabase";
import * as winston from "winston";
import {ADMIN_ROLE} from "../../src/db/models/Role";
import * as config from "config";

let jwt = require("jsonwebtoken");

// Disable logging while testing
winston.clear();

export const ADMIN_JWT = "JWT " + <string>jwt.sign({
                                      id: 1
                                  }, config.get<string>("web.jwt.secret"), {});

export const USER_JWT = "JWT " + <string>jwt.sign({
                                      id: 2
                                  }, config.get<string>("web.jwt.secret"), {});

export interface TestContext extends RouterContext {

}

export async function initializeTestWeb(): Promise<TestContext> {
    let db = await initializeTestDatabase();

    // Add a test admin
    let user = await db.Models.User.create({
                                               Username:     "test_admin",
                                               PasswordHash: "$2a$10$YZyuPWiSasB/5bGVHd88DOMCBf.JbKfhtR9Y7wojlXtHxCyrd3ygm"
                                           });
    await user.addRole(await db.Models.Role.findById(ADMIN_ROLE));

    // Add a test user
    await db.Models.User.create({
                                    Username:     "test_user",
                                    PasswordHash: "$2a$10$YZyuPWiSasB/5bGVHd88DOMCBf.JbKfhtR9Y7wojlXtHxCyrd3ygm"
                                });

    let web = new WebInterface(db, {
        logging: false
    });

    return {
        Database:     db,
        WebInterface: web
    }
}
