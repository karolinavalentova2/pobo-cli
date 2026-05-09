import chalk from 'chalk';
import Table from 'cli-table3';
import { api } from '../../api.js';
import { requireToken } from '../../config.js';
import { stripProtocol } from '../../lib/eshop-display.js';
import { sprintf } from '../../utils/sprintf.js';
export const connectionsCommand = async () => {
    const config = requireToken();
    const result = await api.listAllWidgetConnections(config.token, config.api_url);
    const widgets = result.data ?? [];
    if (widgets.length === 0) {
        console.log(chalk.gray('No widgets on the server.'));
        return;
    }
    const table = new Table({
        head: [chalk.bold('ID'), chalk.bold('Widget'), chalk.bold('Connected to')],
        style: { head: [], border: ['gray'] },
        colAligns: ['right', 'left', 'left'],
    });
    let totalConnections = 0;
    for (const w of widgets) {
        const eshops = w.eshop ?? [];
        totalConnections += eshops.length;
        const cell = eshops.length > 0
            ? eshops.map((e) => stripProtocol(e.url)).join('\n')
            : chalk.gray('—');
        table.push([
            chalk.bold(sprintf('#%s', w.id)),
            w.name,
            cell,
        ]);
    }
    console.log('');
    console.log(table.toString());
    console.log(chalk.gray(sprintf('%s widget(s), %s connection(s) total.', widgets.length, totalConnections)));
};
