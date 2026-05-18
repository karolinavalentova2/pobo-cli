import chalk from 'chalk';
import { checkbox, select } from '@inquirer/prompts';
import { ApiError, api } from '../../api.js';
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
    let targets;
    if (connectedEshops.length === 1) {
        targets = [connectedEshops[0]];
    }
    else {
        const ids = await checkbox({
            message: sprintf('Disconnect widget #%s from which eshop(s)?', widgetId),
            choices: buildEshopChoices(connectedEshops),
            required: true,
            pageSize: 20,
        });
        const byId = new Map(connectedEshops.map((e) => [e.id, e]));
        targets = ids.map((eshopId) => byId.get(eshopId)).filter((e) => e !== undefined);
    }
    if (!yes) {
        const summary = targets.length === 1
            ? sprintf('%s (#%s)', stripProtocol(targets[0].url), targets[0].id)
            : sprintf('%s eshop(s)', targets.length);
        const action = await select({
            message: sprintf('Disconnect widget #%s (%s) from %s?', widgetId, widget.name, summary),
            default: 'cancel',
            choices: [
                { name: 'No, cancel', value: 'cancel' },
                { name: sprintf('Yes, disconnect from %s', summary), value: 'disconnect' },
            ],
        });
        if (action === 'cancel') {
            console.log(chalk.gray('Cancelled.'));
            return;
        }
    }
    const successes = [];
    const failures = [];
    for (const eshop of targets) {
        try {
            await api.disconnectWidget(config.token, widgetId, eshop.id, config.api_url);
            successes.push(eshop);
        }
        catch (e) {
            const reason = e instanceof ApiError || e instanceof Error ? e.message : String(e);
            failures.push({ eshop, reason });
        }
    }
    console.log('');
    for (const eshop of successes) {
        console.log(chalk.green(sprintf('  ✓ %s  %s', stripProtocol(eshop.url), chalk.gray(sprintf('#%s', eshop.id)))));
    }
    for (const { eshop, reason } of failures) {
        console.log(chalk.red(sprintf('  ✗ %s  %s  %s', stripProtocol(eshop.url), chalk.gray(sprintf('#%s', eshop.id)), chalk.gray(reason))));
    }
    if (failures.length === 0) {
        console.log(chalk.green(sprintf('\nWidget #%s disconnected from %s eshop(s).', widgetId, successes.length)));
        return;
    }
    if (successes.length === 0) {
        throw new Error(sprintf('All %s disconnect(s) failed for widget #%s.', failures.length, widgetId));
    }
    console.log(chalk.yellow(sprintf('\nWidget #%s: %s disconnected, %s failed.', widgetId, successes.length, failures.length)));
};
