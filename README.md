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

携程 Apollo 配置中心 node.js 客户端版本

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

// 动态更新本地配置
apollo.startNotification(config?: IApolloRequestConfig);
```

### 启动自定义
```js
apollo.init({...});
```

## OpenApi
使用此 open api 需要先了解 Apollo 开放平台，详情请看链接：https://ctripcorp.github.io/apollo/#/zh/usage/apollo-open-api-platform

此插件是对 openApi 的 restful 接口调用进行整合打包，方便调用

### 初始化
具有两种初始化方案

1. 跟随 Apollo 客户端初始化
```js
const apollo = new Apollo({
    ...apolloConfig,
    token: 'xxxxxxx',                           // Http Header中增加一个Authorization字段，字段值为申请的token
    portal_address: 'https://apollo.xxxx.com',  // portal url
});

const openApi = apolle.openApi;
```
2. 独立初始化
```js
const { OpenApi } = require('@gaoding/apollo');

const openApi = new OpenApi({
    token: 'xxxxxxx',                           // required, Http Header中增加一个Authorization字段，字段值为申请的token
    portal_address: 'https://apollo.xxxx.com',  // required, portal url
    app_id: 'xxx',                              // optional, 需要加载的配置
    cluster_name: 'xxx',                        // optional, 加载配置的集群名称, default: 'default'
    namespace_name: 'xxx',                      // optional, 加载配置的命名空间, default: 'application'
});
```

### api
api 参数和详细文档请参照：https://ctripcorp.github.io/apollo/#/zh/usage/apollo-open-api-platform?id=%e4%b8%89%e3%80%81-%e6%8e%a5%e5%8f%a3%e6%96%87%e6%a1%a3

openApi Methods:
- getEnvclustersWithAppid(appId?: string)
  - 获取App的环境，集群信息
- getApps()
  - 获取App信息
- getClusterInfo(params)
  - 获取集群
- createCluster(params)
  - 创建集群
- getNamespaces(params)
  - 获取集群下所有Namespace信息
- getNamespaceInfo(params)
  - 获取某个Namespace信息
- createNamespace(params)
  - 创建Namespace
- getNamespcaeLockInfo(params)
  - 获取某个Namespace当前编辑人
- getConfigByKey(params)
  - 读取配置
- addConfig(params)
  - 新增配置
- modifyConfig(params)
  - 修改配置
- deleteConfigByKey(params)
  - 删除配置
- releaseConfigs(params)
  - 发布配置
- getLatestRelease(params)
  - 获取某个Namespace当前生效的已发布配置
- rollbackRelease(params)
  - 回滚已发布配置
## Tips
- ✅ 支持初始化的同步加载配置，解决远程加载配置是异步的问题
- ✅ 支持将配置写入到本地文件，需要开启 set_env_file
- ✅ 当读取远程配置出错时，兼容本地 env 文件读取, 需要开启 set_env_file

## Todo
- ✅ 支持配置订阅模式
- ✅ 支持 openApi