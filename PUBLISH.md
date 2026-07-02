# 發行 npm 套件筆記

## 自動發佈 (推薦)

本專案已設定 GitHub Actions 自動發佈，使用 npm 的 Trusted Publishing 機制，無需手動管理 NPM_TOKEN。

1. 變更版本

    修改 `package.json` 中的 `version` 欄位。

2. 推送到 master 分支

    ```sh
    git add package.json
    git commit -m "chore: bump version to x.x.x"
    git push origin master
    ```

3. `npm publish` 會先跑 `prepublishOnly`，即執行 `npm run build`（建置 `dist/alias-ac.min.sh`）。

4. GitHub Actions 會自動執行發佈流程

## 手動發佈

如需手動發佈套件：

```sh
npm publish --provenance --access public
```

**注意**：手動發佈需要先透過 `npm login` 登入 npm 帳號。
