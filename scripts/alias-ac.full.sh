#!/usr/bin/env sh

# 自動生成符合 Conventional Commits 1.0.0 的 commit 訊息
# 流程原則：先確認環境、再整理要分析的檔案，最後交給 aichat 產出訊息並 commit。

# 1) 若不是 git 工作目錄，直接離開
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    exit 0
fi

# 2) 若無 aichat 命令，直接離開
if ! command -v aichat >/dev/null 2>&1; then
    exit 0
fi

# 3) 讓有未暫存變更或未追蹤檔案時先暫存
if git diff --cached --quiet; then
    # staged 無變更時，進一步判斷工作目錄是否真的有變更
    if git diff --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
        exit 0
    fi
    git add -A
fi

# 4) 收集刪除、排除、排除類別檔案清單，用於輸出診斷資訊
deleted=$(git diff --cached --diff-filter=D --name-status | awk '{print $2}')
minified=$(git diff --cached --diff-filter=d --name-only | grep -E '\.(min\\.js|min\\.css|min\\..+\\.js|min\\..+\\.css|-min\\.js|-min\\.css|bundle\\.js|bundle\\.min\\.js)$' || true)
lockfiles=$(git diff --cached --diff-filter=d --name-only | grep -E '(package-lock\\.json|yarn\\.lock|pnpm-lock\\.yaml|bun\\.lockb|Bun\\.lock|Gemfile\\.lock|Cargo\\.lock|composer\\.lock|Podfile\\.lock|poetry\\.lock|Pipfile\\.lock|packages\\.lock\\.json|pubspec\\.lock|mix\\.lock|go\\.sum)$' || true)
if [ -n "$deleted" ]; then
    echo "已排除刪除的檔案:"
    echo "$deleted" | sed 's/^/  D /'
    echo ""
fi
if [ -n "$minified" ]; then
    echo "已排除壓縮檔案:"
    echo "$minified" | sed 's/^/  M /'
    echo ""
fi
if [ -n "$lockfiles" ]; then
    echo "已排除 lock 檔案:"
    echo "$lockfiles" | sed 's/^/  L /'
    echo ""
fi

# 5) 收集會進入 AI 分析範圍的檔案（不含刪除）
included=$(git diff --cached --diff-filter=d --name-status ':(exclude)*.min.js' ':(exclude)*.min.css' ':(exclude)*.min.*.js' ':(exclude)*.min.*.css' ':(exclude)*-min.js' ':(exclude)*-min.css' ':(exclude)*.bundle.js' ':(exclude)*.bundle.min.js' ':(exclude)package-lock.json' ':(exclude)yarn.lock' ':(exclude)pnpm-lock.yaml' ':(exclude)bun.lockb' ':(exclude)Bun.lock' ':(exclude)Gemfile.lock' ':(exclude)Cargo.lock' ':(exclude)composer.lock' ':(exclude)Podfile.lock' ':(exclude)poetry.lock' ':(exclude)Pipfile.lock' ':(exclude)packages.lock.json' ':(exclude)pubspec.lock' ':(exclude)mix.lock' ':(exclude)go.sum' | awk '{printf "%s %s\\n", $1, $2}')
if [ -n "$included" ]; then
    echo "納入 AI 分析的檔案:"
    echo "$included" | sed 's/^A /  新增: /' | sed 's/^M /  修改: /' | sed 's/^R[0-9]* /  重新命名: /'
    echo ""
fi

# 6) 整理 prompt：排除檔名清單 + diff 內文
excluded_sections=""
if [ -n "$deleted" ]; then
    deleted_lines=$(printf "%s\\n" "$deleted" | sed 's/^/  /')
    if [ -z "$excluded_sections" ]; then
        excluded_sections=$(printf "%s\\n%s" "刪除的檔案（僅列檔名/路徑）:" "$deleted_lines")
    else
        excluded_sections=$(printf "%s\\n\\n%s\\n%s" "$excluded_sections" "刪除的檔案（僅列檔名/路徑）:" "$deleted_lines")
    fi
fi
if [ -n "$minified" ]; then
    minified_lines=$(printf "%s\\n" "$minified" | sed 's/^/  /')
    if [ -z "$excluded_sections" ]; then
        excluded_sections=$(printf "%s\\n%s" "壓縮檔案（僅列檔名/路徑）:" "$minified_lines")
    else
        excluded_sections=$(printf "%s\\n\\n%s\\n%s" "$excluded_sections" "壓縮檔案（僅列檔名/路徑）:" "$minified_lines")
    fi
fi
if [ -n "$lockfiles" ]; then
    lock_lines=$(printf "%s\\n" "$lockfiles" | sed 's/^/  /')
    if [ -z "$excluded_sections" ]; then
        excluded_sections=$(printf "%s\\n%s" "lock 檔案（僅列檔名/路徑）:" "$lock_lines")
    else
        excluded_sections=$(printf "%s\\n\\n%s\\n%s" "$excluded_sections" "lock 檔案（僅列檔名/路徑）:" "$lock_lines")
    fi
fi

diff=$(git diff --cached --diff-filter=d --ignore-all-space ':(exclude)*.min.js' ':(exclude)*.min.css' ':(exclude)*.min.*.js' ':(exclude)*.min.*.css' ':(exclude)*-min.js' ':(exclude)*-min.css' ':(exclude)*.bundle.js' ':(exclude)*.bundle.min.js' ':(exclude)package-lock.json' ':(exclude)yarn.lock' ':(exclude)pnpm-lock.yaml' ':(exclude)bun.lockb' ':(exclude)Bun.lock' ':(exclude)Gemfile.lock' ':(exclude)Cargo.lock' ':(exclude)composer.lock' ':(exclude)Podfile.lock' ':(exclude)poetry.lock' ':(exclude)Pipfile.lock' ':(exclude)packages.lock.json' ':(exclude)pubspec.lock' ':(exclude)mix.lock' ':(exclude)go.sum')
if [ -z "$diff" ] && [ -z "$excluded_sections" ]; then
    echo "沒有可分析的變更內容（可能全部為二進位檔案或已排除的檔案）"
    exit 0
fi

if [ -n "$excluded_sections" ]; then
    prompt=$(printf "%s\\n%s\\n\\n%s" "以下為排除檔案（僅列檔名/路徑，不含內容）:" "$excluded_sections" "$diff")
else
    prompt="$diff"
fi

# 7) 產生 commit 訊息並提交
#    當 diff 過大時改採用檔名+統計資訊的精簡策略，保證仍可順利 commit
char_count=$(printf "%s" "$prompt" | wc -c)
if [ "$char_count" -gt 150000 ]; then
    echo "變更內容過大（超過 150,000 字元），改用精簡上下文策略產生 commit 訊息。"
    compact_stat=$(git diff --cached --diff-filter=d --ignore-all-space --stat -- ':(exclude)*.min.js' ':(exclude)*.min.css' ':(exclude)*.min.*.js' ':(exclude)*.min.*.css' ':(exclude)*-min.js' ':(exclude)*-min.css' ':(exclude)*.bundle.js' ':(exclude)*.bundle.min.js' ':(exclude)package-lock.json' ':(exclude)yarn.lock' ':(exclude)pnpm-lock.yaml' ':(exclude)bun.lockb' ':(exclude)Bun.lock' ':(exclude)Gemfile.lock' ':(exclude)Cargo.lock' ':(exclude)composer.lock' ':(exclude)Podfile.lock' ':(exclude)poetry.lock' ':(exclude)Pipfile.lock' ':(exclude)packages.lock.json' ':(exclude)pubspec.lock' ':(exclude)mix.lock' ':(exclude)go.sum')

    compact_scope=$(git diff --cached --name-only --diff-filter=d --ignore-all-space ':(exclude)*.min.js' ':(exclude)*.min.css' ':(exclude)*.min.*.js' ':(exclude)*.min.*.css' ':(exclude)*-min.js' ':(exclude)*-min.css' ':(exclude)*.bundle.js' ':(exclude)*.bundle.min.js' ':(exclude)package-lock.json' ':(exclude)yarn.lock' ':(exclude)pnpm-lock.yaml' ':(exclude)bun.lockb' ':(exclude)Bun.lock' ':(exclude)Gemfile.lock' ':(exclude)Cargo.lock' ':(exclude)composer.lock' ':(exclude)Podfile.lock' ':(exclude)poetry.lock' ':(exclude)Pipfile.lock' ':(exclude)packages.lock.json' ':(exclude)pubspec.lock' ':(exclude)mix.lock' ':(exclude)go.sum')

    compact_scope=$(printf "分析檔案:\\n%s" "$compact_scope")
    if [ -n "$compact_stat" ]; then
        prompt=$(printf "精簡模式輸入\\n%s\\n\\n統計:\\n%s" "$compact_scope" "$compact_stat")
    else
        prompt="$compact_scope"
    fi
fi

msg=$(printf "%s" "$prompt" | aichat "依據 diff 產生高解析度、技術導向、精準且簡潔的繁體中文 Git commit 訊息。採用 Conventional Commits 1.0.0 格式撰寫。不得包含多餘語句，只輸出 commit title 與必要的 body。")
git commit -m "$msg" && git --no-pager log -1
