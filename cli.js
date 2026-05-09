import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { PUBLIC_VERSION } from './constants.generated.js';
import { loginCommand } from './commands/auth/login.js';
import { logoutCommand } from './commands/auth/logout.js';
import { meCommand } from './commands/auth/me.js';
import { createCommand } from './commands/widget/create.js';
import { deleteCommand } from './commands/widget/delete.js';
import { pushCommand } from './commands/widget/push.js';
import { validateCommand } from './commands/widget/validate.js';
import { connectCommand } from './commands/widget/connect.js';
import { connectionsCommand } from './commands/widget/connections.js';
import { disconnectCommand } from './commands/widget/disconnect.js';
import { flushCommand } from './commands/widget/flush.js';
import { proxyCommand } from './commands/widget/proxy.js';
import { listCommand } from './commands/widget/list.js';
import { showCommand } from './commands/widget/show.js';
import { doctorCommand } from './commands/system/doctor.js';
import { sprintf } from './utils/sprintf.js';
const wrap = (fn) => {
    return async (...args) => {
        try {
            await fn(...args);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(chalk.red(sprintf('Error: %s', message)));
            process.exit(1);
        }
    };
};
const collectSubcommands = (cmd, indent = 0) => {
    const rows = [];
    for (const sub of cmd.commands) {
        if (sub.name() === 'help')
            continue;
        const pad = '  '.repeat(indent);
        const usage = sub.usage();
        const term = usage && usage !== '[options]'
            ? sprintf('%s %s', sub.name(), usage)
            : sub.name();
        rows.push({ command: pad + term, description: sub.description() });
        if (sub.commands.length > 0) {
            rows.push(...collectSubcommands(sub, indent + 1));
        }
    }
    return rows;
};
export const run = async (argv) => {
    const program = new Command();
    program
        .name('pobo')
        .description('Pobo Page Builder CLI')
        .version(PUBLIC_VERSION);
    const auth = program.command('auth').description('Authentication');
    auth.command('login').description('Sign in with email and password').action(wrap(loginCommand));
    auth.command('logout').description('Sign out').action(wrap(logoutCommand));
    auth.command('me').description('Show current user info and available eshops').action(wrap(meCommand));
    const widget = program.command('widget').description('Widget management');
    widget.command('list').description('List your widgets').action(wrap(listCommand));
    widget.command('create').description('Create a new widget').action(wrap(createCommand));
    widget
        .command('show [id]')
        .description('Show widget details from server')
        .action(wrap((id) => showCommand({ id })));
    widget
        .command('push [id]')
        .description('Push widget to server (HTML + compiled CSS)')
        .option('-y, --yes', 'skip post-push follow-up prompt')
        .action(wrap((id, options) => pushCommand({ id, yes: options.yes })));
    widget
        .command('validate [id]')
        .description('Validate widget HTML')
        .action(wrap((id) => validateCommand({ id })));
    widget
        .command('connect [id]')
        .description('Connect widget to an e-shop')
        .action(wrap((id) => connectCommand({ id })));
    widget
        .command('disconnect [id]')
        .description('Disconnect widget from an e-shop')
        .option('-y, --yes', 'skip confirmation prompt')
        .action(wrap((id, options) => disconnectCommand({ id, yes: options.yes })));
    widget
        .command('connections')
        .description('Show widget × eshop connections matrix (all widgets in one call)')
        .action(wrap(connectionsCommand));
    widget
        .command('flush [id]')
        .description('Delete widget elements')
        .option('-y, --yes', 'skip confirmation prompt')
        .action(wrap((id, options) => flushCommand({ id, yes: options.yes })));
    widget
        .command('delete [id]')
        .description('Delete widget from server (cannot be undone)')
        .option('-y, --yes', 'skip confirmation prompt')
        .action(wrap((id, options) => deleteCommand({ id, yes: options.yes })));
    widget
        .command('proxy [url]')
        .description('Live preview widget on an e-shop page (wizard if no URL)')
        .option('-p, --port <port>', 'Preview server port', '3001')
        .option('-s, --selector <selector>', 'CSS selector for widget injection target', '.basic-description')
        .action(wrap((url, options) => proxyCommand({
        url,
        port: parseInt(options.port, 10),
        selector: options.selector,
    })));
    program
        .command('doctor')
        .description('Health check: environment, config, connectivity, local widgets')
        .action(wrap(doctorCommand));
    program.addHelpText('after', () => {
        const rows = collectSubcommands(program);
        if (rows.length === 0)
            return '';
        const table = new Table({
            head: [chalk.bold('Command'), chalk.bold('Description')],
            style: { head: [], border: ['gray'] },
            chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
        });
        for (const r of rows) {
            table.push([r.command, r.description]);
        }
        return sprintf('\nAll commands (recursive):\n%s\n', table.toString());
    });
    await program.parseAsync(argv);
};
