export class RequestError extends Error {
    constructor(msg?: string | Error) {
        super();
        if (typeof msg === 'object') {
            this.stack = msg.stack;
            msg = msg.message;
        }

        this.message = `RequestError: ${msg}`;
    }
    toString() {
        return this.message;
    }
}
