# alias.ac 模組化說明

## 背景

`alias.ac`（AI Commit）是本工具中最複雜的 Git alias，其 shell script 包含檔案篩選、差異分析、AI 呼叫等多段邏輯。隨著功能演進（排除規則、字元數限制、排除區段組合），原本內嵌在 `index.ts` 中的字串拼接已難以維護，因此將其抽離至獨立模組 `bin/aliases/ac.ts`。

## 模組設計

### 檔案位置

```
bin/aliases/ac.ts
```

### 常數定義

| 常數 | 用途 |
|------|------|
| `MINIFIED_FILE_PATTERN` | 正規表達式，比對壓縮檔案（`.min.js`、`.bundle.js` 等） |
| `LOCKFILE_PATTERN` | 正規表達式，比對 lock 檔案（`package-lock.json`、`yarn.lock` 等） |
| `EXCLUDED_DIFF_PATHS` | 字串陣列，列出所有需從 `git diff` 排除的路徑 |

將排除規則集中在常數中的好處：
- 新增排除項目只需修改陣列，不需觸碰 shell script 邏輯
- `EXCLUDED_DIFF_PATHS` 同時用於產生 `:(exclude)` pathspec

### 內部輔助函式

| 函式 | 說明 |
|------|------|
| `buildExcludedPathspecs()` | 將 `EXCLUDED_DIFF_PATHS` 轉為 `':(exclude)...'` 格式的字串 |
| `buildExcludedSectionCommand()` | 產生用於組合「排除區段」顯示文字的 shell 片段 |

### 匯出函式

#### `buildAliasAc(): string`

回傳 `alias.ac` 的完整 shell function，格式為 `!f() { ...; }; f`。

**shell script 執行流程：**

```
1. 檢查是否在 Git 工作目錄內
2. 檢查 aichat 指令是否存在
3. 若無已暫存變更，且有 unstaged/untracked 變更，執行 git add -A
4. 分類已暫存檔案：
   - deleted: 已刪除的檔案
   - minified: 壓縮檔案（比對 MINIFIED_FILE_PATTERN）
   - lockfiles: Lock 檔案（比對 LOCKFILE_PATTERN）
5. 顯示排除清單與納入分析的檔案清單
6. 取得 diff（排除壓縮/lock 檔案，忽略空白變更）
7. 組合 prompt（排除區段 + diff）
8. 檢查字元數上限（150,000）
9. 呼叫 aichat 產生 Conventional Commits 格式的繁體中文 commit 訊息
10. 執行 git commit 並顯示 log
```

#### `buildAliasUndo(): string`

回傳 `alias.undo` 的 shell function，執行 `git reset HEAD~`。

## 如何新增排除規則

**新增壓縮檔案排除：**

1. 在 `MINIFIED_FILE_PATTERN` 正規表達式中加入新 pattern
2. 在 `EXCLUDED_DIFF_PATHS` 陣列中加入對應的 glob 路徑

**新增 lock 檔案排除：**

1. 在 `LOCKFILE_PATTERN` 正規表達式中加入新 pattern
2. 在 `EXCLUDED_DIFF_PATHS` 陣列中加入對應的檔案名稱

**範例：** 新增 `Cargo.lock` 的排除（假設尚未存在）

```typescript
// LOCKFILE_PATTERN 中加入
const LOCKFILE_PATTERN = '...|Cargo\\.lock)$';

// EXCLUDED_DIFF_PATHS 中加入
const EXCLUDED_DIFF_PATHS = [
    // ...existing entries
    'Cargo.lock',
];
```

修改後執行 `npm run build` 重新編譯即可。

## 與主程式的整合

`index.ts` 透過以下方式使用此模組：

```typescript
import { buildAliasAc, buildAliasUndo } from './aliases/ac';

const aliasAc = buildAliasAc();
const aliasUndo = buildAliasUndo();

// 依平台選擇引號策略後寫入 git config
if (os === 'win32') {
    await cmd(`git config --global alias.ac "${aliasAc.replace(/"/g, '\\"')}"`);
} else {
    await cmd(`git config --global alias.ac '${escapeForSingleQuotes(aliasAc)}'`);
}
```

此模組只負責產生 shell script 字串，**不**直接執行任何 Git 指令，確保職責單一且易於測試。
