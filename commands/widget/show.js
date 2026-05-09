import chalk from 'chalk';
import { api } from '../../api.js';
import { requireToken } from '../../config.js';
import { resolveOrPickServer } from '../../lib/widget-picker.js';
import { sprintf } from '../../utils/sprintf.js';
export const showCommand = async ({ id }) => {
    const config = requireToken();
    const widget = await resolveOrPickServer(id, 'show', config.token, config.api_url);
    const widgetId = widget.id;
    const detail = await api.showWidget(config.token, widgetId, config.api_url);
    console.log(chalk.bold(sprintf('Widget #%s', widgetId)));
    console.log(JSON.stringify(detail, null, 2));
};
