import chalk from 'chalk';
import Table from 'cli-table3';
import { api } from '../../api.js';
import { requireToken } from '../../config.js';
import { inferPlatform, platformOrderIndex, stripProtocol } from '../../lib/eshop-display.js';
import { sprintf } from '../../utils/sprintf.js';
export const meCommand = async () => {
    const config = requireToken();
    const me = await api.me(config.token, config.api_url);
    const userTable = new Table({
        style: { border: ['gray'] },
    });
    userTable.push([chalk.bold('Email'), me.email], [chalk.bold('Name'), me.name], [chalk.bold('API'), config.api_url]);
    console.log(chalk.bold('Logged in as:'));
    console.log(userTable.toString());
    if (!me.eshop || me.eshop.length === 0) {
        console.log(chalk.gray('\nNo eshops assigned to your account.'));
        return;
    }
    const sorted = [...me.eshop].sort((a, b) => {
        const pa = inferPlatform(a.url);
        const pb = inferPlatform(b.url);
        const orderDiff = platformOrderIndex(pa) - platformOrderIndex(pb);
        if (orderDiff !== 0)
            return orderDiff;
        return a.url.localeCompare(b.url);
    });
    const eshopsTable = new Table({
        head: [chalk.bold('ID'), chalk.bold('Platform'), chalk.bold('URL')],
        style: { head: [], border: ['gray'] },
        colAligns: ['right', 'left', 'left'],
    });
    for (const eshop of sorted) {
        eshopsTable.push([
            chalk.bold(sprintf('#%s', eshop.id)),
            inferPlatform(eshop.url),
            stripProtocol(eshop.url),
        ]);
    }
    console.log(chalk.bold(sprintf('\nAvailable eshops (%s):', sorted.length)));
    console.log(eshopsTable.toString());
};
