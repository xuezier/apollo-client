import * as http from 'http';
import { CurlMethods } from '../enum/CurlMethods';

export interface ICurlOptions {
    method?: CurlMethods;
    url: string;
    body?: any;
    connectTimeout?: number;
    timeout?: number;
    headers?: http.OutgoingHttpHeaders;
}
