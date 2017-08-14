import * as config from "config";
import * as jwt from "jsonwebtoken";
import * as winston from "winston";
import {ApiFunctions} from "../../src/app/ApiFunctions";
import {WebInterface} from "../../src/app/WebInterface";
import {IRouterContext} from "../../src/app/WebInterface";
import {RoleType} from "../../src/db/models/Role";
import {IUserInstance} from "../../src/db/models/User";
import {initializeTestDatabase} from "../db/TestDatabase";

// Disable logging while testing
winston.clear();

export const ADMIN_JWT = "JWT " + jwt.sign({
                                               id: 1,
                                           }, config.get<string>("web.jwt.secret"), {}) as string;

export const USER_JWT = "JWT " + jwt.sign({
                                              id: 2,
                                          }, config.get<string>("web.jwt.secret"), {}) as string;

export interface ITestWebContext extends IRouterContext {
    TestAdmin: IUserInstance;
    TestUser: IUserInstance;
}

export async function initializeTestWeb(): Promise<ITestWebContext> {
    const db = await initializeTestDatabase();

    // Add a test admin
    const admin = await db.Models.User.create({
                                                  Username:     "test_admin",
                                                  PasswordHash: "$2a$10$YZyuPWiSasB/5bGVHd88DOMCBf.JbKfhtR9Y7wojlXtHxCyrd3ygm",
                                              });
    await admin.addRole(await db.Models.Role.findById(RoleType.Admin));

    // Add a test user
    const user = await db.Models.User.create({
                                                 Username:     "test_user",
                                                 PasswordHash: "$2a$10$YZyuPWiSasB/5bGVHd88DOMCBf.JbKfhtR9Y7wojlXtHxCyrd3ygm",
                                             });

    const web = new WebInterface(db, {
        logging: false,
    });

    return {
        Database:     db,
        WebInterface: web,
        TestAdmin:    admin,
        TestUser:     user,
        ApiFunctions: new ApiFunctions(db),
    };
}
