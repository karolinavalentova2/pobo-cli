import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { api } from '../../api.js';
import { requireToken } from '../../config.js';
import { resolveOrPick } from '../../lib/widget-picker.js';
import { sprintf } from '../../utils/sprintf.js';
export const flushCommand = async ({ id, yes }) => {
    const config = requireToken();
    const widget = await resolveOrPick(id, 'flush');
    const widgetId = widget.meta.id;
    if (!yes) {
        const action = await select({
            message: sprintf('Really delete all elements of widget #%s (%s)?', widgetId, widget.meta.name),
            default: 'cancel',
            choices: [
                { name: 'No, cancel', value: 'cancel' },
                { name: 'Yes, delete all elements of this widget', value: 'flush' },
            ],
        });
        if (action === 'cancel') {
            console.log(chalk.gray('Cancelled.'));
            return;
        }
    }
    await api.flushWidget(config.token, widgetId, config.api_url);
    console.log(chalk.green(sprintf('✓ Elements of widget #%s deleted.', widgetId)));
};
