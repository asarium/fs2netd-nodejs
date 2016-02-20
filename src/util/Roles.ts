import * as Promise from "bluebird";
import {UserInstance} from "../db/models/User";

const ADMIN_ROLE_NAME = "Admin";

export function isAdmin(user: UserInstance): Promise<boolean> {
    return user.countRoles({
                               where: {
                                   Name: ADMIN_ROLE_NAME
                               }
                           }).then(roles => {
        return roles >= 1;
    })
}
