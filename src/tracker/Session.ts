import * as crypto from "crypto";

export class Session {
    public static createSession(): Promise<Session> {
        return new Promise<Session>((done, reject) => {
            crypto.randomBytes(4, (ex, buf) => {
                if (ex) {
                    reject(ex);
                    return;
                }

                const hex    = buf.toString("hex");
                let randomId = parseInt(hex, 16);

                // We need a signed integer so clear the top bit
                if (randomId > 2147483647) {
                    randomId -= 2147483647;
                }

                done(new Session(randomId));
            });
        });
    }

    private _id: number;
    private _activePilot: string = null;

    constructor(id: number) {
        this._id = id;
    }

    get Id(): number {
        return this._id;
    }

    get ActivePilot(): string {
        return this._activePilot;
    }

    set ActivePilot(value: string) {
        this._activePilot = value;
    }

    public isValid(sid: number): boolean {
        return this._id === sid;
    }
}
