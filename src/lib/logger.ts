export class Logger extends console.Console {
    constructor() {
        super({stdout: process.stdout, stderr: process.stderr})
    }
}