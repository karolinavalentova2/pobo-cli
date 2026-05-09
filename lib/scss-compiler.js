import path from 'node:path';
import * as sass from 'sass';
export const compileScss = (filePath, { style = 'compressed' } = {}) => {
    const result = sass.compile(filePath, {
        style,
        loadPaths: [
            path.dirname(filePath),
            path.join(process.cwd(), 'node_modules'),
        ],
    });
    return result.css;
};
