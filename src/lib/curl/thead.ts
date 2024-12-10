import { workerData } from 'worker_threads';
import * as http from 'http';
import * as https from 'https';


const uint8Array = new Uint8Array(workerData.sharedArrayBuffer);
const syncInt32Array = new Int32Array(workerData.sharedBufferSync);

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

        // 保存有效数据的长度
        int32Array[0] = data.length;  // 保存有效数据的长度

        // 将数据存储在共享内存中
        uint8Array.set(dataBytes, 4);  // 从第4字节开始存储数据（前4字节用来存储长度）

        // 通知主线程数据已准备好
        Atomics.store(syncInt32Array, 0, 1);  // 修改同步标志
        Atomics.notify(syncInt32Array, 0, 1);  // 通知主线程
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    // 通知主线程数据已准备好
    Atomics.store(int32Array, 0, 1);  // 修改同步标志
    Atomics.notify(int32Array, 0, 1);  // 通知主线程
});

req.end();
