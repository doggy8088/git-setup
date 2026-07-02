.PHONY: help start install build build-ac bump clean status version

help:
	@echo "Git Setup 常用指令"
	@echo "  make help      顯示可用指令"
	@echo "  make install   安裝依賴套件"
	@echo "  make start     執行 CLI（相當於 npm run start）"
	@echo "  make build     產生最小化的 alias.ac 腳本到 dist/"
	@echo "  make build-ac   同上，直接執行建置腳本"
	@echo "  make bump      執行版本 patch bump 並更新 package-lock.json"
	@echo "  make clean     移除建置檔"
	@echo "  make status    顯示 git 狀態"
	@echo "  make version   顯示目前套件版本"

install:
	npm install

start:
	npm run start

build:
	npm run build

build-ac:
	npm run build-ac

bump:
	npm run bump

clean:
	node -e "const fs = require('fs'); const p = require('path').join(process.cwd(), 'dist', 'alias-ac.min.sh'); if (fs.existsSync(p)) fs.rmSync(p, { force: true });"

status:
	git status --short

version:
	node -e "const pkg = require('./package.json'); console.log(pkg.version);"
