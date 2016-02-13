export class AuthenticationError extends Error {

}

export class NoSuchUserError extends Error {
    private _name: string;

    get Name(): string {
        return this._name;
    }

    constructor(name: string) {
        super("No such user: " + name);
        this._name = name;
    }
}

export class UnknownMessageError extends Error {
}
