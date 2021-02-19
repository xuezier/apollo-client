export interface IApolloConfig {
    config_server_url: string;
    app_id: string;
    token?: string;
    cluster_name?: string;
    namespace_name?: string;
    release_key?: string;
    ip?: string;
    watch?: boolean;
    set_env_file?: boolean;
    env_file_path?: string;
    env_file_type?: string;
    init_on_start?: boolean;
    timeout?: number;
}