import * as http from 'http';
import { spawnSync } from 'child_process';

export enum CurlMethods {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    OPTIONS = 'OPTIONS',
    HEAD = 'HEAD',
    PATCH = 'PATCH',
    TRACE = 'TRACE',
    CONNECT = 'CONNECT',
}
export interface CurlResponse {
    body: string;
    headers: http.IncomingHttpHeaders;
    version: string;
    status: number;
    message: string;
    isJSON(): boolean;
}

export interface CurlOptions {
    method?: CurlMethods;
    url: string;
    body?: any;
    connectTimeout?: number;
    timeout?: number;
    headers?: string[];
}


export default function request(options: CurlOptions): CurlResponse {
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
            return (this.headers['content-type'] as string || '').startsWith('application/json');
        },
    } as CurlResponse;
}
