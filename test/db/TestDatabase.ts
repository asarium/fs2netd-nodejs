
import {Database} from "../../src/db/Database";
import {IDatabaseOptions} from "../../src/db/Database";

export function initializeTestDatabase(): Promise<Database> {
    const db = new Database();

    const config: IDatabaseOptions = {
        sequelize: {
            dialect: "sqlite",
            logging: false,
        },
    };

    return db.initialize(config).then(() => db);
}
