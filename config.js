import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sprintf } from './utils/sprintf.js';
import { PUBLIC_DEFAULT_API_URL, PUBLIC_DEFAULT_FRONTEND_URL } from './constants.generated.js';
const DEFAULT_API_URL = process.env.POBO_DEFAULT_API_URL ?? PUBLIC_DEFAULT_API_URL;
const getConfigDir = () => path.join(os.homedir(), '.pobo');
const getConfigPath = () => path.join(getConfigDir(), 'config.json');
export const getApiUrl = (config) => {
    if (process.env.POBO_API_URL) {
        return process.env.POBO_API_URL;
    }
    if (config && config.api_url) {
        return config.api_url;
    }
    if (DEFAULT_API_URL) {
        return DEFAULT_API_URL;
    }
    throw new Error('No API URL configured. Set POBO_API_URL or POBO_DEFAULT_API_URL (e.g. in .env), or run `pobo auth login` to save api_url to ~/.pobo/config.json.');
};
export const getFrontendUrl = () => process.env.POBO_FRONTEND_URL ?? PUBLIC_DEFAULT_FRONTEND_URL;
export const readConfig = () => {
    const file = getConfigPath();
    if (!fs.existsSync(file)) {
        return { token: null, api_url: getApiUrl(null) };
    }
    try {
        const raw = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            token: parsed.token || null,
            api_url: parsed.api_url || getApiUrl(null),
        };
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.warn(sprintf('Warning: config %s is not valid JSON, using defaults (%s).', file, message));
        return { token: null, api_url: getApiUrl(null) };
    }
};
export const writeConfig = (config) => {
    const dir = getConfigDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    const file = getConfigPath();
    fs.writeFileSync(file, JSON.stringify(config, null, 2), { mode: 0o600 });
    try {
        fs.chmodSync(file, 0o600);
    }
    catch { }
};
export const clearConfig = () => {
    const file = getConfigPath();
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
};
export const requireToken = () => {
    const config = readConfig();
    if (!config.token) {
        throw new Error('Not authenticated. Run `pobo auth login`.');
    }
    return { token: config.token, api_url: config.api_url };
};
