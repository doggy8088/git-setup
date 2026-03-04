# 建置與發佈流程

## 建置（TypeScript → JavaScript）

### 編譯指令

```sh
npm run build
```

等同於 `tsc -p tsconfig.json`，將 `bin/**/*.ts` 編譯為同目錄下的 `.js` 檔。

### tsconfig 重點設定

| 設定項 | 值 | 說明 |
|--------|-----|------|
| `target` | `ES2019` | 支援 Node.js >= 10.13.0 |
| `module` | `commonjs` | npm CLI 套件標準模組格式 |
| `strict` | `true` | 啟用完整型別檢查 |
| `noEmitOnError` | `true` | 有型別錯誤時不產出 .js |

### 編譯產出位置

`.js` 檔會產生在對應的 `.ts` 同層目錄（in-place），例如：

```
bin/index.ts    → bin/index.js
bin/aliases/ac.ts → bin/aliases/ac.js
```

> **注意**：`bin/*.js` 與 `bin/aliases/*.js` 為編譯產物，應由 `npm run build` 產生，勿手動編輯。

### 本機執行測試

```sh
npm run start
```

等同於 `npm run build && node bin/index.js`，會先編譯再執行 CLI。

## 發佈 npm 套件

### 自動發佈（推薦）

專案已設定 GitHub Actions 搭配 npm Trusted Publishing：

1. 修改 `package.json` 的 `version`（或使用 `npm run bump` 自動遞增 patch 版號）
2. Commit 並推送至 `master` 分支
3. GitHub Actions 自動觸發發佈

### 手動發佈

```sh
npm publish --provenance --access public
```

需先執行 `npm login` 登入 npm 帳號。

### 版號管理

```sh
npm run bump
```

此指令會：
1. 執行 `npm version patch --no-git-tag-version`（遞增 patch 版號，不建 git tag）
2. 執行 `npm install --package-lock-only`（同步更新 `package-lock.json`）

## 發佈前檢查清單

- [ ] `npm run build` 編譯通過，無型別錯誤
- [ ] `npm run start` 本機執行正常
- [ ] `CHANGELOG.md` 已更新本次變更說明
- [ ] `README.md` 有反映新功能或行為變更
- [ ] `package.json` 版號已遞增
