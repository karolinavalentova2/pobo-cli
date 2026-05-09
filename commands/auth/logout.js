import chalk from 'chalk';
import { api } from '../../api.js';
import { clearConfig, readConfig } from '../../config.js';
export const logoutCommand = async () => {
    const config = readConfig();
    if (!config.token) {
        console.log(chalk.yellow('Not authenticated.'));
        return;
    }
    try {
        await api.logout(config.token, config.api_url);
    }
    catch { }
    clearConfig();
    console.log(chalk.green('Signed out.'));
};
