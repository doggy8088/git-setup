# @willh/git-setup

## 0.2.4

Fix `git ignore` alias on Linux/macOS platform shell environment

    git config --global alias.ignore '!'"gi() { curl -sL https://www.gitignore.io/api/\$@ ;}; gi"

## 0.2.0

Add `git ignore` alias

    git config --global alias.ignore "!gi() { curl -sL https://www.gitignore.io/api/$@ ;}; gi"

## 0.1.0

Initial release
