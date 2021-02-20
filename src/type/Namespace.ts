export type Namespace = {
    appId: string,
    clusterName: string,
    namespaceName: string,
    comment: string,
    format: "properties", //Namespace格式可能取值为：properties、xml、json、yml、yaml
    isPublic: boolean, //是否为公共的Namespace
    items:// Namespace下所有的配置集合
    {
        key: string;
        value: string;
        dataChangeCreatedBy: string;
        dataChangeLastModifiedBy: string;
        dataChangeCreatedTime: string;
        dataChangeLastModifiedTime: string;
    }[];
    dataChangeCreatedBy: string;
    dataChangeLastModifiedBy: string;
    dataChangeCreatedTime: string;
    dataChangeLastModifiedTime: string;
};

export type NamespaceCreateResponse = {
    name: string;
    appId: string;
    format: string;
    isPublic: boolean;
    comment: string;
    dataChangeCreatedBy: string;
    dataChangeLastModifiedBy: string;
    dataChangeCreatedTime: string;
    dataChangeLastModifiedTime: string;
}

export type NamespaceLockResponse = {
    namespaceName: string;
    isLocked: boolean;
    lockedBy?: string; //锁owner
}
