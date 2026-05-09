import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { input } from '@inquirer/prompts';
import { compileScss } from '../../lib/scss-compiler.js';
import { resolveOrPick } from '../../lib/widget-picker.js';
import { sprintf } from '../../utils/sprintf.js';
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 15_000;
const PORT_SEARCH_RANGE = 20;
const isPortFree = (port) => new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
        tester.close(() => resolve(true));
    });
    tester.listen(port);
});
const findFreePort = async (start) => {
    for (let p = start; p < start + PORT_SEARCH_RANGE; p++) {
        if (await isPortFree(p))
            return p;
    }
    throw new Error(sprintf('No free port found in range %s-%s. Stop the other process or pass a different --port.', start, start + PORT_SEARCH_RANGE - 1));
};
const safeCompile = (scssFile) => {
    try {
        return compileScss(scssFile);
    }
    catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(chalk.red(sprintf('SCSS error: %s', message)));
        return '';
    }
};
const wrapWidgetHtml = (rawHtml) => {
    const match = rawHtml.match(/class="[^"]*\b(rc|pb)-([a-z0-9]+(?:-[a-z0-9]+)*)\b/);
    const widgetName = match && match[2] ? match[2] : 'preview';
    return `<div id="pobo-all-content" data-pobo-content="product" data-pobo-design-id="default" data-pobo-page-id="0" data-pobo-lang="default" data-pobo-version="2.0"><div id="pobo-inner-content"><div id="pobo-standard-widget"><div data-pobo-widget-id="1" data-pobo-unique-id="1000" class="widget-container widget-${widgetName} pobo-reveal"><div class="widget-typography">${rawHtml}</div></div></div></div></div>`;
};
const buildState = (htmlFile, css) => {
    const html = fs.existsSync(htmlFile) ? fs.readFileSync(htmlFile, 'utf8') : '';
    return {
        html: wrapWidgetHtml(html),
        css,
    };
};
const pushUpdate = (clients, state) => {
    const payload = sprintf('data: %s\n\n', JSON.stringify(state));
    for (const client of clients) {
        client.write(payload);
    }
    console.log(chalk.gray(sprintf('[%s] Update → %s client(s)', new Date().toLocaleTimeString(), clients.size)));
};
const fetchPage = (url, redirects = 0) => {
    if (redirects > MAX_REDIRECTS) {
        return Promise.reject(new Error(sprintf('Redirect limit exceeded (%s).', MAX_REDIRECTS)));
    }
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 Pobo-CLI' } }, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let loc = res.headers.location;
                if (loc.startsWith('/')) {
                    const u = new URL(url);
                    loc = sprintf('%s%s', u.origin, loc);
                }
                fetchPage(loc, redirects + 1).then(resolve, reject);
                return;
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            res.on('error', reject);
        });
        req.setTimeout(FETCH_TIMEOUT_MS, () => {
            req.destroy(new Error(sprintf('Timeout %ss while fetching %s.', FETCH_TIMEOUT_MS / 1000, url)));
        });
        req.on('error', reject);
    });
};
const liveReloadScript = (port, selector) => {
    const safeSelector = JSON.stringify(selector);
    return `
<script>
(function() {
    function init() {
        var source = new EventSource('http://localhost:${port}/events');
        source.onopen = function() { console.log('[Pobo Preview] Connected'); };
        source.onmessage = function(event) {
            var data = JSON.parse(event.data);
            var target = document.querySelector(${safeSelector});
            if (target && data.html) {
                target.innerHTML = data.html;
            }
            if (data.css !== undefined) {
                var style = document.getElementById('pobo-dev-preview');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'pobo-dev-preview';
                    document.head.appendChild(style);
                }
                style.textContent = data.css;
            }
        };
        source.onerror = function() { console.log('[Pobo Preview] Connection lost'); };
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
</script>`;
};
const injectIntoPage = (pageHtml, parsedUrl, port, selector) => {
    const baseTag = `<base href="${parsedUrl.origin}${parsedUrl.pathname}">`;
    let modified = pageHtml.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
    modified = modified.replace('</body>', `${liveReloadScript(port, selector)}</body>`);
    return modified;
};
export const proxyCommand = async ({ url, port, selector }) => {
    let resolvedUrl = url;
    let resolvedSelector = selector ?? '.basic-description';
    if (!resolvedUrl) {
        resolvedUrl = await input({
            message: 'E-shop URL:',
            validate: (v) => v && v.startsWith('http') ? true : 'URL must start with http:// or https://',
        });
        resolvedSelector = await input({
            message: 'Target CSS selector:',
            default: resolvedSelector,
        });
    }
    if (!resolvedUrl.startsWith('http')) {
        throw new Error('Enter a valid eshop URL (http:// or https://).');
    }
    const widget = await resolveOrPick(undefined, 'preview');
    const htmlFile = path.join(widget.dir, widget.meta.html);
    const scssFile = path.join(widget.dir, widget.meta.scss);
    const parsedUrl = new URL(resolvedUrl);
    const clients = new Set();
    const actualPort = await findFreePort(port);
    if (actualPort !== port) {
        console.log(chalk.yellow(sprintf('Port %s is busy — using %s instead.', port, actualPort)));
    }
    console.log(chalk.gray(sprintf('Widget: #%s %s', widget.meta.id, widget.meta.name)));
    console.log(chalk.gray(sprintf('URL: %s', resolvedUrl)));
    console.log(chalk.gray(sprintf('Selector: %s', resolvedSelector)));
    let currentCss = safeCompile(scssFile);
    const server = http.createServer(async (req, res) => {
        if (req.url === '/events') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            });
            clients.add(res);
            res.write(sprintf('data: %s\n\n', JSON.stringify(buildState(htmlFile, currentCss))));
            req.on('close', () => clients.delete(res));
            return;
        }
        if (req.url === '/' || req.url === parsedUrl.pathname) {
            try {
                const pageHtml = await fetchPage(resolvedUrl);
                const injected = injectIntoPage(pageHtml, parsedUrl, actualPort, resolvedSelector);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(injected);
            }
            catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(sprintf('Failed to fetch page: %s', message));
            }
            return;
        }
        res.writeHead(302, { 'Location': sprintf('%s%s', parsedUrl.origin, req.url) });
        res.end();
    });
    const watcher = chokidar.watch([htmlFile, scssFile], {
        ignoreInitial: true,
    });
    let debounce = null;
    watcher.on('all', (_event, filePath) => {
        if (debounce)
            clearTimeout(debounce);
        debounce = setTimeout(() => {
            if (filePath.endsWith('.scss')) {
                currentCss = safeCompile(scssFile);
            }
            pushUpdate(clients, buildState(htmlFile, currentCss));
        }, 100);
    });
    server.listen(actualPort, () => {
        console.log('');
        console.log(chalk.green('  ✓ Pobo Preview Server running'));
        console.log(chalk.gray(sprintf('    http://localhost:%s', actualPort)));
        console.log('');
        console.log(chalk.gray('  Edit:'));
        console.log(chalk.gray(sprintf('    %s', widget.meta.html)));
        console.log(chalk.gray(sprintf('    %s', widget.meta.scss)));
        console.log('');
    });
    const cleanup = () => {
        void watcher.close();
        server.close();
        process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
};
