import {IGameClient} from "../../../src/tracker/GameClient";
import {ClientMessage} from "../../../src/tracker/packets/Messages";
import {OnlineUserPojo} from "../../../src/tracker/db/models/OnlineUser";
import {UserInstance} from "../../../src/tracker/db/models/User";
import {Session} from "../../../src/tracker/Session";
import {OnlineUserInstance} from "../../../src/tracker/db/models/OnlineUser";
import * as Promise from "bluebird";
import {HandlerContext} from "../../../src/tracker/handlers/Handlers";
import {Database} from "../../../src/tracker/db/Database";
import {initializeTestDatabase} from "../db/TestDatabase";
import {IGameServer} from "../../../src/tracker/GameServer";
import {ServerList} from "../../../src/tracker/ServerList";
import {GameClient} from "../../../src/tracker/GameClient";
import * as winston from "winston";

export class TestClient implements IGameClient {
    sendToClient(msg: ClientMessage): Promise<void> {
        this.LastMessage = msg;

        return Promise.resolve();
    }

    getOnlineUserData(): OnlineUserPojo {
        return {};
    }

    LastMessage: ClientMessage = null;

    RemoteAddress: string;
    RemotePort: number;
    Authenticated: boolean = false;
    User: UserInstance;
    Session: Session = new Session(42);
    OnlineUser: OnlineUserInstance = null;
    LastPing: number;
    IsServer: boolean = false;
}

export class TestServer implements IGameServer {

    constructor(db: Database) {
        this.ServerList = new ServerList(db);
    }

    getClientFromPilot(pilot: string): GameClient {
        return null;
    }

    ServerList: ServerList;
}

export interface TestContext extends HandlerContext {
    Server: TestServer;
    Client: TestClient;
}

export function getHandlerContext(): Promise<TestContext> {
    return initializeTestDatabase().then(db => {
        return {
            Client: new TestClient(),
            Database: db,
            Server: new TestServer(db),
            Logger: new winston.Logger(),
        }
    });
}
