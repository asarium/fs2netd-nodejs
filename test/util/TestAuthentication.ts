/// <reference path="../../typings/main.d.ts" />
import * as assert from "assert";
import {Authentication} from "../../src/util/Authentication";
import {UserPojo} from "../../src/db/models/User";

let PASSWORD_HASH = "$2a$10$YZyuPWiSasB/5bGVHd88DOMCBf.JbKfhtR9Y7wojlXtHxCyrd3ygm";
let PASSWORD = "test";

describe("Authentication", () => {
    describe("#verifyPassword()", () => {
        it("should reject a wrong password", () => {
            let user: UserPojo = {
                PasswordHash: PASSWORD_HASH
            };

            return Authentication.verifyPassword(user, "nottest").then(res => {
                assert.equal(res, false);
            });
        });
        it("should accept the right password", () => {
            let user: UserPojo = {
                PasswordHash: PASSWORD_HASH
            };

            return Authentication.verifyPassword(user, PASSWORD).then(res => {
                assert.equal(res, true);
            });
        });
    });
});