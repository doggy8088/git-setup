"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAliasAc = buildAliasAc;
exports.buildAliasUndo = buildAliasUndo;
const MINIFIED_FILE_PATTERN = '\\.(min\\.js|min\\.css|min\\..+\\.js|min\\..+\\.css|-min\\.js|-min\\.css|bundle\\.js|bundle\\.min\\.js)$';
const LOCKFILE_PATTERN = '(package-lock\\.json|yarn\\.lock|pnpm-lock\\.yaml|bun\\.lockb|Bun\\.lock|Gemfile\\.lock|Cargo\\.lock|composer\\.lock|Podfile\\.lock|poetry\\.lock|Pipfile\\.lock|packages\\.lock\\.json|pubspec\\.lock|mix\\.lock|go\\.sum)$';
const EXCLUDED_DIFF_PATHS = [
    '*.min.js',
    '*.min.css',
    '*.min.*.js',
    '*.min.*.css',
    '*-min.js',
    '*-min.css',
    '*.bundle.js',
    '*.bundle.min.js',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb',
    'Bun.lock',
    'Gemfile.lock',
    'Cargo.lock',
    'composer.lock',
    'Podfile.lock',
    'poetry.lock',
    'Pipfile.lock',
    'packages.lock.json',
    'pubspec.lock',
    'mix.lock',
    'go.sum'
];
function buildExcludedPathspecs() {
    return EXCLUDED_DIFF_PATHS.map((path) => `':(exclude)${path}'`).join(' ');
}
function buildExcludedSectionCommand(sourceVar, label, linesVar) {
    return `if [ -n "$${sourceVar}" ]; then ${linesVar}=$(printf "%s\\n" "$${sourceVar}" | sed 's/^/  /'); if [ -z "$excluded_sections" ]; then excluded_sections=$(printf "%s\\n%s" "${label}" "$${linesVar}"); else excluded_sections=$(printf "%s\\n\\n%s\\n%s" "$excluded_sections" "${label}" "$${linesVar}"); fi; fi`;
}
function buildAliasAc() {
    const excludedPathspecs = buildExcludedPathspecs();
    const commands = [
        'if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then exit 0; fi',
        'if ! command -v aichat >/dev/null 2>&1; then exit 0; fi',
        'if git diff --cached --quiet; then if git diff --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then exit 0; fi; git add -A; fi',
        `deleted=$(git diff --cached --diff-filter=D --name-status | awk '{print $2}')`,
        `minified=$(git diff --cached --diff-filter=d --name-only | grep -E '${MINIFIED_FILE_PATTERN}' || true)`,
        `lockfiles=$(git diff --cached --diff-filter=d --name-only | grep -E '${LOCKFILE_PATTERN}' || true)`,
        'if [ -n "$deleted" ]; then echo "已排除刪除的檔案:"; echo "$deleted" | sed \'s/^/  D /\'; echo ""; fi',
        'if [ -n "$minified" ]; then echo "已排除壓縮檔案:"; echo "$minified" | sed \'s/^/  M /\'; echo ""; fi',
        'if [ -n "$lockfiles" ]; then echo "已排除 lock 檔案:"; echo "$lockfiles" | sed \'s/^/  L /\'; echo ""; fi',
        `included=$(git diff --cached --diff-filter=d --name-status ${excludedPathspecs} | awk '{printf "%s %s\\n", $1, $2}')`,
        'if [ -n "$included" ]; then echo "納入 AI 分析的檔案:"; echo "$included" | sed \'s/^A /  新增: /\' | sed \'s/^M /  修改: /\' | sed \'s/^R[0-9]* /  重新命名: /\'; echo ""; fi',
        'excluded_sections=""',
        buildExcludedSectionCommand('deleted', '刪除的檔案（僅列檔名/路徑）:', 'deleted_lines'),
        buildExcludedSectionCommand('minified', '壓縮檔案（僅列檔名/路徑）:', 'minified_lines'),
        buildExcludedSectionCommand('lockfiles', 'lock 檔案（僅列檔名/路徑）:', 'lock_lines'),
        `diff=$(git diff --cached --diff-filter=d --ignore-all-space ${excludedPathspecs})`,
        'if [ -z "$diff" ] && [ -z "$excluded_sections" ]; then echo "沒有可分析的變更內容（可能全部為二進位檔案或已排除的檔案）"; exit 0; fi',
        'if [ -n "$excluded_sections" ]; then prompt=$(printf "%s\\n%s\\n\\n%s" "以下為排除檔案（僅列檔名/路徑，不含內容）:" "$excluded_sections" "$diff"); else prompt="$diff"; fi',
        'char_count=$(printf "%s" "$prompt" | wc -c)',
        'if [ "$char_count" -gt 150000 ]; then echo "變更內容過大（超過 150,000 字元），無法產生變更摘要。請考慮將變更拆分為多個較小的 commit。"; exit 0; fi',
        'msg=$(printf "%s" "$prompt" | aichat "依據 diff 產生高解析度、技術導向、精準且簡潔的繁體中文 Git commit 訊息。採用 Conventional Commits 1.0.0 格式撰寫。不得包含多餘語句，只輸出 commit title 與必要的 body。")',
        'git commit -m "$msg" && git --no-pager log -1'
    ];
    return `!f() { ${commands.join('; ')}; }; f`;
}
function buildAliasUndo() {
    return '!f() { if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then echo "[undo] skip: not a git repository"; exit 0; fi; echo "[undo] Undo Last Commit: git reset HEAD~"; git reset HEAD~; }; f';
}
