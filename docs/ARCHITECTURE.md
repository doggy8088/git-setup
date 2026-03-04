# 架構與模組說明

本文件說明 `@willh/git-setup` CLI 工具的 TypeScript 原始碼架構，供日後維護參考。

## 目錄結構

```
bin/
├── index.ts          # CLI 進入點：參數解析、互動式問答、Git config 設定
├── index.js          # tsc 編譯產出（勿手動修改）
└── aliases/
    ├── ac.ts         # alias.ac / alias.undo 的 shell script 產生器
    └── ac.js         # tsc 編譯產出
tsconfig.json         # TypeScript 編譯設定
package.json          # npm 套件定義與 scripts
```

## 模組職責

### `bin/index.ts`（主程式）

- 解析 CLI 參數（`--name`、`--email`、`-i`、`-h`、`-v`）
- 互動式詢問 `user.name` / `user.email`（含預設值回填）
- 依序執行 `git config --global` 指令設定所有 Git 組態與 alias
- 處理跨平台差異（Windows vs. Linux/macOS 的 shell 引號規則）
- 設定 `LC_ALL` / `LANG` 環境變數（Windows 使用 `SETX`）

**關鍵函式：**

| 函式 | 說明 |
|------|------|
| `main()` | 非同步 IIFE，串接所有設定流程 |
| `cmd(command)` | 執行 shell 指令並印出結果 |
| `cmdWithConfirm(command, interactive, ask)` | 互動模式下先詢問再執行 |
| `readKey()` | 讀取單一按鍵（用於 y/n/q 確認） |
| `buildAttributesAlias(content)` | 將 `.gitattributes` 範本轉為 `printf` 格式的 shell alias |
| `escapeForSingleQuotes(value)` | 處理 shell 單引號跳脫 |
| `validateEmail(email)` | 驗證 Email 格式 |

### `bin/aliases/ac.ts`（alias 產生器模組）

此模組負責產生 `git ac` 與 `git undo` 兩個 alias 的 shell script 字串。從主程式抽離的原因與設計詳見 [ALIAS-AC.md](./ALIAS-AC.md)。

**匯出函式：**

| 函式 | 說明 |
|------|------|
| `buildAliasAc()` | 回傳 `alias.ac` 的完整 shell function 字串 |
| `buildAliasUndo()` | 回傳 `alias.undo` 的完整 shell function 字串 |

## 跨平台處理策略

主程式透過 `os === 'win32'` 判斷平台，針對需要 shell function 的 alias 使用不同引號策略：

- **Windows**：使用雙引號包裹，內部雙引號以 `\"` 跳脫
- **Linux/macOS**：使用 `'!'"..."` 的組合引號模式，避免 `!` 在 bash 中觸發 history expansion

## 資料流

```
CLI 參數 / 互動輸入
        │
        ▼
  main() 解析參數
        │
        ▼
  依序呼叫 cmd() / cmdWithConfirm()
        │
        ├── 基本 config (autocorrect, defaultBranch, ...)
        ├── 簡單 alias (ci, co, st, ...)
        ├── buildAttributesAlias() → alias.attributes
        ├── buildAliasAc()         → alias.ac
        ├── buildAliasUndo()       → alias.undo
        └── 平台相關 alias (ignore, iac, cc, acp, aca, tlog, editor)
        │
        ▼
  LC_ALL / LANG 環境變數設定
```
