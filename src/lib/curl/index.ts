import { spawnSync } from 'child_process';
import { CurlMethods } from './enum/CurlMethods';
import { ICurlOptions, ICurlResponse } from './interface';

export * from './enum/CurlMethods';
export * from './interface';


export default function request(options: ICurlOptions): ICurlResponse {
    if (!options.method) {
        options.method = CurlMethods.GET;
    }

    if (options.body) {
        if (typeof options.body === 'string') {
            options.body = JSON.parse(options.body);
        }
    }

    const url = options.url;

    const result = spawnSync('node', ['./child.js', url, '-o', JSON.stringify(options)], {
        cwd: __dirname
    });
    const { stdout } = result;
    const resultString = stdout.toString();

    const response = resultString ? JSON.parse(resultString) : {};

    return {
        ...response,
         isJSON() {
            return (this.headers ? this.headers['content-type'] as string : '' || '').startsWith('application/json');
        },
    } as ICurlResponse;
}
