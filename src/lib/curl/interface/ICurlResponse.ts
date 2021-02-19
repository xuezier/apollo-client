import * as http from 'http';

export interface ICurlResponse {
    body: string;
    headers: http.IncomingHttpHeaders;
    version: string;
    status: number;
    message: string;
    isJSON(): boolean;
}