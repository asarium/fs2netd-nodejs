"use strict";

// Copied from http://stackoverflow.com/a/14657922

export interface ILiteEvent<T> {
    on(handler: (data?: T) => void);

    off(handler: (data?: T) => void);
}

export class LiteEvent<T> implements ILiteEvent<T> {
    private handlers: Array<(data?: T) => void> = [];

    public on(handler: (data?: T) => void) {
        this.handlers.push(handler);
    }

    public off(handler: (data?: T) => void) {
        this.handlers = this.handlers.filter((h) => h !== handler);
    }

    public trigger(data?: T) {
        this.handlers.slice(0).forEach((h) => h(data));
    }
}
