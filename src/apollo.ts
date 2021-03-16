import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as assert from 'assert';
import * as crypto from 'crypto';
import { tmpdir } from 'os';
import { EventEmitter } from 'events';

import request, { RequestError } from './lib/request';

import curl, { CurlMethods, ICurlResponse } from './lib/curl';
import Configs from './configs';
import { EnvReader } from './env-reader';
import { Logger } from './lib/logger';
import { IApolloConfig } from './interface/IApolloConfig';
import { IApolloRequestConfig } from './interface/IApolloRequestConfig';
import { ApolloConfigError } from './error/ApolloConfigError';
import { ApolloInitConfigError } from './error/ApolloInitConfigError';
import { IApolloReponseConfigData } from './interface/IApolloReponseConfigData';
import { IApolloLongPollingResponseData } from './interface/IApolloLongPollingResponseData';
import { ApolloEvent } from './type/Event';
import { OpenApi } from './OpenApi';

export default class Apollo extends EventEmitter {
    logger: any;

    private _config_server_url = '';
    private _app_id = '';
    private _secret = '';
    private _cluster_name = 'default';
    private _namespace_name = 'application';
    private _release_key = '';
    private _ip = '';
    private _watch = false;
    private _set_env_file = false;
    private _init_on_start = true;
    private _env_file_path = '';
    private _env_file_type = 'properties';
    private _token = '';
    private _portal_address = '';

    private _envReader: EnvReader;

    private _delay = 1000;
    private _timeout = 50000;

    private _apollo_env: { [x: string]: string } = {};
    private _configs = new Configs();
    private _notifications: { [x: string]: number } = {};

    private _openApi: OpenApi;

    constructor(config: IApolloConfig, logger: any = new Logger()) {
        super();

        this.logger = logger;

        assert(config.config_server_url, 'config option config_server_url is required');
        assert(config.app_id, 'config option app_id is required');

        config.env_file_path = this.checkEnvPath(config.env_file_path);

        for (const key in config) {
            this.setConfig(key, config[key]);
        }

        this._envReader = new EnvReader({
            env_file_type: this.env_file_type,
            logger: this.logger
        });

        if (config.token && config.portal_address) {
            this._openApi = new OpenApi({
                token: this.token,
                portal_address: this.portal_address,
                app_id: this.app_id,
                cluster_name: this.cluster_name,
                namespace_name: this.namespace_name,
            }, this.logger);
        }
    }

    get openApi() {
        if (!this._openApi) {
            throw new ApolloConfigError(`missing config key: \`secret\`, cannot create openApi instance`);
        }

        return this._openApi;
    }

    get token() {
        return this._token;
    }

    get portal_address() {
        return this._portal_address;
    }

    get config_server_url() {
        return this._config_server_url;
    }

    get app_id() {
        return this._app_id;
    }

    get secret() {
        return this._secret;
    }

    get cluster_name() {
        return this._cluster_name;
    }

    get namespace_name() {
        return this._namespace_name;
    }

    get release_key() {
        return this._release_key;
    }

    get ip() {
        return this._ip;
    }

    get watch() {
        return this._watch;
    }

    get env_file_path() {
        return this._env_file_path;
    }

    get env_file_type() {
        return this._env_file_type;
    }

    get set_env_file() {
        return this._set_env_file;
    }

    get init_on_start() {
        return this._init_on_start;
    }

    get configs() {
        return this._configs;
    }

    get apollo_env() {
        return this._apollo_env;
    }

    get notifications() {
        return this._notifications;
    }

    get delay() {
        return this._delay;
    }

    set delay(delay: number) {
        this.delay = delay;
    }

    get timeout() {
        return this._timeout;
    }

    get envReader() {
        return this._envReader;
    }

    on(event: ApolloEvent, listener: (config: IApolloReponseConfigData) => void) {
        super.on(event, listener);
        return this;
    }

    emit(event: ApolloEvent, ...args: any[]) {
        return super.emit(event, ...args);
    }

    private signature(timestamp: string, pathWithQuery: string) {
        const stringToSign = `${timestamp}\n${pathWithQuery}`;

        const sign = crypto.createHmac('sha1', this.secret).update(stringToSign).digest('hex');
        return sign;
    }

    /**
     * get namespace configs
     * @param namespace
     */
    getNamespace(namespace: string) {
        return this.configs.getNamespace(namespace);
    }

    /**
     * get All configs
     */
    getAll() {
        return this.configs.getAll();
    }

    /**
     * Init configs by a sync http request
     * @param config
     */
    init(config: IApolloRequestConfig = {}) {
        const { cluster_name = this.cluster_name, namespace_name = this.namespace_name } = config;

        const url = `${this.config_server_url}/configs/${this.app_id}/${cluster_name}/${namespace_name}`;
        const data = {
            releaseKey: this.release_key,
            ip: this.ip,
        };

        let response: ICurlResponse | undefined;
        let error;
        try {
            const options = {
                url,
                method: CurlMethods.GET,
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' } as http.OutgoingHttpHeaders,
            };
            if (this.secret) {
                const timestamp = Date.now().toString();
                const sign = this.signature(timestamp, url);

                options.headers = {
                    ...options.headers,
                    Authorization: sign,
                    Timestamp: timestamp
                }
            }
            response = curl(options);
        } catch (err) {
            error = err;
        } finally {
            if (error) {
                error = new ApolloInitConfigError(error);
            }

            else if (response) {
                const { body, status, message } = response;

                if (!response.isJSON()) {
                    error = new RequestError(body);
                } else if (status === 200) {
                    this.setEnv(body);
                } else {
                    error = new ApolloInitConfigError(message);
                }
            }

            if (error) {
                this.logger.warn('[egg-apollo-client] %j', error);

                if (this.set_env_file) {
                    this.readFromEnvFile();
                }
            }
        }
    }

    /**
     * @description 复写配置项信息
     * @author tunan
     * @param {string} key
     * @param {string} value
     * @memberof Apollo
     */
    setConfig(key: string, value: string) {
        if (!(key in this)) {
            throw new ApolloConfigError(`${key} not a apollo config`);
        }

        this['_' + key] = value;
    }

    async remoteConfigServiceFromCache(config: IApolloRequestConfig = {}) {
        const { cluster_name = this.cluster_name, namespace_name = this.namespace_name, release_key = this.release_key, ip = this.ip } = config;

        const url = `${this.config_server_url}/configfiles/json/${this.app_id}/${cluster_name}/${namespace_name}`;

        const options = {
            data: {
                releaseKey: release_key,
                ip,
            },
            headers: {}
        };

        if (this.secret) {
            const timestamp = Date.now().toString();
            const sign = this.signature(timestamp, url);

            options.headers = {
                Authorization: sign,
                Timestamp: timestamp,
            }
        }

        const response = await request(url, options);
        if (response.isJSON() || response.statusCode === 304) {
            if (response.data) {
                this.setEnv(response.data);
                this.emit('config.updated', response.data);
            }
            return response.data;
        }
    }

    async remoteConfigServiceSkipCache(config: IApolloRequestConfig = {}) {
        const { cluster_name = this.cluster_name, namespace_name = this.namespace_name, release_key = this.release_key, ip = this.ip } = config;

        const url = `${this.config_server_url}/configs/${this.app_id}/${cluster_name}/${namespace_name}`;
        const options = {
            data: {
                releaseKey: release_key,
                ip,
            },
            headers: {},
        };

        if (this.secret) {
            const timestamp = Date.now().toString();
            const sign = this.signature(timestamp, url);

            options.headers = {
                Authorization: sign,
                Timestamp: timestamp,
            }
        }

        const response = await request(url, options);
        if (response.isJSON() || response.statusCode === 304) {
            if (response.data) {
                this.setEnv(response.data);
            }
            return response.data;
        }
        else {
            const error = new RequestError(response.data);
            this.logger.error('[egg-apollo-client] %j', error);
        }
    }

    async startNotification(config: IApolloRequestConfig = {}) {
        let retryTimes = 0;

        while (true) {
            try {
                const data: IApolloLongPollingResponseData[] | undefined = await this.remoteConfigFromServiceLongPolling(config);
                if (data) {
                    for (const item of data) {
                        const { notificationId, namespaceName } = item;
                        if (this.notifications[namespaceName] !== notificationId) {
                            await this.remoteConfigServiceSkipCache(config);
                            this.notifications[namespaceName] = notificationId;
                        }
                    }
                }
                retryTimes = 0;
                // 请求成功的话，重置 delay 为初始值
                this._setDelay(1000);
            } catch (err) {
                if (err instanceof RequestError && err.message === 'RequestError: request timeout') {
                    continue;
                }

                this.logger.warn(err);

                if (retryTimes < 10) {
                    retryTimes++;
                    await new Promise(resolve => setTimeout(resolve, this.delay));
                    // 每次重试都要加长延时时间
                    this._setDelay();
                } else {
                    this.logger.error('[egg-apollo-client] request notification config got error more than 10 times. stop watching');
                    break;
                }
            }
        }
    }

    async remoteConfigFromServiceLongPolling(config: IApolloRequestConfig = {}) {
        const { cluster_name = this.cluster_name, notifications = [] } = config;
        if (!notifications.length) {
            notifications[0] = {
                namespaceName: 'application',
                notificationId: 0,
            };
        }

        for (const notification of notifications) {
            const { namespaceName } = notification;
            if (this.notifications[namespaceName]) {
                notification.notificationId = this.notifications[namespaceName];
            }
        }

        const url = `${this.config_server_url}/notifications/v2?appId=${this.app_id}&cluster=${cluster_name}&notifications=${encodeURI(JSON.stringify(notifications))}`;

        const options = {
            timeout: this.timeout,
            headers: {},
        };

        if (this.secret) {
            const timestamp = Date.now().toString();
            const sign = this.signature(timestamp, url);

            options.headers = {
                Authorization: sign,
                Timestamp: timestamp,
            }
        }

        const response = await request(url, options);

        if (response.statusCode !== 304 && !response.isJSON()) {
            throw new RequestError(response.data);
        } else {
            return response.data;
        }
    }

    get(key: string) {
        const configs = this.configs;

        return configs.get(key);
    }

    getString(key: string) {
        return this.configs.getString(key);
    }

    getNumber(key: string) {
        return this.configs.getNumber(key);
    }

    getBoolean(key: string) {
        return this.configs.getBoolean(key);
    }

    getJSON(key: string) {
        return this.configs.getJSON(key);
    }

    getDate(key: string) {
        return this.configs.getDate(key);
    }

    setEnv(data: IApolloReponseConfigData) {
        let { configurations, releaseKey, namespaceName } = data;
        if (namespaceName.endsWith('.json')) {
            configurations = JSON.parse(configurations.content);
        }
        this.setConfig('release_key', releaseKey);
        let config = this.configs.configs[namespaceName];

        if (!config) {
            config = new Map();
        }

        for (const key in configurations) {
            const configuration = configurations[key];
            process.env[`${namespaceName}.${key}`] = configuration;
            config.set(key, configuration);
        }

        if (this.set_env_file) {
            this.saveEnvFile(data);
        }

        this.configs.configs[namespaceName] = config;
    }

    protected saveEnvFile(data: IApolloReponseConfigData) {
        const { configurations, namespaceName, releaseKey } = data;

        this.apollo_env.release_key = releaseKey;
        for (const key in configurations) {
            this.apollo_env[`${namespaceName}.${key}`] = configurations[key];
        }

        let fileData = '';
        for (const key in this.apollo_env) {
            fileData += `${key}=${this.apollo_env[key]}\n`;
        }

        const envPath = this.env_file_path;
        if (fs.existsSync(envPath)) {
            // 只有 agent-worker 才能写入 env 文件
            // 避免多个 app-worker 写入的时候文件已被移除，造成错误
            const rename = `${envPath}.${Date.now()}`;
            try {
                fs.renameSync(envPath, rename);
            }
            catch (e) {
                process.env.NODE_ENV !== 'production' && console.error(e);
            }
        }
        fs.writeFileSync(envPath, fileData, 'utf-8');
    }

    protected readFromEnvFile(envPath: string = this.env_file_path) {
        const configs = this.envReader.readEnvFromFile(envPath);
        if (configs) {
            for (const namespaceKey in configs) {
                let config = this.configs.configs[namespaceKey];
                const configurations = configs[namespaceKey];

                if (!config) {
                    config = new Map();
                }

                for (const key in configurations) {
                    const configuration = configurations[key];
                    process.env[`${namespaceKey}.${key}`] = configuration;
                    config.set(key, configuration);
                }

                this.configs.configs[namespaceKey] = config;
            }
        }
    }

    protected checkEnvPath(envPath?: string) {
        const baseDir = tmpdir();

        if (!envPath) {
            envPath = path.resolve(baseDir, '.env.apollo');
        } else {
            if (!path.isAbsolute(envPath)) {
                // envPath = envPath.replace('/', '');
                envPath = path.resolve(baseDir, envPath);
            }

            if (fs.existsSync(envPath)) {
                try {
                    fs.readdirSync(envPath);

                    envPath = path.resolve(envPath, '.env.apollo');
                } catch (e) {
                    const errcode = e.code;
                    if (errcode !== 'ENOTDIR') {
                        envPath = path.resolve(baseDir, '.env.apollo');
                    }
                }
            } else {
                const last = envPath.split('/').pop();
                if (last && last.indexOf('.') > -1) {
                    // 如果 env path 是一个文件路径
                    const dir = envPath.replace(new RegExp(`${last}$`), '');
                    if (!fs.existsSync(dir)) {
                        //  创建前置文件夹
                        fs.mkdirSync(dir);
                    }
                } else {
                    // 如果 env path 是一个文件夹路径
                    fs.mkdirSync(envPath);
                    envPath = path.resolve(envPath, '.env.apollo');
                }
            }
        }

        return envPath;
    }

    private _setDelay(delay?: number) {
        if (!delay) {
            if (this.delay >= 1000000) {
                return;
            }
            delay = this.delay << 1;
        }

        this._delay = delay;
    }
}
