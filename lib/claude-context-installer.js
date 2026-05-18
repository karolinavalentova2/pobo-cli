import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sprintf } from '../utils/sprintf.js';
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const CLAUDE_MD_PROMPT = 'widget-claude-md.md';
const findContextSource = () => {
    for (let depth = 1; depth <= 4; depth++) {
        const candidate = path.join(MODULE_DIR, ...Array(depth).fill('..'), 'prompts', CLAUDE_MD_PROMPT);
        if (fs.existsSync(candidate))
            return candidate;
    }
    throw new Error(sprintf('Cannot find prompts/%s. Reinstall with `npm install -g @pobo/cli`.', CLAUDE_MD_PROMPT));
};
export const installClaudeContext = (targetDir) => {
    const target = path.join(targetDir, 'CLAUDE.md');
    if (fs.existsSync(target)) {
        return { installed: false, reason: 'exists', path: target };
    }
    const source = findContextSource();
    const content = fs.readFileSync(source, 'utf-8');
    fs.writeFileSync(target, content);
    return { installed: true, path: target };
};
