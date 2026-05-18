import path from 'node:path';
import chalk from 'chalk';
import { input, select } from '@inquirer/prompts';
import { api } from '../../api.js';
import { requireToken } from '../../config.js';
import { createWidgetScaffold } from '../../lib/widget-fs.js';
import { sprintf } from '../../utils/sprintf.js';
export const validateWidgetName = (value) => value && value.trim().length > 0 ? true : 'Name must not be empty';
export const createCommand = async () => {
    const config = requireToken();
    const name = await input({ message: 'Widget name:', validate: validateWidgetName });
    const enableTypographyCss = await select({
        message: 'Enable global typography (enable_typography_css)?',
        default: true,
        choices: [
            { name: 'Yes, enable global typography', value: true },
            { name: 'No, disable it', value: false },
        ],
    });
    console.log(chalk.gray('Creating widget on API...'));
    const widget = await api.createWidget(config.token, {
        name: name.trim(),
        enableTypographyCss,
    }, config.api_url);
    const scaffold = createWidgetScaffold({
        id: widget.id,
        name: widget.name,
        rootClass: widget.root_class,
    });
    const cwd = process.cwd();
    const rel = (abs) => {
        const r = path.relative(cwd, abs) || abs;
        return r.split(path.sep).join('/');
    };
    console.log(chalk.green(sprintf('✓ Widget created (ID %s, class %s).', widget.id, widget.root_class)));
    console.log(chalk.gray('Local files:'));
    console.log(sprintf('  %s', rel(scaffold.htmlFile)));
    console.log(sprintf('  %s', rel(scaffold.scssFile)));
    console.log(sprintf('  %s', rel(scaffold.cssPreviewFile)));
    console.log(sprintf('  %s', rel(scaffold.metaFile)));
};
