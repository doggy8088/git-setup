#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'alias-ac.full.sh');
const distDir = path.join(__dirname, '..', 'dist');
const distPath = path.join(distDir, 'alias-ac.min.sh');

function minifyShellAlias(source) {
    const lines = source
        .replace(/^\uFEFF/, '')
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) {
                return '';
            }
            if (trimmed.startsWith('#')) {
                return '';
            }

            return trimmed.replace(/\s+/g, ' ');
        })
        .filter(Boolean)
        .map((line) => {
            if (line.endsWith(';')) {
                return line;
            }
            return `${line};`;
        });

    const body = lines.join(' ');
    if (!body) {
        return '';
    }

    return `!f() { ${body} }; f`;
}

function buildAliasCommand() {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const minified = minifyShellAlias(source);

    if (!minified) {
        throw new Error('alias-ac.min.sh source script is empty.');
    }

    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(distPath, `${minified}\n`, 'utf8');

    console.log(`Generated ${path.relative(process.cwd(), distPath)}`);
}

buildAliasCommand();
