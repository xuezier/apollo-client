import yargs from 'yargs';
import request from '../request';

const argv = yargs(process.argv).options('options', {
    alias: 'o',
    type: 'string',
    description: 'curl request options',
}).argv;
const optionsString = argv.o;
const anonymousArgs = argv._;

(async function () {
    const url = anonymousArgs[0];
    if (!url) return console.log('');

    const options = optionsString ? JSON.parse(<string>optionsString) : {};
    const result = await request(<string>url, options);

    const response = {
        body: result.data,
        headers: result.headers,
        version: `HTTP/${result.httpVersion}`,
        status: result.statusCode,
        message: result.statusMessage,
    }

    console.log(JSON.stringify(response));
})()