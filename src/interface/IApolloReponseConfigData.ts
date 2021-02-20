export interface IApolloReponseConfigData {
    // '{"appId":"ums-local","cluster":"default","namespaceName":"application","configurations":{"NODE_ENV":"production"}
    appId: string;
    cluster: string;
    namespaceName: string;
    configurations: {
        [x: string]: string;
    };
    releaseKey: string;
}
