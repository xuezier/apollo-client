export interface IApolloRequestConfig {
    cluster_name?: string;
    namespace_name?: string;
    release_key?: string;
    ip?: string;
    notifications?: {
        namespaceName: string;
        notificationId: number;
    }[]
}
