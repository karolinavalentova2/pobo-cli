import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { api } from '../../api.js';
import { requireToken } from '../../config.js';
import { buildEshopChoices, stripProtocol } from '../../lib/eshop-display.js';
import { resolveOrPickServer } from '../../lib/widget-picker.js';
import { sprintf } from '../../utils/sprintf.js';
export const disconnectCommand = async ({ id, yes }) => {
    const config = requireToken();
    const widget = await resolveOrPickServer(id, 'disconnect', config.token, config.api_url);
    const widgetId = widget.id;
    const result = await api.listWidgetConnections(config.token, widgetId, config.api_url);
    const connectedEshops = result.data ?? [];
    if (connectedEshops.length === 0) {
        console.log(chalk.gray(sprintf('Widget #%s is not connected to any eshop.', widgetId)));
        return;
    }
    let eshopId;
    let eshopUrl;
    if (connectedEshops.length === 1) {
        const only = connectedEshops[0];
        eshopId = only.id;
        eshopUrl = only.url;
    }
    else {
        eshopId = await select({
            message: sprintf('Disconnect widget #%s from which eshop?', widgetId),
            choices: buildEshopChoices(connectedEshops),
            pageSize: 20,
        });
        eshopUrl = connectedEshops.find((e) => e.id === eshopId)?.url ?? '';
    }
    if (!yes) {
        const action = await select({
            message: sprintf('Disconnect widget #%s (%s) from %s?', widgetId, widget.name, stripProtocol(eshopUrl)),
            default: 'cancel',
            choices: [
                { name: 'No, cancel', value: 'cancel' },
                { name: sprintf('Yes, disconnect from %s', stripProtocol(eshopUrl)), value: 'disconnect' },
            ],
        });
        if (action === 'cancel') {
            console.log(chalk.gray('Cancelled.'));
            return;
        }
    }
    await api.disconnectWidget(config.token, widgetId, eshopId, config.api_url);
    console.log(chalk.green(sprintf('✓ Widget #%s disconnected from %s (#%s).', widgetId, stripProtocol(eshopUrl), eshopId)));
};
