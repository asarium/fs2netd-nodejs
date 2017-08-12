import * as winston from "winston";
import {Database} from "../../../src/db/Database";
import {IOnlineUserPojo} from "../../../src/db/models/OnlineUser";
import {IOnlineUserInstance} from "../../../src/db/models/OnlineUser";
import {IUserInstance} from "../../../src/db/models/User";
import {IGameClient} from "../../../src/tracker/GameClient";
import {GameClient} from "../../../src/tracker/GameClient";
import {IGameServer} from "../../../src/tracker/GameServer";
import {IHandlerContext} from "../../../src/tracker/handlers/Handlers";
import {ClientMessage} from "../../../src/tracker/packets/Messages";
import {ServerList} from "../../../src/tracker/ServerList";
import {Session} from "../../../src/tracker/Session";
import {initializeTestDatabase} from "../../db/TestDatabase";

export class TestClient implements IGameClient {
    public LastMessage: ClientMessage = null;

    public RemoteAddress: string;
    public RemotePort: number;
    public Authenticated: boolean          = false;
    public User: IUserInstance;
    public Session: Session                = new Session(42);
    public OnlineUser: IOnlineUserInstance = null;
    public LastPing: number;
    public IsServer: boolean               = false;

    public sendToClient(msg: ClientMessage): Promise<void> {
        this.LastMessage = msg;

        return Promise.resolve();
    }

    public getOnlineUserData(): IOnlineUserPojo {
        return {};
    }
}

export class TestServer implements IGameServer {
    public ServerList: ServerList;

    constructor(db: Database) {
        this.ServerList = new ServerList(db);
    }

    public getClientFromPilot(pilot: string): GameClient {
        return null;
    }
}

export interface ITestContext extends IHandlerContext {
    Server: TestServer;
    Client: TestClient;
}

export async function getHandlerContext(): Promise<ITestContext> {
    const db = await initializeTestDatabase();

    return {
        Client:   new TestClient(),
        Database: db,
        Server:   new TestServer(db),
        Logger:   new winston.Logger(),
    };
}
