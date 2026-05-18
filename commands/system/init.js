import path from 'node:path';
import chalk from 'chalk';
import { installClaudeContext } from '../../lib/claude-context-installer.js';
import { sprintf } from '../../utils/sprintf.js';
export const initCommand = async () => {
    const cwd = process.cwd();
    const rel = (abs) => path.relative(cwd, abs) || abs;
    const result = installClaudeContext(cwd);
    if (result.installed) {
        console.log(chalk.green(sprintf('✓ Wrote %s', rel(result.path))));
        console.log(chalk.gray('Open this directory in Claude Code and try: "Create a widget from this design."'));
    }
    else {
        console.log(chalk.yellow(sprintf('CLAUDE.md already exists at %s — not overwriting.', rel(result.path))));
        console.log(chalk.gray('Delete it first if you want to regenerate from the latest template.'));
    }
};
