import { workerData } from 'worker_threads';
import * as http from 'http';
import * as https from 'https';


const uint8Array = new Uint8Array(workerData.sharedArrayBuffer);
const int32Array = new Int32Array(workerData.sharedArrayBuffer);
const { url, options } = workerData;

const request = url.startsWith('https') ?
    https.request :
    http.request;
const req = request(url, options, (res) => {
    let data = '';

    res.on('data', chunk => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('HTTP request complete');

        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(data);

        // 将字节数组写入共享内存
        uint8Array.set(dataBytes, 0);

        // 通知主线程数据已准备好
        Atomics.store(int32Array, 0, 1);  // 修改同步标志
        Atomics.notify(int32Array, 0, 1);  // 通知主线程
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    // 通知主线程数据已准备好
    Atomics.store(int32Array, 0, 1);  // 修改同步标志
    Atomics.notify(int32Array, 0, 1);  // 通知主线程
});

req.end();
