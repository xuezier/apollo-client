import { isMainThread, parentPort, workerData } from 'worker_threads';
import request from '../request';

if (!isMainThread) {
    (async () => {
        try {
            const result = await request(workerData.url, workerData.options);
            const response = {
                body: result.data,
                headers: result.headers,
                version: `HTTP/${result.httpVersion}`,
                status: result.statusCode,
                message: result.statusMessage,
            };
            parentPort!.postMessage(response); // 发送结果给主线程
        } catch (err) {
            parentPort!.postMessage({ error: err.message });
        }
    })();
}
