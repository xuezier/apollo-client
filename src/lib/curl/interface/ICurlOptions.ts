import { CurlMethods } from '../enum/CurlMethods';

export interface ICurlOptions {
    method?: CurlMethods;
    url: string;
    body?: any;
    connectTimeout?: number;
    timeout?: number;
    headers?: string[];
}
