---
name: bump-and-release
description: Provide a release workflow for this repository, including bumping patch version, publishing to npm via CI workflow by default, and creating GitHub releases in the repository's existing format.
---

# Bump and Release

## 觸發情境
- 需要為 `@willh/git-setup` 進行 `patch` 版號更新與發佈。
- 需要完成版本 bump、提交、標籤、GitHub release。
- 需要透過 `master` 分支推送自動觸發 `Publish to NPM` 工作流程。
- 需要產生 `v<版本>` release note 並維持目前既有欄位順序。

## 前置條件
- 在 repo 根目錄，並確認 `git rev-parse --show-toplevel`
- 工作目錄乾淨：`git status --short`
- `git`、`gh` 可用並已認證：`gh auth status`
- 發佈目標為 `master` 或啟用工作流程可推送的主要分支

## 快速流程

1. 版號 bump（預設 patch）
   ```sh
   npm run bump
   ```

2. 取得版本與 commit 基本資訊
   ```sh
   NEW_VERSION=$(node -p "require('./package.json').version")
   RELEASE_BRANCH=$(git rev-parse --abbrev-ref HEAD)
   RELEASE_DATE=$(date +%Y-%m-%d)
   ```

3. 建立版本提交
   ```sh
   git add package.json package-lock.json
   git commit -m "chore(release): bump patch version to ${NEW_VERSION}"
   RELEASE_COMMIT=$(git rev-parse HEAD)
   RELEASE_MESSAGE=$(git log -1 --pretty=%s)
   ```

4. 建立版本標籤
   ```sh
   git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
   ```

5. 觸發 CI 發佈（預設）
   ```sh
   git push origin "${RELEASE_BRANCH}" --follow-tags
   ```
   這會觸發 `.github/workflows/publish.yml`：
   `push` 到 `master` 且 `package.json` 版本變更時，自動執行 `npm publish`
   如需立即執行且目前流程未自動啟動，補執行 `gh workflow run "Publish to NPM" --ref "$RELEASE_BRANCH"`

6. 等候 CI 發佈結果，且必須確認成功
   ```sh
   PUBLISH_RUN_ID=$(gh run list --workflow "Publish to NPM" --branch "$RELEASE_BRANCH" --limit 1 --json databaseId,startedAt -q '.[0].databaseId')
   gh run watch "$PUBLISH_RUN_ID"
   if [ "$(gh run view "$PUBLISH_RUN_ID" --json conclusion -q .conclusion)" != "success" ]; then
     echo "Publish workflow failed, aborting release step."
     exit 1
   fi
   npm view "@willh/git-setup@${NEW_VERSION}" version
   ```

7. 建立 release note 內容（維持舊版式）
   ```sh
   NOTES_FILE=$(mktemp -t git-setup-release-notes.XXXXXX)
   CHANGES=$(awk -v v="## ${NEW_VERSION}" '
     $0 == v {found=1; next}
     found && /^## / {exit}
     found {print}
   ' CHANGELOG.md)

   cat > "$NOTES_FILE" <<"EOF_NOTES"
## v${NEW_VERSION}

### 版本對應
- Commit: `${RELEASE_COMMIT}`
- 日期: ${RELEASE_DATE}
- Commit 訊息: ${RELEASE_MESSAGE}

### 變更重點
${CHANGES}

### 對應 npm 版本
- npm 套件版本: [${NEW_VERSION}](https://www.npmjs.com/package/%40willh%2Fgit-setup/v/${NEW_VERSION})
  （必須是超連結格式）
EOF_NOTES
   ```

8. 建立並發佈 GitHub release
   ```sh
   gh release create "v${NEW_VERSION}" --title "v${NEW_VERSION}" --notes-file "$NOTES_FILE" --target "$RELEASE_BRANCH"
   ```

9. 驗證
   - 檢查 `gh release view "v${NEW_VERSION}" --json name,tagName,body`
   - 確認 npm 套件頁面有對應版本

## 核心注意事項
- `npm run bump` 僅更新 `package.json` 與 `package-lock.json`，不會自動發布。
- `prepublishOnly` 已設為 `npm run build`，CI publish 流程會間接執行建置。
- `CHANGELOG.md` 該版本段落需先補齊，才能正確生成 release note。
- 只要 CI 已在流程中啟動，必須等 `Publish to NPM` 成功後才建立 release。
- 僅在需要本機緊急發佈時，才直接改用 `npm publish --provenance --access public`，其餘情境請保留 CI 預設。
