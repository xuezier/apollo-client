export type ReleaseInfo = {
    appId:string;
    clusterName:string;
    namespaceName:string;
    name:string;
    configurations: {
        [x: string]: string;
    };
    comment: string;
    dataChangeCreatedBy: string;
    dataChangeLastModifiedBy: string;
    dataChangeCreatedTime: string;
    dataChangeLastModifiedTime: string;
}