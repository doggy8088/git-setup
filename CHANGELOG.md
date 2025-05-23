# @willh/git-setup

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
