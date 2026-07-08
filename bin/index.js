#!/usr/bin/env node

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const os = require('os').platform();
const fs = require('fs');
const path = require('path');

// Function to read single keypress
function readKey() {
    return new Promise((resolve, reject) => {
        const wasRaw = process.stdin.isRaw;
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', (data) => {
            process.stdin.setRawMode(wasRaw);
            process.stdin.pause();

            // Handle Ctrl+C
            if (data[0] === 3) {
                console.log('\n已取消');
                process.exit(0);
            }

            // Handle 'q' key to quit
            if (data.toString().toLowerCase() === 'q') {
                console.log();
                console.log('已取消');
                process.exit(0);
            }

            resolve(data.toString());
        });
    });
}

(async function () {

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function ask(subject) {
        return new Promise((resolve, reject) => {
            readline.question(subject + ' ', (ans) => { resolve(ans); });
        });
    }

    // Parse command line arguments
    const args = process.argv.slice(2);
    let name = '';
    let email = '';
    let interactive = false;

    // Handle help flag
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Usage: npx @willh/git-setup [options]

Options:
  --name <name>       Set Git user.name
  --email <email>     Set Git user.email
  -i, --interactive   Enable interactive confirmation for each setting
  -h, --help          Display this help message
  -v, --version       Display version information
`);
        process.exit(0);
    }

    // Handle version flag
    if (args.includes('--version') || args.includes('-v')) {
        const pkg = require('../package.json');
        console.log(`v${pkg.version}`);
        process.exit(0);
    }

    // Check for --name and --email arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--name' && i + 1 < args.length) {
            name = args[i + 1];
            i++; // Skip the next argument as it's the value
        } else if (args[i] === '--email' && i + 1 < args.length) {
            email = args[i + 1];
            i++; // Skip the next argument as it's the value
        } else if (args[i] === '--interactive' || args[i] === '-i') {
            interactive = true;
        }
    }

    // If arguments were not provided, prompt for them
    if (!name || !email) {
        console.log('以下將會協助你進行 Git 版控環境設定：');
        console.log();

        // Read current Git user.name and user.email
        let currentName = '';
        let currentEmail = '';
        try {
            const { stdout: nameStdout } = await exec('git config --global user.name');
            currentName = nameStdout.trim();
        } catch (err) {
            // Ignore error if not set
        }
        try {
            const { stdout: emailStdout } = await exec('git config --global user.email');
            currentEmail = emailStdout.trim();
        } catch (err) {
            // Ignore error if not set
        }

        if (!name) {
            const namePrompt = currentName ? `請問您的顯示名稱？ [${currentName}]` : `請問您的顯示名稱？`;
            const input = await ask(namePrompt);
            name = input.trim() || currentName;
        }

        if (!email) {
            const emailPrompt = currentEmail ? `請問您的 E-mail 地址？ [${currentEmail}]` : `請問您的 E-mail 地址？`;
            const input = await ask(emailPrompt);
            email = input.trim() || currentEmail;
        }
    }

    if (!name) {
        console.error('You MUST configure user.name setting!');
        return;
    }

    if (!validateEmail(email)) {
        console.error('You MUST configure user.email setting!');
        return;
    }

    console.log();
    console.log('開始進行 Git 環境設定');
    console.log('------------------------------------------');

    await cmd(`git config --global user.name  ${name}`);
    await cmd(`git config --global user.email  ${email}`);

    await cmdWithConfirm("git config --global help.autocorrect 30", interactive, ask);
    await cmdWithConfirm("git config --global push.autoSetupRemote true", interactive, ask);

    await cmdWithConfirm("git config --global init.defaultBranch main", interactive, ask);
    await cmdWithConfirm("git config --global core.autocrlf input", interactive, ask);
    await cmdWithConfirm("git config --global core.safecrlf false", interactive, ask);
    await cmdWithConfirm("git config --global core.quotepath false", interactive, ask);

    await cmdWithConfirm("git config --global color.diff auto", interactive, ask);
    await cmdWithConfirm("git config --global color.status auto", interactive, ask);
    await cmdWithConfirm("git config --global color.branch auto", interactive, ask);

    await cmdWithConfirm("git config --global alias.ci   commit", interactive, ask);
    await cmdWithConfirm("git config --global alias.cm   \"commit --amend -C HEAD\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.co   checkout", interactive, ask);
    await cmdWithConfirm("git config --global alias.st   status", interactive, ask);
    await cmdWithConfirm("git config --global alias.sts  \"status -s\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.br   branch", interactive, ask);
    await cmdWithConfirm("git config --global alias.re   remote", interactive, ask);
    await cmdWithConfirm("git config --global alias.di   diff", interactive, ask);
    await cmdWithConfirm("git config --global alias.type \"cat-file -t\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.dump \"cat-file -p\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.lo   \"log --oneline\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.ls   \"log --show-signature\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.ll   \"log --pretty=format:'%h %ad | %s%d [%Cgreen%an%Creset]' --graph --date=short\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.lg   \"log --graph --pretty=format:'%Cred%h%Creset %ad |%C(yellow)%d%Creset %s %Cgreen(%cr)%Creset [%Cgreen%an%Creset]' --abbrev-commit --date=short\"", interactive, ask);
    await cmdWithConfirm("git config --global alias.alias \"config --get-regexp ^alias\\.\"", interactive, ask);

    // Helper function for escaping single quotes in shell strings
    const escapeForSingleQuotes = (s) => s.replace(/'/g, `'\\''`);

    function buildAttributesAlias(content) {
        const normalized = content.replace(/\r\n/g, '\n').replace(/\n$/, '');
        const lines = normalized.split('\n');
        const args = lines.map((line) => `'${escapeForSingleQuotes(line)}'`).join(' ');
        return `!f() { printf '%s\\n' ${args}; }; f`;
    }

    function buildMinifiedAliasCommand(sourceScript) {
        const lines = sourceScript
            .replace(/^\uFEFF/, '')
            .replace(/\r\n?/g, '\n')
            .split('\n')
            .map((line) => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) {
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

    function loadAliasAcScript() {
        const distPath = path.join(__dirname, '../dist/alias-ac.min.sh');
        const sourcePath = path.join(__dirname, '../scripts/alias-ac.full.sh');

        if (fs.existsSync(distPath)) {
            const distScript = fs.readFileSync(distPath, 'utf8').trim();
            if (distScript) {
                return distScript;
            }
        }

        const sourceScript = fs.readFileSync(sourcePath, 'utf8');
        return buildMinifiedAliasCommand(sourceScript);
    }

    // --- add: alias.attributes (cross-platform) ---
    const gitattributesContent = `# --- 基本：自動偵測文字檔並正規化至 LF ---
* text=auto

# --- 一致化 LF（跨平台工具與 CI 友善） ---
*.sh         text eol=lf
*.bash       text eol=lf
*.zsh        text eol=lf
*.fish       text eol=lf
Makefile     text eol=lf
Dockerfile   text eol=lf
.dockerignore text eol=lf
.editorconfig text eol=lf
.gitattributes text eol=lf
.gitignore   text eol=lf
*.md         text eol=lf
*.txt        text eol=lf
*.json       text eol=lf
*.jsonc      text eol=lf
*.yaml       text eol=lf
*.yml        text eol=lf
*.toml       text eol=lf
*.ini        text eol=lf
*.cfg        text eol=lf
*.properties text eol=lf
*.env        text eol=lf
*.rc         text eol=lf

# 程式碼檔案
*.c          text eol=lf
*.h          text eol=lf
*.cpp        text eol=lf
*.hpp        text eol=lf
*.cc         text eol=lf
*.cs         text eol=lf
*.go         text eol=lf
*.java       text eol=lf
*.kt         text eol=lf
*.kts        text eol=lf
*.js         text eol=lf
*.jsx        text eol=lf
*.ts         text eol=lf
*.tsx        text eol=lf
*.mjs        text eol=lf
*.cjs        text eol=lf
*.py         text eol=lf
*.rb         text eol=lf
*.php        text eol=lf
*.rs         text eol=lf
*.swift      text eol=lf
*.m          text eol=lf
*.mm         text eol=lf
*.scala      text eol=lf
*.r          text eol=lf
*.pl         text eol=lf
*.lua        text eol=lf
*.gradle     text eol=lf

# 標記與前端相關
*.css        text eol=lf
*.scss       text eol=lf
*.less       text eol=lf
*.html       text eol=lf
*.xhtml      text eol=lf
*.xml        text eol=lf
*.svg        text eol=lf

# --- Windows 專用腳本與專案檔案：檢出時使用 CRLF ---
*.bat        text eol=crlf
*.cmd        text eol=crlf
*.ps1        text eol=crlf
*.sln        text eol=crlf
*.vcxproj    text eol=crlf
*.vcproj     text eol=crlf
*.csproj     text eol=crlf
*.vbproj     text eol=crlf
*.props      text eol=crlf
*.targets    text eol=crlf

# --- 二進位檔案：停用行尾與 diff ---
# 影像
*.png  binary
*.jpg  binary
*.jpeg binary
*.gif  binary
*.webp binary
*.ico  binary
*.psd  binary
*.ai   binary
*.eps  binary

# 影音
*.mp3  binary
*.wav  binary
*.flac binary
*.ogg  binary
*.mp4  binary
*.mov  binary
*.avi  binary
*.mkv  binary

# 字型
*.ttf  binary
*.otf  binary
*.woff binary
*.woff2 binary

# 文件與試算表
*.pdf  binary
*.doc  binary
*.docx binary
*.xls  binary
*.xlsx binary
*.ppt  binary
*.pptx binary

# 壓縮與封裝
*.zip  binary
*.7z   binary
*.rar  binary
*.gz   binary
*.bz2  binary
*.tar  binary
*.jar  binary
*.apk  binary
*.ipa  binary

# 執行檔與目標檔
*.exe  binary
*.dll  binary
*.pdb  binary
*.so   binary
*.dylib binary
*.a    binary
*.lib  binary
*.o    binary

# 資料庫與快取
*.sqlite binary
*.db     binary

# --- 降噪：縮小無意義 diff ---
*.min.js -diff
*.min.css -diff
*.map    -diff

# --- 選用：Git LFS（如已啟用，再解除註解） ---
#*.psd filter=lfs diff=lfs merge=lfs -text
#*.mp4 filter=lfs diff=lfs merge=lfs -text
#*.zip filter=lfs diff=lfs merge=lfs -text

# --- 選用：打包時不包含開發輔助檔 ---
#/.github        export-ignore
#/.gitignore     export-ignore
#/.gitattributes export-ignore
#/.editorconfig  export-ignore
`;

    const aliasAttributes = buildAttributesAlias(gitattributesContent);

    if (os === 'win32') {
        await cmdWithConfirm(`git config --global alias.attributes "${aliasAttributes.replace(/"/g, '\\"')}"`, interactive, ask);
    } else {
        await cmdWithConfirm(`git config --global alias.attributes '${escapeForSingleQuotes(aliasAttributes)}'`, interactive, ask);
    }

    // --- add: alias.ac / alias.undo (cross-platform) ---
    const aliasAc = loadAliasAcScript();
    const aliasUndo = `!f() { if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then echo "[undo] skip: not a git repository"; exit 0; fi; echo "[undo] Undo Last Commit: git reset HEAD~"; git reset HEAD~; }; f`;

    if (aliasAc) {
        if (os === 'win32') {
            await cmdWithConfirm(`git config --global alias.ac "${aliasAc.replace(/"/g, '\\"')}"`, interactive, ask);
            await cmdWithConfirm(`git config --global alias.undo "${aliasUndo.replace(/"/g, '\\"')}"`, interactive, ask);
        } else {
            await cmdWithConfirm(`git config --global alias.ac '${escapeForSingleQuotes(aliasAc)}'`, interactive, ask);
            await cmdWithConfirm(`git config --global alias.undo '${escapeForSingleQuotes(aliasUndo)}'`, interactive, ask);
        }
    } else {
        console.error('alias.ac 未建立，請先執行 npm run build-ac');
    }


    // git config --global alias.ignore "!gi() { curl -sL https://www.gitignore.io/api/\$@ ;}; gi"
    if (os === 'win32') {
        await cmdWithConfirm("git config --global alias.ignore \"!gi() { curl -sL https://www.gitignore.io/api/$@ ;}; gi\"", interactive, ask);
    } else {
        await cmdWithConfirm("git config --global alias.ignore '!'\"gi() { curl -sL https://www.gitignore.io/api/\\$@ ;}; gi\"", interactive, ask);
    }

    // git config --global alias.iac  "!giac() { git init && git add . && git commit -m 'Initial commit' ;}; giac"
    if (os === 'win32') {
        await cmdWithConfirm("git config --global alias.iac \"!giac() { git init -b main && git add . && git commit -m 'Initial commit' ;}; giac\"", interactive, ask);
    } else {
        await cmdWithConfirm("git config --global alias.iac '!'\"giac() { git init -b main && git add . && git commit -m 'Initial commit' ;}; giac\"", interactive, ask);
    }

    // git config --global alias.liac  "!gliac() { hash=$(pwd | { if command -v md5 >/dev/null 2>&1; then md5; else md5sum | awk '{print $1}'; fi; }); repo=$HOME/.git-repos/$hash && mkdir -p \"$repo\" && printf '%s\n' \"$(pwd)\" > \"$repo/OriginalWorkingTreePath\" && git init --separate-git-dir \"$repo\" && cd \"$(pwd)\" && git add . && git commit -m 'Initial commit' ;}; gliac"
    const aliasLiac = `!gliac() { hash=$(pwd | { if command -v md5 >/dev/null 2>&1; then md5; else md5sum | awk '{print $1}'; fi; }); repo="${HOME}/.git-repos/$hash"; mkdir -p "$repo"; printf '%s\n' "$(pwd)" > "$repo/OriginalWorkingTreePath"; git init --separate-git-dir "$repo" && cd "$(pwd)" && git add . && git commit -m 'Initial commit' ;}; gliac`;
    if (os === 'win32') {
        await cmdWithConfirm(`git config --global alias.liac "${aliasLiac.replace(/"/g, '\\"')}"`, interactive, ask);
    } else {
        await cmdWithConfirm(`git config --global alias.liac '${escapeForSingleQuotes(aliasLiac)}'`, interactive, ask);
    }

    // git config --global alias.cc  "!grcc() { git reset --hard && git clean -fdx ;}; read -p 'Do you want to run the <<< git reset --hard && git clean -fdx >>> command? (Y/N) ' answer && [[ $answer == [Yy] ]] && grcc"
    if (os === 'win32') {
        await cmdWithConfirm("git config --global alias.cc \"!grcc() { git reset --hard && git clean -fdx ;}; read -p 'Do you want to run the <<< git reset --hard && git clean -fdx >>> command? (Y/N) ' answer && [[ $answer == [Yy] ]] && grcc\"", interactive, ask);
    } else {
        await cmdWithConfirm("git config --global alias.cc '!'\"grcc() { git reset --hard && git clean -fdx ;}; read -p 'Do you want to run the <<< git reset --hard && git clean -fdx >>> command? (Y/N) ' answer && [[ $answer == [Yy] ]] && grcc\"", interactive, ask);
    }

    // git config --global alias.acp "!gacp() { git add . && git commit --reuse-message=HEAD --amend && git push -f ;}; gacp"
    if (os === 'win32') {
        await cmdWithConfirm("git config --global alias.acp \"!gacp() { git add . && git commit --reuse-message=HEAD --amend && git push -f ;}; gacp\"", interactive, ask);
    } else {
        await cmdWithConfirm("git config --global alias.acp '!'\"gacp() { git add . && git commit --reuse-message=HEAD --amend && git push -f ;}; gacp\"", interactive, ask);
    }

    // git config --global alias.aca "!gaca() { git add . && git commit --reuse-message=HEAD --amend ;}; gaca"
    if (os === 'win32') {
        await cmdWithConfirm("git config --global alias.aca \"!gaca() { git add . && git commit --reuse-message=HEAD --amend ;}; gaca\"", interactive, ask);
    } else {
        await cmdWithConfirm("git config --global alias.aca '!'\"gaca() { git add . && git commit --reuse-message=HEAD --amend ;}; gaca\"", interactive, ask);
    }

    if (os === 'win32' && fs.existsSync('C:/PROGRA~1/TortoiseGit/bin/TortoiseGitProc.exe')) {
        await cmdWithConfirm("git config --global alias.tlog \"!start 'C:\\PROGRA~1\\TortoiseGit\\bin\\TortoiseGitProc.exe' /command:log /path:.", interactive, ask);
    }

    if (os === 'win32') {
        await cmdWithConfirm("git config --global core.editor notepad", interactive, ask);
    }

    if (!process.env.LC_ALL) {
        if (os === 'win32') {
            await cmd("SETX LC_ALL C.UTF-8");
            console.log("請重新啟動應用程式或命令提示字元以讓環境變數生效！");
        } else {
            console.log("BE REMEMBER SETUP THE FOLLOWING ENVIRONMENT VARIABLE:");
            console.warn("export LC_ALL=C.UTF-8");
        }
    }

    if (!process.env.LANG) {
        if (os === 'win32') {
            await cmd("SETX LANG C.UTF-8");
            console.log("請重新啟動應用程式或命令提示字元以讓環境變數生效！");
        } else {
            console.log("BE REMEMBER SETUP THE FOLLOWING ENVIRONMENT VARIABLE:");
            console.warn("export LANG=C.UTF-8");
        }
    }

    readline.close();
})();

async function cmd(command) {
    console.log(command);
    const { stdout, stderr } = await exec(command);
    if (stderr) {
        console.debug(stderr);
        return;
    }
    if (stdout) {
        console.log(stdout);
    }
}

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

async function cmdWithConfirm(command, interactive, ask) {
    if (interactive) {
        process.stdout.write(`執行此命令嗎？ ${command} (y/n/q): `);
        const key = await readKey();
        console.log(); // Just print newline without echoing the key
        if (key.toLowerCase() !== 'y') {
            console.log('已跳過');
            return;
        }
    }
    await cmd(command);
    if (interactive) {
        console.log('已設定');
    }
}
