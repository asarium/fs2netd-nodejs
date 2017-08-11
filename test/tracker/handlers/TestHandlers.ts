import {IGameClient} from "../../../src/tracker/GameClient";
import {ClientMessage} from "../../../src/tracker/packets/Messages";
import {IOnlineUserPojo} from "../../../src/db/models/OnlineUser";
import {IUserInstance} from "../../../src/db/models/User";
import {Session} from "../../../src/tracker/Session";
import {IOnlineUserInstance} from "../../../src/db/models/OnlineUser";
import {IHandlerContext} from "../../../src/tracker/handlers/Handlers";
import {Database} from "../../../src/db/Database";
import {initializeTestDatabase} from "../../db/TestDatabase";
import {IGameServer} from "../../../src/tracker/GameServer";
import {ServerList} from "../../../src/tracker/ServerList";
import {GameClient} from "../../../src/tracker/GameClient";
import * as winston from "winston";

export class TestClient implements IGameClient {
    sendToClient(msg: ClientMessage): Promise<void> {
        this.LastMessage = msg;

        return Promise.resolve();
    }

    getOnlineUserData(): IOnlineUserPojo {
        return {};
    }

    LastMessage: ClientMessage = null;

    RemoteAddress: string;
    RemotePort: number;
    Authenticated: boolean          = false;
    User: IUserInstance;
    Session: Session                = new Session(42);
    OnlineUser: IOnlineUserInstance = null;
    LastPing: number;
    IsServer: boolean               = false;
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

export interface TestContext extends IHandlerContext {
    Server: TestServer;
    Client: TestClient;
}

export async function getHandlerContext(): Promise<TestContext> {
    const db = await initializeTestDatabase();

    return {
        Client:   new TestClient(),
        Database: db,
        Server:   new TestServer(db),
        Logger:   new winston.Logger(),
    };
}
