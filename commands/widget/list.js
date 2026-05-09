import chalk from 'chalk';
import Table from 'cli-table3';
import { api } from '../../api.js';
import { requireToken } from '../../config.js';
import { sprintf } from '../../utils/sprintf.js';
export const listCommand = async () => {
    const config = requireToken();
    const result = await api.listWidgets(config.token, config.api_url);
    const widgets = result.data || [];
    if (widgets.length === 0) {
        console.log(chalk.gray('No widgets.'));
        return;
    }
    const table = new Table({
        head: [chalk.bold('ID'), chalk.bold('Name'), chalk.bold('Root class'), chalk.bold('Comp.')],
        style: { head: [], border: ['gray'] },
        colAligns: ['right', 'left', 'left', 'center'],
    });
    for (const widget of widgets) {
        table.push([
            chalk.bold(sprintf('#%s', widget.id)),
            widget.name,
            chalk.gray(widget.root_class),
            widget.has_component ? chalk.green('●') : chalk.gray('○'),
        ]);
    }
    console.log(table.toString());
};
