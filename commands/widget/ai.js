import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import ora from 'ora';
import { api } from '../../api.js';
import { requireToken } from '../../config.js';
import { isPlaceholderScaffold, writeWidgetFiles } from '../../lib/widget-fs.js';
import { resolveOrPick } from '../../lib/widget-picker.js';
import { sprintf } from '../../utils/sprintf.js';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const detectMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.webp':
            return 'image/webp';
        default:
            throw new Error(sprintf('Unsupported image extension: %s. Must be .png, .jpg, .jpeg, or .webp.', ext || '(none)'));
    }
};
const validateImageFile = (imagePath) => {
    const absolutePath = path.resolve(process.cwd(), imagePath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(sprintf('Image file not found: %s', imagePath));
    }
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
        throw new Error(sprintf('Image path is not a file: %s', imagePath));
    }
    if (stat.size === 0) {
        throw new Error(sprintf('Image file is empty: %s', imagePath));
    }
    if (stat.size > MAX_IMAGE_BYTES) {
        throw new Error(sprintf('Image file too large: %s MB (max %s MB).', (stat.size / 1024 / 1024).toFixed(2), (MAX_IMAGE_BYTES / 1024 / 1024).toFixed(0)));
    }
    const mimeType = detectMimeType(absolutePath);
    return { absolutePath, mimeType };
};
export const aiCommand = async ({ id, image, force }) => {
    const config = requireToken();
    const widget = await resolveOrPick(id, 'generate via AI');
    const widgetId = widget.meta.id;
    const { absolutePath, mimeType } = validateImageFile(image);
    if (!isPlaceholderScaffold(widget) && !force) {
        if (!process.stdout.isTTY) {
            throw new Error(sprintf('Widget #%s has non-placeholder content. Re-run with --force to overwrite without confirmation.', widgetId));
        }
        const proceed = await select({
            message: sprintf('Widget #%s has non-placeholder content. Overwrite with AI-generated HTML/SCSS?', widgetId),
            default: 'cancel',
            choices: [
                { name: 'No, cancel', value: 'cancel' },
                { name: 'Yes, overwrite with AI output', value: 'overwrite' },
            ],
        });
        if (proceed === 'cancel') {
            console.log(chalk.gray('Cancelled. No files were changed.'));
            return;
        }
    }
    console.log(chalk.gray(sprintf('Widget #%s (%s)', widgetId, widget.meta.name)));
    const buffer = await fs.promises.readFile(absolutePath);
    const blob = new Blob([buffer], { type: mimeType });
    const spinner = ora('Generating widget via Claude (this typically takes 15-25s)...').start();
    let result;
    try {
        result = await api.generateWidgetAi(config.token, widgetId, { blob, filename: path.basename(absolutePath) }, config.api_url);
        spinner.succeed('Widget generated');
    }
    catch (e) {
        spinner.fail('Generation failed');
        throw e;
    }
    writeWidgetFiles(widget, { html: result.html, scss: result.scss });
    console.log(chalk.green(sprintf('\n✓ Widget #%s generated and written to local scaffold.', widgetId)));
    console.log(chalk.gray(sprintf('  Model: %s · tokens: %s in (%s cached read, %s cached write) / %s out · duration: %ss', result.ai.model, result.ai.tokens_in, result.ai.tokens_cached_read, result.ai.tokens_cached_write, result.ai.tokens_out, (result.ai.duration_ms / 1000).toFixed(1))));
    console.log(chalk.gray(sprintf('Next: pobo widget validate %s', widgetId)));
};
