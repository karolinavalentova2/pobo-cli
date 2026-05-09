import chalk from 'chalk';
import { api, ApiError } from '../../api.js';
import { requireToken } from '../../config.js';
import { readHtml } from '../../lib/widget-fs.js';
import { resolveOrPick } from '../../lib/widget-picker.js';
import { sprintf } from '../../utils/sprintf.js';
const depthOf = (item, byId) => {
    let depth = 0;
    let parentId = item.parent_id;
    while (parentId !== null) {
        const parent = byId.get(parentId);
        if (!parent)
            break;
        depth++;
        parentId = parent.parent_id;
    }
    return depth;
};
export const validateCommand = async ({ id }) => {
    const config = requireToken();
    const widget = await resolveOrPick(id, 'validate');
    const widgetId = widget.meta.id;
    const html = readHtml(widget);
    try {
        const parsed = await api.parseWidget(config.token, widgetId, html, config.api_url);
        const byId = new Map(parsed.widget.map((i) => [i.child_id, i]));
        console.log(chalk.green(sprintf('✓ HTML is valid. %s elements.', parsed.widget.length)));
        for (const item of parsed.widget) {
            const indent = '  '.repeat(depthOf(item, byId));
            const cls = typeof item.cssClass === 'string' && item.cssClass
                ? chalk.gray(sprintf('.%s', item.cssClass))
                : '';
            console.log(sprintf('%s%s %s', indent, chalk.cyan(item.tag), cls));
        }
    }
    catch (e) {
        if (e instanceof ApiError && e.data && typeof e.data === 'object') {
            const errors = e.data.errors;
            if (Array.isArray(errors)) {
                console.log(chalk.red('✗ HTML contains errors:'));
                for (const error of errors) {
                    console.log(sprintf('  %s %s', chalk.red('•'), String(error)));
                }
                process.exit(1);
                return;
            }
        }
        throw e;
    }
};
