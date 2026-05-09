#!/usr/bin/env node
import 'dotenv/config';
import { run } from '../cli.js';
run(process.argv).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
});
