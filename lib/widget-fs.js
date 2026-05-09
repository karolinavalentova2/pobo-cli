import fs from 'node:fs';
import path from 'node:path';
import { sprintf } from '../utils/sprintf.js';
const slugify = (value) => String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
const buildHtmlTemplate = (rootClass) => `<div class="${rootClass}">
    <h2 class="${rootClass}__title">Widget heading</h2>
    <p class="${rootClass}__text">Widget text</p>
</div>
`;
const buildScssTemplate = (rootClass) => `.${rootClass} {
    width: 100%;
    padding: 20px;

    &__title {
        font-size: 24px;
        font-weight: 700;
        color: #111111;
        line-height: 1.2;
        margin: 0 0 10px 0;
    }

    &__text {
        font-size: 16px;
        color: #333333;
        line-height: 1.5;
    }
}
`;
const readMetadata = (dir) => {
    const file = path.join(dir, 'widget.json');
    if (!fs.existsSync(file)) {
        return null;
    }
    try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (typeof parsed.id !== 'number' ||
            typeof parsed.name !== 'string' ||
            typeof parsed.root_class !== 'string' ||
            typeof parsed.html !== 'string' ||
            typeof parsed.scss !== 'string') {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
};
export const widgetRoot = () => path.join(process.cwd(), 'widgets');
export const widgetDir = (id) => path.join(widgetRoot(), String(id));
export const findWidgetByCwd = () => {
    let dir = process.cwd();
    while (true) {
        const meta = readMetadata(dir);
        if (meta && meta.id) {
            return { dir, meta };
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            return null;
        dir = parent;
    }
};
export const findWidgetById = (id) => {
    const dir = widgetDir(id);
    const meta = readMetadata(dir);
    if (meta) {
        return { dir, meta };
    }
    return null;
};
export const resolveWidget = (idArg) => {
    if (idArg) {
        const found = findWidgetById(idArg);
        if (!found) {
            throw new Error(sprintf('Widget with ID %s not found in widgets/%s.', idArg, idArg));
        }
        return found;
    }
    const current = findWidgetByCwd();
    if (!current) {
        throw new Error('Not in a widget directory. Run from widgets/<id> or pass ID as an argument.');
    }
    return current;
};
export const createWidgetScaffold = ({ id, name, rootClass }) => {
    const dir = widgetDir(id);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const htmlFile = path.join(dir, sprintf('%s-%s.html', slugify(name), id));
    const scssFile = path.join(dir, sprintf('%s-%s.scss', slugify(name), id));
    const metaFile = path.join(dir, 'widget.json');
    if (!fs.existsSync(htmlFile)) {
        fs.writeFileSync(htmlFile, buildHtmlTemplate(rootClass));
    }
    if (!fs.existsSync(scssFile)) {
        fs.writeFileSync(scssFile, buildScssTemplate(rootClass));
    }
    fs.writeFileSync(metaFile, JSON.stringify({
        id,
        name,
        root_class: rootClass,
        html: path.basename(htmlFile),
        scss: path.basename(scssFile),
    }, null, 2));
    return { dir, htmlFile, scssFile, metaFile };
};
export const readHtml = (widget) => {
    const file = path.join(widget.dir, widget.meta.html);
    if (!fs.existsSync(file)) {
        throw new Error(sprintf('HTML file %s does not exist.', widget.meta.html));
    }
    return fs.readFileSync(file, 'utf8');
};
export const readScss = (widget) => {
    const file = path.join(widget.dir, widget.meta.scss);
    if (!fs.existsSync(file)) {
        throw new Error(sprintf('SCSS file %s does not exist.', widget.meta.scss));
    }
    return file;
};
