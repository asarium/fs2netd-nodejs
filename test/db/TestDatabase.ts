import {Database} from "../../src/db/Database";
import * as Promise from "bluebird";
import {DatabaseOptions} from "../../src/db/Database";

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