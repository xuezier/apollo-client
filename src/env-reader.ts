import * as fs from 'fs';
import { Logger } from './lib/logger';

export interface EnvReaderOptions {
    env_file_type: string;
    logger: Logger
}

export class EnvReader {
    private _logger: Logger;
    private _env_file_type: string = 'properties';

    constructor(options: EnvReaderOptions) {
        for(const key in options) {
            this['_' + key] = options[key];
        }
    }

    get logger() {
        return this._logger;
    }

    get env_file_type() {
        return this._env_file_type;
    }

    readEnvFromFile(path: string) {
        switch(this.env_file_type) {
            case 'properties':
                return this._readFromProperties(path);
            default:
                return {};
        }
    }

    private _readFromProperties(envPath: string) {
        try {
            const data = fs.readFileSync(envPath, 'utf-8');
            const configs = data.split('\n');
            const result: {[x: string]: {
                [y: string]: string
            }} = {}
            for (const config of configs) {
                if (config.trim()) {
                    const splitIndex = config.indexOf('=');
                    const key = config.substr(0, splitIndex);
                    const value = config.substr(splitIndex+1);
                    // const [ key, value ] = config.split('=');

                    if (key.trim() === 'release_key') {
                        continue;
                    }

                    const [namespace, configKey] = key.split('.');
                    const namespaceKey = namespace.trim();
                    if(!result[namespaceKey]) {
                        result[namespaceKey] = {};
                    }

                    result[namespaceKey][configKey.trim()] = value.trim();
                }
            }

            return result;
        } catch (err) {
            this.logger.warn(`[egg-apollo-client] read env_file: ${envPath} error when apollo start`);
        }
    }
}
