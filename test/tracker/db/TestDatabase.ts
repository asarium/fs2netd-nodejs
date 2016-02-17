import {Database} from "../../../src/tracker/db/Database";
import * as Promise from "bluebird";
import {DatabaseOptions} from "../../../src/tracker/db/Database";

require("sqlite3");

export function initializeTestDatabase(): Promise<Database> {
    let db = new Database();

    let config: DatabaseOptions = {
        sequelize: {
            dialect: "sqlite",
            logging: false
        }
    };

    return db.initialize(config).then(() => db);
}