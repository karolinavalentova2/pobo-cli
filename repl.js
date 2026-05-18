import readline from 'node:readline';
import chalk from 'chalk';
import Table from 'cli-table3';
import { PUBLIC_VERSION } from './constants.generated.js';
import { sprintf } from './utils/sprintf.js';
const BANNER_LINES = [
    '  ██████╗  ██████╗ ██████╗  ██████╗ ',
    '  ██╔══██╗██╔═══██╗██╔══██╗██╔═══██╗',
    '  ██████╔╝██║   ██║██████╔╝██║   ██║',
    '  ██╔═══╝ ██║   ██║██╔══██╗██║   ██║',
    '  ██║     ╚██████╔╝██████╔╝╚██████╔╝',
    '  ╚═╝      ╚═════╝ ╚═════╝  ╚═════╝ ',
];
const collectCommands = (cmd, prefix = '') => {
    const out = [];
    for (const sub of cmd.commands) {
        if (sub.name() === 'help')
            continue;
        const name = prefix ? sprintf('%s %s', prefix, sub.name()) : sub.name();
        out.push({ name, description: sub.description() });
        if (sub.commands.length > 0) {
            out.push(...collectCommands(sub, name));
        }
    }
    return out;
};
const completer = (program) => (line) => {
    const all = [
        ...collectCommands(program).map((c) => c.name),
        'help',
        'exit',
        'quit',
        'clear',
    ];
    const trimmed = line.trimStart();
    const hits = all.filter((c) => c.startsWith(trimmed));
    return [hits.length > 0 ? hits : all, trimmed];
};
const printBanner = () => {
    console.log('');
    for (const line of BANNER_LINES) {
        console.log(chalk.green(line));
    }
    console.log('');
    console.log(chalk.bold(sprintf('  Pobo Page Builder CLI · v%s', PUBLIC_VERSION)));
    console.log(chalk.gray('  Type "help" for commands, "exit" to quit. Tab to autocomplete.\n'));
};
const BUILTINS = [
    { name: 'help', description: 'Show this help (list of commands)' },
    { name: 'clear', description: 'Clear the screen and redraw the banner' },
    { name: 'exit', description: 'Exit the shell (alias: quit, or Ctrl+D)' },
];
const buildHelpTable = (rows) => {
    const table = new Table({
        head: [chalk.bold('Command'), chalk.bold('Description')],
        style: { head: [], border: ['gray'] },
        chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    });
    for (const row of rows) {
        table.push([chalk.green(row.name), chalk.gray(row.description)]);
    }
    return table;
};
const printHelp = (program) => {
    const cmds = collectCommands(program);
    console.log('');
    console.log(chalk.bold('  Commands'));
    console.log(buildHelpTable(cmds).toString());
    console.log('');
    console.log(chalk.bold('  Built-ins'));
    console.log(buildHelpTable(BUILTINS).toString());
    console.log(chalk.gray('\n  Tab autocompletes. Append --help to any command for its options.\n'));
};
const readLine = (buildProgram, history) => new Promise((resolve) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        completer: completer(buildProgram()),
        history,
        historySize: 200,
        removeHistoryDuplicates: true,
    });
    let resolved = false;
    const finish = (value) => {
        if (resolved)
            return;
        resolved = true;
        // Snapshot history before closing — readline exposes it on the interface.
        const current = rl.history;
        if (Array.isArray(current)) {
            history.length = 0;
            history.push(...current);
        }
        rl.close();
        resolve(value);
    };
    rl.on('close', () => finish({ input: '', closed: true }));
    rl.question(chalk.green('pobo> '), (answer) => finish({ input: answer, closed: false }));
});
export const startRepl = async (buildProgram) => {
    printBanner();
    const history = [];
    while (true) {
        const { input, closed } = await readLine(buildProgram, history);
        if (closed) {
            console.log(chalk.gray('\nBye.'));
            return;
        }
        const trimmed = input.trim();
        if (trimmed === '')
            continue;
        if (trimmed === 'exit' || trimmed === 'quit') {
            console.log(chalk.gray('Bye.'));
            return;
        }
        if (trimmed === 'help') {
            printHelp(buildProgram());
            continue;
        }
        if (trimmed === 'clear') {
            console.clear();
            printBanner();
            continue;
        }
        const args = trimmed.split(/\s+/);
        const program = buildProgram();
        program.exitOverride();
        try {
            await program.parseAsync(['node', 'pobo', ...args]);
        }
        catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            const isCommanderHelp = message.includes('outputHelp') || message.includes('(outputHelp)');
            const isCommanderVersion = message.includes('(version)');
            if (!isCommanderHelp && !isCommanderVersion) {
                console.error(chalk.red(sprintf('Error: %s', message)));
            }
        }
    }
};
