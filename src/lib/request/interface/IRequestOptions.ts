import * as http from 'http';
import { RequestMethod } from '../enum/RequestMethod';

export interface IRequestOptions {
    header?: http.OutgoingHttpHeaders;
    headers?: http.OutgoingHttpHeaders;
    method?: keyof typeof RequestMethod;
    timeout?: number;
    data?: any;
}
