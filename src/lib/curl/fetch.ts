import { Worker, isMainThread } from 'worker_threads';
import * as path from 'path';

export function fetch(url: string, options: any) {
    if (isMainThread) {
        const response = fetchDataSync(url, options);
        return response;
    }
}

function fetchDataSync(url: string, options: any): any {
    // 创建共享内存区域，用 Uint8Array 存储字符串（字节数组），并使用 Int32Array 来控制同步
    const sharedArrayBuffer = new SharedArrayBuffer(81920); // 用于存储数据
    const uint8Array = new Uint8Array(sharedArrayBuffer);  // 用于存储字符串数据（字节数组）

    const sharedBufferSync = new SharedArrayBuffer(4);  // 用于同步标志（标记数据是否已准备好）
    const int32Array = new Int32Array(sharedBufferSync);  // 用于控制同步的数组（存储标志位）

    new Worker(path.join(__dirname, 'thead.js'), {
        workerData: { url, options, sharedArrayBuffer, sharedBufferSync },
    });

    // 等待子线程通过 Atomics 通知主线程
    console.log('Waiting for data from worker...');
    Atomics.wait(int32Array, 0, 0); // 等待子线程写入数据

    // 数据准备好后，读取数据（转换为字符串）
    const responseData = new TextDecoder().decode(uint8Array).trim(); // 从共享内存读取并解码为字符串

    if(responseData) {
        return {
            body: JSON.parse(responseData),
            version: 'HTTP/1.1',
            headers: {
                'content-type': 'application/json',
            },
            status: 200,
            message: 'ok',
        }
    }
}