export class UnknowReuqestError extends Error {
    constructor(message?: string) {
        super(message);
        this.message = `UnknowReuqestError: ${message || this.message}`;
    }
}
