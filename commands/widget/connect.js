import chalk from 'chalk';
import { checkbox } from '@inquirer/prompts';
import { ApiError, api } from '../../api.js';
import { requireToken } from '../../config.js';
import { buildEshopChoices, stripProtocol } from '../../lib/eshop-display.js';
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
    const eshopIds = await checkbox({
        message: sprintf('Which eshop(s) to connect widget #%s to?', widgetId),
        choices: buildEshopChoices(eshops),
        required: true,
        pageSize: 20,
    });
    const byId = new Map(eshops.map((e) => [e.id, e]));
    const successes = [];
    const failures = [];
    for (const eshopId of eshopIds) {
        const eshop = byId.get(eshopId);
        if (!eshop)
            continue;
        try {
            await api.connectWidget(config.token, widgetId, eshopId, config.api_url);
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
        console.log(chalk.green(sprintf('\nWidget #%s connected to %s eshop(s).', widgetId, successes.length)));
        return;
    }
    if (successes.length === 0) {
        throw new Error(sprintf('All %s connection(s) failed for widget #%s.', failures.length, widgetId));
    }
    console.log(chalk.yellow(sprintf('\nWidget #%s: %s connected, %s failed.', widgetId, successes.length, failures.length)));
};
