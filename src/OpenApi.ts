import * as assert from 'assert';

import { IOpenApiConfig } from "./interface/IOpenApiConfig";
import { Logger } from "./lib/logger";
import request, { RequestError } from "./lib/request";
import { IRequestOptions } from "./lib/request/interface/IRequestOptions";
import { ClusterInfo } from "./type/ClusterInfo";
import { Namespace, NamespaceCreateResponse, NamespaceLockResponse } from "./type/Namespace";
import { KeyConfig } from "./type/OpenApiKeyConfig";
import { ReleaseInfo } from "./type/Release";

export class OpenApi {
    private _portal_address: string;
    get portal_address() {
        return this._portal_address;
    }

    private _token: string;
    get token() {
        return this._token;
    }

    private _appId?: string;
    get appId() {
        return this._appId;
    }

    private _clusterName?: string;
    get clusterName() {
        return this._clusterName;
    }

    private _namespaceName?: string;
    get namespaceName() {
        return this._namespaceName;
    }

    logger: Logger;

    constructor(options: IOpenApiConfig, logger: any = new Logger()) {
        assert(options.token, 'config options key `token` is required');
        assert(options.portal_address, 'config options key: `portal_address` is required');

        this._portal_address = options.portal_address;
        this._token = options.token;
        this._appId = options.app_id;
        this._clusterName = options.cluster_name;
        this._namespaceName = options.namespace_name;

        this.logger = logger;
    }

    private _mergeParams(params) {
        return {
            appId: this.appId,
            clusterName: this.clusterName,
            namespaceName: this.namespaceName,
            ...params,
        };
    }

    private async request(url: string, options: IRequestOptions = {}) {
        const address = `${this.portal_address}/openapi/v1${url}`;

        options.headers = {
            ...options.headers,
            'Authorization': this.token,
            'content-type': 'application/json;charset=UTF-8',
        }

        const response = await request(address, options);

        if (response.statusCode === 204) {
            return null;
        }

        if (response.statusCode !== 200) {
            if (response.data) {
                const error = new RequestError(response.data.message);
                throw error;
            }
            else {
                const error = new RequestError(response.statusMessage);
                throw error;
            }
        }

        if (!response.data) {
            return;
        }

        if (!response.isJSON()) {
            const error = new RequestError(response.data);
            this.logger.error(error);
            return;
        }

        return response.data;
    }

    /**
     * @description 获取App的环境，集群信息
     */
    async getEnvclustersWithAppid(appId?: string): Promise<{
        env: string;
        clusters: string[];
    }[]> {
        const result = await this.request(`/apps/${appId || this.appId}/envclusters`);

        return result;
    }

    /**
     * @description 获取集群
     */
    async getClusterInfo(params: {
        appId?: string,
        env: string;
        clusterName?: string;
    }): Promise<ClusterInfo> {
        params = this._mergeParams(params);
        const { env, appId, clusterName } = params;

        return this.request(`/envs/${env}/apps/${appId}/clusters/${clusterName}`);
    }

    /**
     * @description 创建集群
     */
    async createCluster(params: {
        env: string;
        appId?: string;
        name: string;
        dataChangeCreatedBy: string;
    }): Promise<ClusterInfo> {
        params = this._mergeParams(params);
        const { env, appId, name, dataChangeCreatedBy } = params;

        return this.request(`/envs/${env}/apps/${appId}/clusters`, {
            data: {
                name,
                appId,
                dataChangeCreatedBy,
            },
            method: 'POST',
        })
    }

    /**
     * @description 获取集群下所有Namespace信息
     */
    async getNamespaces(params: {
        env: string;
        appId?: string;
        clusterName?: string;
    }): Promise<Namespace[]> {
        params = this._mergeParams(params);
        const { env, appId, clusterName } = params;

        return this.request(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces`);
    }

    /**
     * @description 获取某个Namespace信息
     */
    async getNamespaceInfo(params: {
        env: string;
        appId?: string;
        clusterName?: string;
        namespaceName?: string;
    }): Promise<Namespace> {
        params = this._mergeParams(params);
        const { env, appId, clusterName, namespaceName } = params;

        return this.request(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}`);
    }

    /**
     * @description 创建Namespace
     */
    async  createNamespace(params: {
        appId?: string;
        name: string;
        format: 'properties' | 'xml' | 'json' | 'yml' | 'yaml';
        isPublic: boolean;
        comment?: string;
        dataChangeCreatedBy: string;
    }): Promise<NamespaceCreateResponse> {
        params = this._mergeParams(params);
        const { appId } = params;

        return this.request(`/apps/${appId}/appnamespaces`, {
            data: params,
            method: 'POST',
        });
    }

    /**
     * @description 获取某个Namespace当前编辑人
     */
    async getNamespcaeLockInfo(params: {
        env: string;
        appId?: string;
        clusterName?: string;
        namespaceName?: string;
    }): Promise<NamespaceLockResponse> {
        params = this._mergeParams(params);
        const { env, appId, clusterName, namespaceName } = params;

        return this.request(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/lock`);
    }

    /**
     * @description 读取配置
     */
    async getConfigByKey(params: {
        env: string;
        appId?: string;
        clusterName?: string;
        namespaceName?: string;
        key: string;
    }): Promise<KeyConfig> {
        params = this._mergeParams(params);
        const { env, appId, clusterName, namespaceName, key } = params;

        return this.request(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/${key}`);
    }

    /**
     * @description 新增配置
     */
    async addConfig(params: {
        env: string;
        appId?: string;
        clusterName?: string;
        namespaceName?: string;
        key: string;
        value: string;
        comment?: string;
        dataChangeCreatedBy: string;
    }): Promise<KeyConfig> {
        params = this._mergeParams(params);
        const { env, appId, clusterName, namespaceName, key, value, comment, dataChangeCreatedBy } = params;

        return this.request(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items`, {
            data: {
                key,
                value,
                comment,
                dataChangeCreatedBy,
            },
            method: 'POST',
        })
    }

    /**
     * @description 修改配置
     */
    async modifyConfig(params: {
        createIfNotExists?: boolean;
        env: string;
        appId?: string;
        clusterName?: string;
        namespaceName?: string;
        key: string;
        value: string;
        comment?: string;
        dataChangeLastModifiedBy: string;
        dataChangeCreatedBy?: string;
    }): Promise<void> {
        params = this._mergeParams(params);
        const { createIfNotExists, env, appId, clusterName, namespaceName, comment, key, value, dataChangeLastModifiedBy, dataChangeCreatedBy } = params;

        const data = { key, value, comment, dataChangeLastModifiedBy, dataChangeCreatedBy };
        let url = `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/${key}`;

        if (createIfNotExists) {
            url += `?createIfNotExists=true`;
        }

        return this.request(url, {
            data,
            method: 'PUT',
        })
    }

    /**
     * @description 删除配置
     */
    async deleteConfigByKey(params: {
        env: string;
        appId?: string;
        clusterName?: string;
        namespaceName?: string;
        key: string;
        operator: string;
    }): Promise<void> {
        params = this._mergeParams(params);
        const { env, appId, clusterName, namespaceName, key, operator } = params;

        return this.request(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/${key}?operator=${operator}&key=${key}`, {
            method: 'DELETE',
        });
    }

    /**
     * @description 发布配置
     */
    async releaseConfigs(params: {
        env: string;
        appId?: string;
        clusterName?: string;
        namespaceName?: string;
        releaseTitle: string;
        releaseComment?: string;
        releasedBy: string;
    }): Promise<ReleaseInfo> {
        params = this._mergeParams(params);
        const { env, appId, clusterName, namespaceName, releaseTitle, releasedBy, releaseComment } = params;

        return this.request(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/releases`, {
            method: 'POST',
            data: {
                releasedBy,
                releaseTitle,
                releaseComment,
            },
        });
    }

    /**
     * @description 获取某个Namespace当前生效的已发布配置
     */
    async getLatestRelease(params: {
        env: string;
        appId?: string;
        clusterName?: string;
        namespaceName?: string;
    }): Promise<ReleaseInfo> {
        params = this._mergeParams(params);
        const { env, appId, clusterName, namespaceName } = params;

        return this.request(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/releases/latest`);
    }

    /**
     * @description 回滚已发布配置
     */
    async rollbackRelease(params: {
        env: string;
        releaseId: string | number;
        operator: string;
    }) {
        const { env, releaseId, operator } = params;

        return this.request(`/envs/${env}/releases/${releaseId}/rollback?operator=${operator}`, {
            method: 'PUT',
            data: { operator },
        })
    }

    /**
     * @description 获取App信息
     */
    async getApps(): Promise<{
        name: string;
        appId: string;
        orgId: string;
        orgName: string;
        ownerName: string;
        ownerEmail: string;
        dataChangeCreatedBy: string;
        dataChangeLastModifiedBy: string;
        dataChangeCreatedTime: string;
        dataChangeLastModifiedTime: string;
    }[]> {
        return this.request('/apps')
    }
}