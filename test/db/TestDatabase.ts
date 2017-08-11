import {Database} from "../../src/db/Database";
import * as Promise from "bluebird";
import {IDatabaseOptions} from "../../src/db/Database";

export function initializeTestDatabase(): Promise<Database> {
    let db = new Database();

    let config: IDatabaseOptions = {
        sequelize: {
            dialect: "sqlite",
            logging: false
        }
    };

    return db.initialize(config).then(() => db);
}