# EGG-APOLLO-CLIENT
[![NPM version][npm-image]][npm-url]

[npm-image]: https://img.shields.io/npm/v/@gaoding/apollo-client.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@gaoding/apollo-client

    ******************************************************************
    ******************************************************************
    **********              代码千万行，注释第一行              **********
    **********              编码不规范，同事泪两行              **********
    ******************************************************************
    ******************************************************************

携程 Apollo 配置中心 egg 客户端版本

## FIRST
使用时，需要确定有 curl 命令
```bash
# centos 7
yum install curl

# ubuntu
apt-get install curl

# docker node:alpine
apk add --no-cache --virtual native-deps \
    curl
```

## Installation
```bash
npm i @gaoding/apollo-client [--save]
```

## Usage

```js
// config/config.[env].js
const Apollo = require('@gaoding/apollo-client').Apollo

const apollo = new Apollo({
    config_server_url: 'http[s]://xxxxxxx', // required, 配置中心服务地址
    app_id: 'xxx',                          // required, 需要加载的配置
    cluster_name: 'xxx',                    // optional, 加载配置的集群名称, default: 'default'
    namespace_name: 'xxx',                  // optional, 加载配置的命名空间, default: 'application'
    release_key: 'xxx',                     // optional, 加载配置的版本 key, default: ''
    ip: 'xxx'                               // optional,

    set_env_file: false,                    // optional, 是否写入到 env 文件, default: false
    env_file_path: 'xxxx',                  // optional, 写入的 env 文件路径, default: ${app.baseDir}/.env.apollo
    watch: false,                           // optional, 长轮询查看配置是否更新, default: false
    timeout: 50000,                         // optional, 长轮询 timeout 设置，默认 50000
});
apollo.init() // 加载配置
```

```js
// 直接提取配置
const env = apollo.get('${namespace}.NODE_ENV');
// 不添加 namespace 前缀的时候，默认使用 application 的配置
// 如果 application 不包含该配置，则提取 process.env 里面的配置
// const env = apollo.get('NODE_ENV');
// 提取类型配置
apollo.getString('${namespace}.${string_config}');
apollo.getNumber('${namespace}.${number_config}');
apollo.getBoolean('${namespace}.${boolean_config}');
apollo.getJSON('${namespace}.${json_config}');
apollo.getDate('${namespace}.${date_config}');


// 提取指定 namespace 内容
const application = apollo.getNamespace('application');
// 提取配置
const config1 = application.get('config1');
// 提取 string 类型配置
const str = application.getString('config2');
// 提取 number 类型配置
const num = application.getNumber('config3');
// 提取 boolean 类型配置
const bool = application.getBoolean('config4');
// 提取 json
const json = application.getJSON('config5');
// 提取 date
const date = application.getDate('config6');

// 提取所有配置内容
const all = apollo.getAll();
// 可以从 all 中提取需要的 namespace 配置
// const application = all.application
// const config1 = application.get('config1');
// const str = application.getString('config2');
// const num = application.getNumber('config3');
// const bool = application.getBoolean('config4');
// const json = application.getJSON('config5');
// const date = application.getDate('config6');
```

### 启动自定义
```js
apollo.init({...});
```

## Tips
- ✅ 支持初始化的同步加载配置，解决远程加载配置是异步的问题
- ✅ 支持将配置写入到本地文件，需要开启 set_env_file
- ✅ 当读取远程配置出错时，兼容本地 env 文件读取, 需要开启 set_env_file

## Todo
- ✅ 支持配置订阅模式
- 🔥 支持多集群加载
