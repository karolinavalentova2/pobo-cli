import chalk from 'chalk';
import { input, password } from '@inquirer/prompts';
import { api } from '../../api.js';
import { getApiUrl, readConfig, writeConfig } from '../../config.js';
import { sprintf } from '../../utils/sprintf.js';
export const validateEmail = (value) => value && value.includes('@') ? true : 'Enter a valid email';
export const validatePassword = (value) => value ? true : 'Password must not be empty';
export const loginCommand = async () => {
    const existing = readConfig();
    const apiUrl = getApiUrl(existing);
    console.log(chalk.gray(sprintf('API: %s', apiUrl)));
    const email = await input({ message: 'Email:', validate: validateEmail });
    const pw = await password({ message: 'Password:', mask: '*', validate: validatePassword });
    const result = await api.login(email, pw, apiUrl);
    writeConfig({
        token: result.cli_token,
        api_url: apiUrl,
    });
    console.log(chalk.green(sprintf('Signed in as %s', result.email)));
};
