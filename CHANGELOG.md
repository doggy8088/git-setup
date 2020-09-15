# @willh/git-setup

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
