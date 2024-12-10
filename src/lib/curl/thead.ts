import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import request from '../request';

export function fetch(url: string, options: any) {
    if (isMainThread) {
        const response = fetchDataSync(url, options);
        return response;
    }
}

function fetchDataSync(url: string, options: any): any {
    const sharedArrayBuffer = new SharedArrayBuffer(4); // 创建共享内存
    const int32Array = new Int32Array(sharedArrayBuffer);

    let response: any = null;

    const worker = new Worker(__filename, {
        workerData: { url, options, sharedArrayBuffer },
    });

    worker.on('message', result => {
        response = result;
        Atomics.store(int32Array, 0, 1); // 将标志位设为1，表示完成
        Atomics.notify(int32Array, 0); // 通知主线程
    });

    // 主线程阻塞等待
    Atomics.wait(int32Array, 0, 0);

    return response;
}

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
