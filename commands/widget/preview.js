import chalk from 'chalk';
import open from 'open';
import { getFrontendUrl, requireToken } from '../../config.js';
import { resolveOrPickServer } from '../../lib/widget-picker.js';
import { sprintf } from '../../utils/sprintf.js';
export const previewCommand = async ({ id, open: shouldOpen }) => {
    const config = requireToken();
    const widget = await resolveOrPickServer(id, 'preview', config.token, config.api_url);
    const previewUrl = sprintf('%s/cli/widget/preview/%s', getFrontendUrl(), widget.id);
    console.log(chalk.gray(sprintf('Widget #%s (%s)', widget.id, widget.name)));
    console.log(chalk.gray(sprintf('Preview URL: %s', previewUrl)));
    if (!shouldOpen) {
        return;
    }
    try {
        await open(previewUrl);
        console.log(chalk.green('✓ Opened in browser'));
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.log(chalk.yellow(sprintf('Could not auto-open browser: %s', message)));
        console.log(chalk.gray('Open the URL above manually, or rerun with --no-open to skip.'));
    }
};
