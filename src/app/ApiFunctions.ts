import {Database} from "../db/Database";
import {IUserInstance} from "../db/models/User";
import {verifyPassword} from "../util/Authentication";

export class InvalidAuthenticationError extends Error {
}

/**
 * Contains the more complicated API function for usage in multiple data retrieval backends.
 */
export class ApiFunctions {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    public async verifyLogin(userName: string, password: string): Promise<IUserInstance> {
        const user = await this.db.Models.User.find({
                                                        where: {
                                                            Username: userName,
                                                        },
                                                    });

        if (user == null) {
            throw new InvalidAuthenticationError();
        }

        const valid = await verifyPassword(user, password);

        if (!valid) {
            throw new InvalidAuthenticationError();
        }

        return user;
    }
}
