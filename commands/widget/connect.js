import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { api } from '../../api.js';
import { requireToken } from '../../config.js';
import { buildEshopChoices } from '../../lib/eshop-display.js';
import { resolveOrPickServer } from '../../lib/widget-picker.js';
import { sprintf } from '../../utils/sprintf.js';
export const connectCommand = async ({ id }) => {
    const config = requireToken();
    const widget = await resolveOrPickServer(id, 'connect', config.token, config.api_url);
    const widgetId = widget.id;
    const result = await api.listEshops(config.token, config.api_url);
    const eshops = result.data || [];
    if (eshops.length === 0) {
        throw new Error('No eshops are assigned to your account.');
    }
    const eshopId = await select({
        message: sprintf('Which eshop to connect widget #%s to?', widgetId),
        choices: buildEshopChoices(eshops),
        pageSize: 20,
    });
    await api.connectWidget(config.token, widgetId, eshopId, config.api_url);
    console.log(chalk.green(sprintf('✓ Widget #%s connected to eshop #%s.', widgetId, eshopId)));
};
