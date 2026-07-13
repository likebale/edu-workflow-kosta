---
name: prepare-pr
description: PR 준비 자동화 (git diff 분석 → Conventional Commits 커밋 → PR 생성 → 리뷰 요청)
when_to_use: |
  "PR을 준비해 줘", "커밋하고 PR 만들어 줘", "변경 사항을 PR로 만들어 줘", 
  "지금까지 한 작업을 PR로 올려 줘", "커밋 메시지 작성하고 푸시해 줘"
---

# Prepare PR Skill

**목적**: 로컬 변경 사항을 분석하여 논리적 커밋 단위로 묶고, Conventional Commits 규약을 따르는 커밋 메시지를 작성하고, GitHub에 PR을 생성합니다.

**핵심 원칙**: 
- **하나의 PR = 하나의 주제** (관계없는 변경 방지)
- **Conventional Commits 1.0** 규약 준수
- **.claude/rules/git-workflow.md** 규칙 완전 준수
- **npm test 통과** 필수
- **금지 파일 검사** (.env, node_modules 등)

---

## 입력

```
선택적 옵션:
  --analyze-only      Step 1-3까지만 (분석만, 커밋 안 함)
  --draft             PR을 Draft로 생성
  --no-push           로컬 커밋만 (푸시 안 함)
  --issue N           PR에서 이슈 #N 링크 (예: --issue 123)
  --reviewer @user    코드리뷰 요청 (예: --reviewer @alice @bob)
```

---

## 작업 절차 (14단계)

### Step 1️⃣: 변경 분석 (git diff)

**목표**: 현재 브랜치의 모든 변경을 파악합니다.

**작업**:
```bash
git status                          # 브랜치명, 추적 상태 확인
git diff HEAD -- ':(exclude)node_modules' ':(exclude).env*'  # 변경 내용 (금지 파일 제외)
git diff --cached                   # 스테이징된 파일
git diff --name-only               # 변경된 파일 목록
```

**분석 내용**:
- [ ] 현재 브랜치명은? (main/develop 아님?)
- [ ] 몇 개 파일이 변경되었는가?
- [ ] 변경 파일 목록: routes, controllers, services, tests, docs, 기타?
- [ ] 금지 파일이 섞여 있지 않은가? (.env, node_modules, credentials, *.pem)
- [ ] 코드만 변경된 건가, 문서도 포함된 건가?

**결과**:
```json
{
  "branch": "feat/new-endpoint",
  "changed_files": [
    "routes/taskRoutes.js",
    "controllers/taskController.js",
    "services/taskService.js",
    "tests/taskController.test.js",
    "CLAUDE.md"
  ],
  "total_additions": 156,
  "total_deletions": 12,
  "has_forbidden_files": false
}
```

---

### Step 2️⃣: 논리적 커밋 단위 분류

**목표**: 변경을 **논리적으로 독립적인 단위**로 묶습니다.

**원칙** (`.claude/rules/git-workflow.md`):
- 하나의 커밋 = 하나의 논리적 변경
- 코드 + 테스트 + 문서 = **같은 커밋** (관련 변경)
- 기능 A + 기능 B = **다른 커밋** (독립적)
- 버그 수정 + 리팩터링 = **다른 커밋** (용도 다름)

**작업**:
```bash
# 파일별 변경 내용 세분화
git diff --unified=1 <file>        # 각 파일의 변경 라인 확인
```

**분류 예시**:
```
변경 파일:
├─ routes/taskRoutes.js         ┐
├─ controllers/taskController.js│ → Commit 1: feat(api)
├─ services/taskService.js      │
├─ tests/taskController.test.js │
└─ CLAUDE.md                    ┘

└─ .eslintrc.json               → Commit 2: chore(lint)
```

**결과**:
```json
{
  "commit_groups": [
    {
      "group_id": 1,
      "type": "feat",
      "scope": "api",
      "title_draft": "POST /api/tasks/bulk 엔드포인트 추가",
      "files": [
        "routes/taskRoutes.js",
        "controllers/taskController.js",
        "services/taskService.js",
        "tests/taskController.test.js",
        "CLAUDE.md"
      ],
      "lines_added": 156,
      "lines_deleted": 0
    },
    {
      "group_id": 2,
      "type": "chore",
      "scope": "lint",
      "title_draft": "ESLint 설정 업데이트",
      "files": [".eslintrc.json"],
      "lines_added": 5,
      "lines_deleted": 3
    }
  ]
}
```

---

### Step 3️⃣: Conventional Commits 메시지 초안 작성

**목표**: 각 커밋 그룹에 대해 Conventional Commits 규약을 따르는 메시지를 작성합니다.

**규약** (`.claude/rules/git-workflow.md`):
```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

**Type 선택**:
- `feat`: 새 기능
- `fix`: 버그 수정
- `test`: 테스트만 추가
- `docs`: 문서만 변경
- `refactor`: 기능 유지, 코드 재구성
- `chore`: 의존성, 빌드, 설정
- `style`: 포맷팅, 세미콜론 (기능 변화 없음)
- `ci`: CI/CD 설정

**Description 규칙**:
- 명령형 현재시제 ("추가" O, "추가했음" X)
- 첫 글자 소문자
- 마침포 없음
- 50자 이하

**Body (선택)**: 왜 이 변경이 필요한가? (3~5문장)

**Footer (선택)**: 관련 이슈 (`Closes #123`)

**작업** (AI가 생성):
```
Commit 1:
  Type: feat
  Scope: api
  Description: POST /api/tasks/bulk 엔드포인트 추가
  Body:
    여러 태스크를 한 번에 생성할 수 있습니다.
    배열 검증은 Controller에서 수행되고,
    개별 생성은 Service에서 처리됩니다.
  Footer: Closes #45

Commit 2:
  Type: chore
  Scope: lint
  Description: ESLint 설정 업데이트
  Body: 없음
  Footer: 없음
```

**결과**:
```json
{
  "commits": [
    {
      "group_id": 1,
      "message": "feat(api): POST /api/tasks/bulk 엔드포인트 추가\n\n여러 태스크를 한 번에 생성할 수 있습니다.\n배열 검증은 Controller에서 수행되고,\n개별 생성은 Service에서 처리됩니다.\n\nCloses #45",
      "files": [...]
    },
    {
      "group_id": 2,
      "message": "chore(lint): ESLint 설정 업데이트",
      "files": [...]
    }
  ]
}
```

---

### Step 4️⃣: 사용자 확인 (메시지 검토)

**목표**: AI가 생성한 커밋 메시지를 사용자가 검토합니다.

**사용자 선택**:
- ✅ 승인: 메시지 그대로 진행
- 🔧 수정: 메시지 일부 수정 (AI 재생성 또는 수동 입력)
- ❌ 취소: 준비 중단

**예시**:
```
제안된 Commit 1 메시지:
feat(api): POST /api/tasks/bulk 엔드포인트 추가

여러 태스크를 한 번에 생성할 수 있습니다.
배열 검증은 Controller에서 수행되고,
개별 생성은 Service에서 처리됩니다.

Closes #45

[✅ 승인] [🔧 수정] [❌ 취소]
```

---

### Step 5️⃣: 테스트 실행

**목표**: 커밋 전에 모든 테스트가 통과하는지 확인합니다.

**작업**:
```bash
npm test 2>&1                       # 전체 테스트 실행, 출력 캡처
echo $?                             # 종료 코드 확인 (0 = 성공)
```

**검사**:
- [ ] 모든 테스트 통과? (X/X 성공)
- [ ] 새로 추가된 테스트도 통과?
- [ ] 기존 테스트 깨지지 않음? (회귀 확인)

**실패 시**:
```
❌ npm test 실패 (28/39 실패)

실패 원인:
- tests/taskController.test.js: POST /api/tasks/bulk (3개 실패)
- tests/taskService.test.js: bulkCreate() (1개 실패)

조치:
1. 코드 수정
2. npm test 재실행
3. 통과 후 Step 6으로 진행
```

**결과**:
```json
{
  "test_passed": true,
  "test_count": "39/39",
  "duration_ms": 2145,
  "coverage_report": {
    "services/taskService.js": "92%",
    "controllers/taskController.js": "85%"
  }
}
```

---

### Step 6️⃣: 금지 파일 최종 검사

**목표**: 커밋 전에 절대 금지 파일이 없는지 확인합니다.

**작업**:
```bash
git diff --cached --name-only | grep -E '(\.env|\.env\.|node_modules|\.pem|credentials|\.aws|\.ssh)' && echo "❌ 금지 파일 감지됨" || echo "✅ 안전"
```

**금지 파일** (`.claude/rules/git-workflow.md`):
- `.env`, `.env.local`, `.env.*.local` (환경 변수)
- `node_modules/` (의존성)
- `credentials.json`, `secrets.json` (민감 정보)
- `*.pem` (인증서)
- `.aws/`, `.ssh/` (자격증명)
- `dist/`, `build/`, `out/` (빌드 산출물)

**결과**:
```json
{
  "forbidden_files_found": false,
  "status": "✅ 안전 (커밋 가능)"
}
```

---

### Step 7️⃣: 스테이징 (git add)

**목표**: Commit 1 그룹의 파일을 스테이징합니다.

**작업**:
```bash
# 파일 명시적 지정 (와일드카드 사용 안 함)
git add routes/taskRoutes.js controllers/taskController.js services/taskService.js tests/taskController.test.js CLAUDE.md

# 스테이징 확인
git diff --cached --name-only
```

**검사**:
- [ ] 의도한 파일만 스테이징됨?
- [ ] 다른 파일은 섞여 있지 않음?

**결과**:
```json
{
  "staged_files": [
    "routes/taskRoutes.js",
    "controllers/taskController.js",
    "services/taskService.js",
    "tests/taskController.test.js",
    "CLAUDE.md"
  ],
  "staged_lines": 156
}
```

---

### Step 8️⃣: 커밋 (git commit)

**목표**: Conventional Commits 메시지로 커밋합니다.

**작업**:
```bash
git commit -m "feat(api): POST /api/tasks/bulk 엔드포인트 추가

여러 태스크를 한 번에 생성할 수 있습니다.
배열 검증은 Controller에서 수행되고,
개별 생성은 Service에서 처리됩니다.

Closes #45"
```

**확인**:
```bash
git log -1 --oneline              # 방금 만든 커밋 확인
```

**결과**:
```json
{
  "commit_created": true,
  "commit_hash": "abc1234",
  "commit_message": "feat(api): POST /api/tasks/bulk 엔드포인트 추가",
  "timestamp": "2026-07-13 14:30:45"
}
```

---

### Step 9️⃣: 다음 커밋 반복 (Step 7-8)

**목표**: Commit 2, 3, ... 이 있으면 반복합니다.

**작업**:
```bash
# Commit 2 파일 스테이징
git add .eslintrc.json

# Commit 2 커밋
git commit -m "chore(lint): ESLint 설정 업데이트"
```

**반복 조건**:
- commit_groups 배열에 아직 처리 안 된 커밋이 있음 → 반복
- 모두 완료 → Step 10으로 진행

---

### Step 🔟: 원격 브랜치 생성 (git push)

**목표**: 로컬 커밋을 원격 저장소에 푸시합니다.

**현재 브랜치 확인**:
```bash
git branch --show-current          # 현재 브랜치명 (예: feat/bulk-create)
git log --oneline -3               # 최근 3개 커밋 확인
```

**작업**:
```bash
# 첫 푸시 (원격 브랜치 없을 때): -u 플래그 사용
git push -u origin feat/bulk-create

# 또는 이미 원격 브랜치 있을 때:
git push origin feat/bulk-create
```

**확인**:
```bash
git log origin/main..HEAD --oneline  # 원격 main과의 차이 확인
```

**결과**:
```json
{
  "push_successful": true,
  "branch": "feat/bulk-create",
  "remote": "origin",
  "commits_pushed": 2,
  "commits": [
    "abc1234 feat(api): POST /api/tasks/bulk 엔드포인트 추가",
    "def5678 chore(lint): ESLint 설정 업데이트"
  ]
}
```

---

### Step 1️⃣1️⃣: PR 본문 작성

**목표**: GitHub PR 템플릿에 따라 본문을 작성합니다.

**PR 템플릿** (`.github/pull_request_template.md` 준수):

```markdown
## 📋 변경 요약

<!-- 3~5문장으로 무엇을 했는지 설명 -->

## 🔍 상세 설명

### 변경 사항
- 추가된 기능
- 수정된 버그
- 리팩터링된 부분

### 왜 이렇게 했는가?
- 문제 정의
- 선택한 솔루션

## ✅ 테스트 결과

- [x] npm test 통과 (39/39)
- [x] npm start 수동 테스트 완료
  - [x] 정상 경로
  - [x] 실패 경로

## 📚 문서 변경

- [x] CLAUDE.md 업데이트
- [x] 테스트 추가
- [ ] README 갱신 (필요 없음)

## 🔗 관련 이슈

Closes #45
```

**AI가 생성**:
- Commit 메시지들을 종합하여 변경 요약 작성
- 파일 목록 기반으로 영향 범위 설명
- 테스트 결과 수치 포함
- 관련 이슈 자동 추출

**결과**:
```json
{
  "pr_title": "feat(api): POST /api/tasks/bulk 엔드포인트 추가",
  "pr_body": "## 📋 변경 요약\n여러 태스크를 한 번에 생성하는 POST /api/tasks/bulk 엔드포인트를 추가했습니다...",
  "related_issues": ["#45"]
}
```

---

### Step 1️⃣2️⃣: GitHub PR 생성 (gh pr create)

**목표**: GitHub에 PR을 생성합니다.

**작업**:
```bash
gh pr create \
  --title "feat(api): POST /api/tasks/bulk 엔드포인트 추가" \
  --body "$(cat <<'EOF'
## 📋 변경 요약

여러 태스크를 한 번에 생성하는 POST /api/tasks/bulk 엔드포인트를 추가했습니다.
배열 검증은 Controller에서, 개별 생성은 Service에서 처리합니다.

## ✅ 테스트 결과

- [x] npm test 통과 (39/39)
- [x] 수동 테스트: 유효한 배열 → 201, 빈 배열 → 400 확인

## 📚 문서 변경

- [x] CLAUDE.md REST API 표 업데이트
- [x] tests/ 테스트 추가

## 🔗 관련 이슈

Closes #45
EOF
)" \
  --draft                          # 옵션: Draft로 생성
```

**옵션**:
- `--draft`: Draft PR로 생성 (병합 금지 표시)
- `--reviewer @alice`: 코드리뷰 요청
- `--issue 45`: 이슈 연결

**확인**:
```bash
gh pr list --state open            # 생성된 PR 확인
```

**결과**:
```json
{
  "pr_created": true,
  "pr_number": 12,
  "pr_url": "https://github.com/user/taskflow/pull/12",
  "pr_title": "feat(api): POST /api/tasks/bulk 엔드포인트 추가",
  "pr_state": "OPEN",
  "is_draft": false,
  "commits_in_pr": 2,
  "related_issues": ["#45"]
}
```

---

### Step 1️⃣3️⃣: 코드리뷰 요청

**목표**: 관련 팀원에게 코드리뷰를 요청합니다.

**작업** (선택, --reviewer 지정한 경우):
```bash
# Step 12에서 이미 --reviewer로 지정했으면 자동
# 또는 수동으로:
gh pr edit <PR_NUMBER> --add-reviewer @alice @bob
```

**안내 메시지**:
```
✅ PR #12 생성됨

제목: feat(api): POST /api/tasks/bulk 엔드포인트 추가
URL: https://github.com/user/taskflow/pull/12

변경 요약:
- 2개 커밋
- 5개 파일 변경
- 156줄 추가, 0줄 제거

테스트 결과: 39/39 통과 ✅

다음 단계:
1. 코드리뷰 대기 중
2. CI/CD 검사 통과 확인
3. 리뷰어 승인 후 병합
```

**결과**:
```json
{
  "review_requested": true,
  "reviewers": ["@alice", "@bob"],
  "notification_sent": true
}
```

---

### Step 1️⃣4️⃣: 완료 검증 & 리뷰 대기 안내

**목표**: PR 준비 완료를 확인하고 리뷰 대기 상태를 안내합니다.

**최종 체크리스트**:
```
✅ Step 1: git diff 분석
✅ Step 2: 논리적 커밋 단위 분류
✅ Step 3: Conventional Commits 메시지 초안
✅ Step 4: 사용자 확인
✅ Step 5: npm test 통과 (39/39)
✅ Step 6: 금지 파일 검사 (안전)
✅ Step 7-8: 커밋 생성 (2개)
✅ Step 9: 원격 브랜치 푸시
✅ Step 10: PR 본문 작성
✅ Step 11: GitHub PR 생성
✅ Step 12: 코드리뷰 요청
✅ Step 13: 완료 안내
```

**최종 보고**:
```markdown
## 🎉 PR 준비 완료

### 생성된 PR
- **번호**: #12
- **제목**: feat(api): POST /api/tasks/bulk 엔드포인트 추가
- **URL**: https://github.com/user/taskflow/pull/12

### 커밋 정보
- **커밋 수**: 2개
- **Conventional Commits**: ✅ 준수
  1. feat(api): POST /api/tasks/bulk 엔드포인트 추가
  2. chore(lint): ESLint 설정 업데이트

### 테스트 결과
- **npm test**: ✅ 39/39 통과
- **커버리지**: Service 92%, Controller 85%
- **금지 파일**: ✅ 없음

### 문서 동기화
- ✅ CLAUDE.md REST API 표 업데이트
- ✅ 테스트 추가
- ✅ 코드 주석 (JSDoc)

### 다음 단계
1. ⏳ 코드리뷰 대기 중 (요청자: @alice, @bob)
2. 💬 리뷰어 피드백 확인
3. 🔧 필요시 수정 후 재커밋
4. ✅ 승인 후 병합

### git-workflow 규약 준수 확인
- ✅ 커밋 단위: 논리적 일관성 O
- ✅ 메시지: Conventional Commits 1.0 O
- ✅ 금지 파일: 없음 O
- ✅ 테스트: 통과 O
- ✅ PR 본문: 템플릿 준수 O
```

**결과**:
```json
{
  "status": "✅ 완료",
  "pr_number": 12,
  "pr_url": "https://github.com/user/taskflow/pull/12",
  "commits_total": 2,
  "test_passed": true,
  "review_requested": true,
  "git_workflow_compliant": true
}
```

---

## 흐름도

```
Step 1: git diff 분석
        ↓
Step 2: 논리적 커밋 분류
        ↓
Step 3: Conventional Commits 메시지 초안
        ↓
Step 4: 사용자 확인 ← [수정 필요 시 Step 3으로 돌아감]
        ↓
Step 5: npm test 실행 ← [실패 시 코드 수정 후 다시]
        ↓
Step 6: 금지 파일 검사
        ↓
Step 7-8: 커밋 (Commit 1) + 반복 (Commit 2, 3, ...)
        ↓
Step 9: 원격 브랜치 푸시
        ↓
Step 10: PR 본문 작성
        ↓
Step 11: GitHub PR 생성
        ↓
Step 12: 코드리뷰 요청
        ↓
Step 13: 완료 안내
```

---

## 옵션 플래그

| 플래그 | 효과 | 예시 |
|--------|------|------|
| `--analyze-only` | Step 1-3까지만 실행 (커밋 안 함) | `prepare-pr --analyze-only` |
| `--draft` | PR을 Draft 상태로 생성 | `prepare-pr --draft` |
| `--no-push` | 로컬 커밋만 생성, 푸시 안 함 | `prepare-pr --no-push` |
| `--issue N` | 이슈 #N을 PR에 연결 | `prepare-pr --issue 45` |
| `--reviewer @user` | 코드리뷰 요청 (다중) | `prepare-pr --reviewer @alice @bob` |

---

## 종료 기준 (체크리스트)

### 필수 조건 (AND)
```
✅ npm test 모두 통과 (X/X)
AND
✅ 금지 파일 없음 (.env, node_modules 등)
AND
✅ Conventional Commits 규약 준수
AND
✅ PR 템플릿 작성 완료
AND
✅ GitHub PR 생성 완료
AND
✅ 코드리뷰 요청 완료
```

### 선택 조건 (OR)
```
✅ Draft로 생성했거나
✅ 리뷰어를 지정했거나
✅ 관련 이슈를 연결했거나
```

---

## 참고

**관련 규칙**:
- `.claude/rules/git-workflow.md` — 커밋 단위, Conventional Commits, PR 규칙
- `CLAUDE.md` — 아키텍처, 불변식
- `.github/pull_request_template.md` — PR 템플릿

**외부 참고**:
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)
- [GitHub CLI: gh pr create](https://cli.github.com/manual/gh_pr_create)

---

**스킬 버전**: 1.0  
**최종 업데이트**: 2026-07-13  
**상태**: 활성화
