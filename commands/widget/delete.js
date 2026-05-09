import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { api } from '../../api.js';
import { requireToken } from '../../config.js';
import { resolveOrPickServer } from '../../lib/widget-picker.js';
import { sprintf } from '../../utils/sprintf.js';
export const deleteCommand = async ({ id, yes }) => {
    const config = requireToken();
    const widget = await resolveOrPickServer(id, 'delete', config.token, config.api_url);
    const widgetId = widget.id;
    if (!yes) {
        const action = await select({
            message: sprintf('Really DELETE widget #%s (%s)? This removes it from the server permanently.', widgetId, widget.name),
            default: 'cancel',
            choices: [
                { name: 'No, cancel', value: 'cancel' },
                { name: 'Yes, delete the widget from the server', value: 'delete' },
            ],
        });
        if (action === 'cancel') {
            console.log(chalk.gray('Cancelled.'));
            return;
        }
    }
    await api.deleteWidget(config.token, widgetId, config.api_url);
    console.log(chalk.green(sprintf('✓ Widget #%s deleted on server.', widgetId)));
    console.log(chalk.gray(sprintf('  Local files in widgets/%s/ kept — remove manually if no longer needed.', widgetId)));
};
