# @willh/git-setup

## 1.5.6

- 新增 `git clearcache` alias，可清除本機 Git 快取設定，解決 Oh-My-Zsh 等工具遇到 Git 狀態未更新的問題。
  - 執行 `git config --local feature.manyFiles false`
  - 執行 `git config --local index.skipHash false`
  - 執行 `git config --local core.untrackedCache false`
  - 執行 `git update-index --no-untracked-cache`
  - 執行 `git status`

## 1.5.3

- 修正 `git ac` 精簡流程中對 `git diff --stat` 的參數順序，避免出現 `fatal: option '--stat' must come before non-option arguments`。
- 調整 `git ac` 構建壓縮腳本的分號補上邏輯，避免輸出 `then;`、`fi if` 等壞掉的控制流程語法。
- 將版本更新為 `1.5.3`，同步更新 `package.json` 與 `package-lock.json`。

## 1.5.2

- 修正 `git liac` alias 中 `${HOME}` 被 JavaScript template literal 錯誤插值（`ReferenceError: HOME is not defined`）的問題，改為 `$HOME`（shell 在執行期才展開，JS 不插值）

## 1.5.1

- 修正 `git liac` alias 漏掉 `git add . && git commit -m 'Initial commit'` 的問題，使其行為與 `git iac` 一致（差別僅在使用 `--separate-git-dir`）

## 1.5.0

- Add `prepublishOnly` lifecycle to ensure `dist/alias-ac.min.sh` is rebuilt before every `npm publish`.
- Clarify publish flow in release docs (`README.md`, `PUBLISH.md`) to include publish-time build steps.

## 1.4.9

- Add `git liac` to write working tree original path to `~/.git-repos/<path-hash>/OriginalWorkingTreePath` (PascalCase filename)
- Refactor `git ac` implementation into `scripts/alias-ac.full.sh` with `scripts/build-ac.js` minified output and cross-platform loading
- Add fallback commit strategy when diff output is too large: generate commit message from file list and stat summary
- Add `Makefile` for common project management commands and hook up `build-ac` scripts in `package.json`

## 1.4.8

- Update `git liac` to write the original working tree path into `~/.git-repos/<path-hash>/WORKING_TREE_PATH`

## 1.4.7

- Add `git liac` alias for initializing a repository with `--separate-git-dir` under `~/.git-repos`
- Add fallback from `md5` to `md5sum` for environments without the `md5` command

## 1.4.6

- Improve `git ac` diff filtering and commit message generation prompts
- Add project-level `AGENTS.md` instructions for repository-specific Codex behavior

## 1.4.5

- Change `core.safecrlf` default from `true` to `false` to reduce cross-platform line ending blocks
- Improve `.gitattributes` alias generation and quoting behavior
- Update README guidance for line ending configuration

## 1.4.4

- Add `push.autoSetupRemote` global Git configuration
- Update README documentation for automatic upstream setup on first push

## 1.4.3

- Add `git ac` for generating commit messages using AIChat with improved diff filtering:
  - Exclude minified files from diff analysis (*.min.js, *.min.css, *.min.*.js, *.min.*.css, *-min.js, *-min.css, *.bundle.js, *.bundle.min.js)
  - Exclude binary files from diff using `--diff-filter=d` flag
  - Add informative error messages when diff is too large or contains only excluded files

## 1.4.2

- Add lock file exclusions to `git ac` diff analysis
- Update README documentation for lock file exclusion behavior

## 1.4.1

- Update `git ac` to list excluded and included files before AI analysis
- Display deleted files, minified files, and analyzed files separately

## 1.4.0

- Add `git attributes` alias to display recommended `.gitattributes` file content
  - Use `git attributes > .gitattributes` to quickly create the file in your project
  - Cross-platform support for both Windows and Linux/macOS
- Update README.md with documentation for `-i` interactive mode usage
- Add `.gitattributes` file to the project itself following the recommended configuration
- Add comprehensive documentation for the new `git attributes` alias

## 1.3.4

- Enhance `git ac` alias with improved diff filtering:
  - Add 50,000 character limit check for diff content to prevent overwhelming AI analysis
  - Exclude minified files from diff analysis (*.min.js, *.min.css, *.min.*.js, *.min.*.css, *-min.js, *-min.css, *.bundle.js, *.bundle.min.js)
  - Exclude binary files from diff using `--diff-filter=d` flag
  - Add informative error messages when diff is too large or contains only excluded files

## 1.3.3

- Add '--no-pager' to `git ac` alias to prevent paging of commit info output

## 1.3.2

- Add 'q' key support to quit interactive mode at any confirmation prompt
- Show current Git user.name and user.email in prompts with sensible defaults
- Allow pressing Enter to keep current Git configuration values without re-entering
- Add feedback message "已設定" after each successful configuration in interactive mode
- Update `git ac` alias to display last commit info after creating commit

## 1.3.1

- Update `git ac` alias to operate silently without debug logging
- Add untracked files detection to `git ac` alias using `git ls-files --others --exclude-standard`
- Improve exit logic: only proceed when there are actual changes (staged, unstaged, or untracked files)

## 1.3.0

- Add `--interactive` (`-i`) flag for interactive confirmation of each Git configuration command
- Add `readKey()` function to read single keypress for better user interaction
- Add `cmdWithConfirm()` helper function to handle interactive execution flow
- Improve user experience by allowing granular control over which settings to apply

## 1.2.0

- Add `git ac` alias that integrates with [aichat](https://github.com/sigoden/aichat) to automatically generate high-quality, technical, precise and concise Traditional Chinese commit messages following Conventional Commits 1.0.0 format
  - Automatically detects staged/unstaged changes and runs `git add -A` if needed
  - Checks if running in a git repository and if `aichat` command is available
  - Uses AI to analyze diff and generate commit message, then auto-commits
- Add `git undo` alias for quick undo of last commit while keeping all changes
  - Executes `git reset HEAD~` to undo the last commit
  - Preserves all changes in working directory
- Update README.md with detailed usage instructions for `git ac` and `git undo`
- Add `scripts.start` command in package.json

## 1.1.0

- Add `git aca` alias for `git add . && git commit --reuse-message=HEAD --amend`
  - Stages all changes and amends to the last commit reusing the same commit message
- Update `git acp` alias to use `--reuse-message=HEAD` instead of `-C HEAD` for better clarity
  - New command: `git add . && git commit --reuse-message=HEAD --amend && git push -f`

## 1.0.0

- **BREAKING CHANGE**: Update `core.autocrlf` configuration from `false` to `input` for cross-platform line ending consistency
- Add `core.safecrlf true` configuration to prevent mixed line endings from being committed
- This ensures all text files in repositories use LF line endings while preventing accidental mixed line ending commits
- These changes improve cross-platform collaboration between Windows, Linux, and macOS developers

## 0.10.0

- Add `init.defaultBranch` configuration set to `main` for new repositories

## 0.9.0

- Add support for `-h, --help` and `-v, --version` flags in CLI.
- Update README links: remove trailing slash from blog URL; update online course URL to `https://learn.duotify.com`.

## 0.8.0

- Add support for command-line arguments `--name` and `--email` to allow non-interactive usage
- Example: `npx @willh/git-setup --name "Your Name" --email your.email@example.com`

## 0.7.0

- Rename alias from `git rc` to `git cc` which CCleaner is a famous tool for cleaning up the system so `cc` is much easier to remember the alias.
- Add an alias `git acp` for `git add . && git commit --amend -C HEAD && git push -f`.

## 0.6.2

- Add `git rc` for execute `git reset --hard && git clean -fdx` command with confirmation.
- Update README.md

## 0.5.0

- Update `git iac` that assume `main` branch for `git init`

## 0.4.0

- Add `git iac` alias that doing `git init && git add . && git commit -m 'Initial commit'` at once.

## 0.3.0

- Add `git ls` alias that shows log with GPG signature information

    ```sh
    git config --global alias.ls "log --show-signature"
    ```

## 0.2.4

- Fix `git ignore` alias on Linux/macOS platform shell environment

    ```sh
    git config --global alias.ignore '!'"gi() { curl -sL https://www.gitignore.io/api/\$@ ;}; gi"
    ```

## 0.2.0

- Add `git ignore` alias

    git config --global alias.ignore "!gi() { curl -sL https://www.gitignore.io/api/$@ ;}; gi"

## 0.1.0

- Initial release
