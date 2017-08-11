import * as assert from "assert";
import {IUserPojo} from "../../src/db/models/User";
import {Authentication} from "../../src/util/Authentication";

const PASSWORD_HASH = "$2a$10$YZyuPWiSasB/5bGVHd88DOMCBf.JbKfhtR9Y7wojlXtHxCyrd3ygm";
const PASSWORD      = "test";

describe("Authentication", () => {
    describe("#verifyPassword()", () => {
        it("should reject a wrong password", () => {
            const user: IUserPojo = {
                PasswordHash: PASSWORD_HASH,
            };

            return Authentication.verifyPassword(user, "nottest").then((res) => {
                assert.equal(res, false);
            });
        });
        it("should accept the right password", () => {
            const user: IUserPojo = {
                PasswordHash: PASSWORD_HASH,
            };

            return Authentication.verifyPassword(user, PASSWORD).then((res) => {
                assert.equal(res, true);
            });
        });
    });
});
