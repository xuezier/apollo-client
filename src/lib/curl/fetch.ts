import { Worker, isMainThread } from 'worker_threads';

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

    const worker = new Worker('./thead.js', {
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