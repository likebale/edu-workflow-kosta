# Git Workflow Rules — TaskFlow

**원칙**: 깔끔한 커밋 히스토리, 추적 가능한 변경, 리뷰 가능한 PR. 커밋은 논리적 단위로, PR은 이야기를 말한다.

---

## 1. 커밋 단위 (Atomic Commits)

### 원칙

**각 커밋은 하나의 논리적 변경을 완전히 포함해야 합니다.**

```
좋은 커밋:
├─ feat: POST /api/tasks 엔드포인트 추가
│  ├─ routes/taskRoutes.js (라우트)
│  ├─ controllers/taskController.js (핸들러)
│  ├─ tests/taskController.test.js (테스트)
│  ├─ CLAUDE.md (문서)
│  └─ [모두 작동함: npm test 통과]

나쁜 커밋:
├─ WIP: 여러 기능 섞여 있음
│  ├─ feat A 반절
│  ├─ feat B 일부
│  ├─ refactor C
│  └─ [무엇을 수정했는지 불명확]
```

### 커밋 크기 기준

| 기준 | Good | Bad |
|------|------|-----|
| **라인 수** | 50~400 | 1~20 (너무 작음), 1000+ (너무 큼) |
| **변경 파일** | 1~5 | 10+ (관계없는 파일 포함) |
| **완성도** | npm test 통과 | 깨진 상태 커밋 |
| **설명** | 1~3문장 명확 | "수정", "작업 진행 중" |

### 커밋 분리 규칙

**다음 경우 항상 분리하세요:**

```
❌ 하지 말 것 (한 커밋에 섞인 상태)
feat: 새 엔드포인트 + 리팩터링 + 문서

✅ 할 것 (논리적으로 분리)
1. feat: POST /api/tasks/bulk 엔드포인트 추가
2. refactor: taskController 중복 로직 제거
3. docs: API 문서 갱신
```

**예시별 분리 기준**:

| 변경 | 분리? | 이유 |
|------|------|------|
| 기능 추가 + 테스트 | ❌ 불필요 | 논리적으로 하나 (feat 커밋에 test 포함) |
| 기능 추가 + 문서 | ❌ 불필요 | 논리적으로 하나 (feat 커밋에 docs 포함) |
| 기능 A + 기능 B | ✅ 분리 | 논리적으로 독립적 |
| 버그 수정 + 리팩터링 | ✅ 분리 | fix 커밋, refactor 커밋 분리 |
| 코드 포맷팅 + 로직 변경 | ✅ 분리 | chore (포맷), feat/fix (로직) |

### 체크리스트: 커밋 준비

```markdown
이 커밋을 하기 전에:

- [ ] 논리적으로 하나의 변경인가?
  - [ ] 기능 A가 끝나지 않았는데 기능 B도 포함되어 있지 않은가?
  - [ ] 관계없는 리팩터링이 섞여 있지 않은가?

- [ ] 완전한가?
  - [ ] npm test 통과하는가?
  - [ ] 코드만 커밋한 건 아니고 테스트도 포함했는가?
  - [ ] 문서도 동기화했는가?

- [ ] 추적 가능한가?
  - [ ] 커밋 메시지가 명확한가?
  - [ ] 6개월 뒤 git log로 봤을 때 이해할 수 있는가?
```

---

## 2. 커밋 메시지 (Conventional Commits 1.0)

### 형식

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

### Type (필수)

| Type | 사용 시 | 예시 |
|------|--------|------|
| **feat** | 새 기능 추가 | `feat: POST /api/tasks/bulk 엔드포인트 추가` |
| **fix** | 버그 수정 | `fix: GET /api/tasks 상태 필터링 안 되는 버그` |
| **test** | 테스트만 추가/수정 | `test: taskService.update() 커버리지 추가` |
| **docs** | 문서만 변경 | `docs: CLAUDE.md REST API 표 갱신` |
| **refactor** | 기능 변경 없이 재구성 | `refactor: taskController 중복 검증 로직 제거` |
| **chore** | 개발 도구, 의존성, 빌드 | `chore: Jest 버전 업그레이드 (29.7.0)` |
| **style** | 코드 스타일 (포맷팅, 세미콜론) | `style: taskService.js ESLint 경고 수정` |
| **ci** | CI/CD 설정 변경 | `ci: GitHub Actions 테스트 워크플로우 추가` |

### Scope (선택, 권장)

**변경 범위를 명시합니다** (없을 수도 있음):

```
feat(api): POST /api/tasks 엔드포인트 추가
feat(db): priority 컬럼 추가
fix(controller): title 검증 로직 버그
test(service): create() 엣지 케이스 추가
docs(readme): 빠른 시작 섹션 갱신
refactor(service): 쿼리 빌더 중복 제거
```

### Description (필수)

**규칙**:
- 명령형 현재시제 ("`added` → `add`")
- 첫 글자 소문자
- 마침표 없음
- 50자 이하

```
✅ Good
- feat: POST /api/tasks 엔드포인트 추가
- fix: taskService.update() null 체크 누락
- test: GET /api/tasks pagination 테스트 추가

❌ Bad
- feat: Added POST endpoint  (과거형, 대문자)
- feat: POST /api/tasks endpoint. (마침표)
- feat: 새 태스크 생성 엔드포인트를 추가했는데 상태 코드를 201로 반환하고 응답 본문에 ID를 포함합니다. (너무 김)
```

### Body (선택, 무엇을 하고 왜)

**여러 문단이 필요한 경우에만:**

```
feat(api): POST /api/tasks/bulk 엔드포인트 추가

여러 태스크를 한 번에 생성할 수 있습니다.
배열 검증은 Controller에서 수행되고,
각 항목 생성은 Service에서 처리됩니다.

이 변경은 대량 임포트 기능(#45)을 지원합니다.
```

### Footer (선택, 관련 이슈)

```
feat: PATCH /api/tasks/:id/assign 엔드포인트 추가

관련 이슈: #123
Breaking change: 없음
```

### 예시 모음

```
✅ Good

1. feat(api): POST /api/tasks 엔드포인트 추가
   - 기능명이 명확 (POST 엔드포인트)
   - Scope로 레이어 표시 (api)
   - 명령형 (추가)

2. fix: taskService.update() null 체크 누락
   - 버그 설명이 구체적
   - 어디서 났는지 명시 (taskService.update)

3. test(controller): POST /api/tasks 400 상태 코드 테스트
   - 테스트 타입 명시 (test)
   - 무엇을 테스트하는지 명확

4. docs: error-mapping.md 400 에러 메시지 정의
   - 문서 변경만
   - 파일명 포함

5. refactor: taskController 검증 로직 공통 함수로 추출
   - 기능 변경 없음 (refactor)
   - 개선 목표 명시 (공통 함수 추출)

6. chore: .gitignore에 .env 추가
   - 개발 도구 변경 (chore)
   - 변경 내용 구체적

❌ Bad

1. feat: 작업
   - 무엇을 했는지 불명확

2. fix: 버그 수정
   - 어떤 버그인지 명시 없음

3. feat: POST /api/tasks를 추가했고 PUT /api/tasks/:id도 수정했고 DELETE를 리팩터링했습니다.
   - 여러 논리적 변경이 섞임 (분리해야 함)
   - 길이 초과

4. FEAT: new endpoint
   - 대문자 (규약 위반)
   - 영어와 한글 섞임
```

---

## 3. 커밋 금지 파일 (Pre-Commit Check)

### 절대 금지 (민감 정보)

**다음 파일/패턴은 절대 커밋하면 안 됩니다:**

```
❌ 금지 파일
- .env (환경 변수, API 키)
- .env.local, .env.*.local
- .aws/ (AWS 자격증명)
- .ssh/ (SSH 키)
- *.pem (인증서)
- credentials.json, secrets.json
- node_modules/ (의존성)
- dist/, build/, out/ (빌드 산출물)
- .DS_Store (macOS)
- *.swp, *.swo, *~ (에디터 임시 파일)
- .vscode/settings.json (개인 설정)
```

### Pre-Commit 체크리스트

```bash
# 커밋 직전:
git status
git diff --cached

# 확인 사항:
# ✅ node_modules/ 없음?
# ✅ .env 없음?
# ✅ 의도하지 않은 파일 없음?
# ✅ 코드만 있고 생성된 파일은 없음?
```

### .gitignore 설정 (예시)

```gitignore
# 환경 변수
.env
.env.local
.env.*.local

# 의존성
node_modules/
package-lock.json

# 빌드
dist/
build/
out/

# 에디터
.vscode/settings.json
.DS_Store
*.swp
*.swo
*~

# 데이터
data/
*.db

# 로그
*.log
logs/
```

---

## 4. 풀 리퀘스트 규칙

### PR 필수 항목

각 PR은 **반드시** 다음을 포함해야 합니다:

```markdown
## 📋 변경 요약

한 문단으로 무엇을 했는지 설명 (3~5문장)

## 🔍 상세 설명

### 변경 사항
- 추가된 기능
- 수정된 버그
- 리팩터링된 부분

### 왜 이렇게 했는가?
- 문제 정의
- 선택한 솔루션
- 대안 검토 (필요시)

## ✅ 테스트 결과

- [ ] npm test 통과 (39/39)
- [ ] npm start 수동 테스트 완료
  - [ ] 정상 경로 (예: 새 엔드포인트 호출 성공)
  - [ ] 실패 경로 (예: 400 에러 반환 확인)
- [ ] 커버리지 확인 (Service 90%+, Controller 80%+)

## 📚 문서 변경

- [ ] CLAUDE.md 업데이트 (필요시)
- [ ] .claude/rules/ 규칙 갱신 (필요시)
- [ ] README.md 업데이트 (필요시)
- [ ] 코드 주석 추가 (필요시)

## 🔗 관련 이슈

Closes #123

## 📌 추가 노트

(선택)
```

### PR 템플릿 (`.github/pull_request_template.md`)

```markdown
## 📋 변경 요약

<!-- 한 문단으로 설명 -->

## ✅ 체크리스트

- [ ] npm test 통과
- [ ] 문서 동기화 (CLAUDE.md, README 등)
- [ ] 커밋 메시지가 Conventional Commits 규약 준수
- [ ] 금지 파일 포함 안 함 (.env, node_modules)
- [ ] 관계없는 변경 제거

## 🔗 관련 이슈

Closes #
```

---

## 5. 관계없는 변경 방지

### 원칙

**하나의 PR = 하나의 주제. 관계없는 변경을 섞지 마세요.**

```
❌ 나쁜 PR
제목: "여러 버그 수정 및 리팩터링"
내용:
  - fix: taskService.update() 버그
  - refactor: taskController 전면 리팩터링
  - chore: ESLint 설정 변경
  - docs: README 전체 재작성

❌ 문제점:
  - 리뷰어가 무엇을 확인해야 하는지 불명확
  - 롤백하려면? (모든 변경을 롤백할 수는 없음)
  - git log 읽기 어려움

✅ 좋은 PR
1. fix: taskService.update() null 체크 누락 [PR-1]
   - taskService.js 수정
   - 테스트 추가
   - 테스트 결과: 39/39 통과

2. refactor: taskController 검증 로직 공통 함수로 추출 [PR-2]
   - 기능 변경 없음
   - 테스트 결과: 39/39 통과

3. docs: CLAUDE.md REST API 표 갱신 [PR-3]
   - 문서만 변경
   - 코드 변경 없음

✅ 각각 독립적으로 리뷰, 병합, 롤백 가능
```

### 체크리스트: PR 생성 전

```markdown
- [ ] 이 PR은 하나의 주제만 다루는가?
  - 예: "새 엔드포인트 추가" → 통과
  - 예: "새 엔드포인트 + 리팩터링" → 분리 필요

- [ ] 다른 주제가 섞여 있지 않은가?
  - 예: 의도하지 않은 파일 수정?
  - 예: 다른 기능의 버그 수정?

- [ ] 커밋이 논리적으로 분리되어 있는가?
  - 예: "feat: 엔드포인트", "test: 테스트", "docs: 문서" 분리

- [ ] 이 PR을 롤백할 수 있는가?
  - 예: 관계없는 변경이 없으면 가능
  - 예: 다른 기능에 영향 없으면 안전
```

---

## 6. 코드 리뷰 기준

### 리뷰어 체크리스트

```markdown
## 코드 리뷰 체크포인트

### 1. 커밋 메시지 & PR 설명
- [ ] Conventional Commits 규약 준수?
- [ ] 변경 요약이 명확한가?
- [ ] 왜 이 변경이 필요한가?

### 2. 논리적 일관성
- [ ] 기능이 완전한가? (Happy path + Error path)
- [ ] 테스트가 모두 통과하는가?
- [ ] 기존 기능 깨뜨리지 않았는가? (회귀)

### 3. 코드 품질
- [ ] CLAUDE.md 아키텍처 규칙 준수?
  - [ ] Routes → Controllers → Services → DB 계층 순서 맞음?
  - [ ] Controllers가 DB 접근 안 함?
  - [ ] SQL 파라미터화 (?)? (SQL 인젝션 방지)
  
### 4. HTTP 규약 준수
- [ ] 상태 코드: 200/201/204/400/404 맞음?
- [ ] 에러 메시지: error-mapping.md 정확히 일치?
- [ ] 응답 본문 형식: JSON/empty 맞음?

### 5. 테스트
- [ ] npm test 모두 통과?
- [ ] Happy path 테스트 있음?
- [ ] Error path 테스트 있음? (≥2개)
- [ ] 새 코드 커버리지: 80%+ (Service 90%+)?
- [ ] 격리: beforeEach/afterEach로 테스트 간 영향 제거?

### 6. 문서 일치도
- [ ] 코드 변경 후 CLAUDE.md 갱신?
- [ ] 에러 메시지 변경 후 error-mapping.md 갱신?
- [ ] README, API 문서 갱신?
- [ ] 코드 주석: WHY만 있음? (WHAT은 없음)

### 7. 금지 사항
- [ ] .env, node_modules, 빌드 산출물 없음?
- [ ] 환경 변수, API 키 노출 안 함?
- [ ] 개인 설정 (.vscode/settings) 없음?

### 8. 관계없는 변경
- [ ] 이 PR이 하나의 주제만 다루는가?
- [ ] 의도하지 않은 파일 수정 없음?
- [ ] 다른 기능의 버그 수정이 섞여 있지 않음?

### 리뷰 결과

**APPROVE**: 모든 항목 통과
**REQUEST CHANGES**: 다음 항목 수정 필요
  - (해당 항목 나열)
  
**COMMENT**: 제안 (필수 아님)
```

### 리뷰 시 자주 하는 지적

| 지적 | 올바른 행동 | 예시 |
|------|-----------|------|
| "테스트 안 통과함" | PR 작성자가 수정 후 재요청 | npm test 40/39 → 39/39으로 |
| "400인데 에러 메시지가 규칙과 다름" | error-mapping.md 확인 후 수정 | `'title 필수'` → `'title 은 필수입니다'` |
| "Controllers가 DB 접근함" | 계층 규칙 위반 (Services로 이동) | `db.query()` → `taskService.getAll()` |
| "관계없는 변경이 섞여 있음" | 별개 PR로 분리 | refactoring은 다음 PR로 |
| ".env가 커밋됨" | 즉시 제거 (민감 정보) | git rm --cached .env |

---

## 7. 실행 명령어

### 커밋 전

```bash
# 1. 상태 확인
git status

# 2. 변경 사항 확인 (staged)
git diff --cached

# 3. 변경 사항 확인 (unstaged)
git diff

# 4. 테스트 통과 확인
npm test

# 5. 금지 파일 확인
git diff --cached --name-only | grep -E '(\.env|node_modules|\.pem|credentials)'
```

### 커밋

```bash
# 표준 형식
git commit -m "feat(api): POST /api/tasks 엔드포인트 추가"

# 본문 포함
git commit -m "fix: taskService.update() null 체크 누락" -m "id 없을 때 에러 대신 null 반환했음.

이제 null을 확인해서 404 반환합니다."

# VERIFY: 커밋 확인
git log -1 --oneline
```

### PR 생성

```bash
# 브랜치 확인
git branch

# PR용 브랜치 생성 (필요시)
git checkout -b feat/new-endpoint

# 커밋 후 푸시
git push origin feat/new-endpoint

# GitHub에서 PR 생성
# → PR 템플릿 양식에 따라 작성
```

---

## 8. 호출 흐름 예시

### 시나리오: 새 엔드포인트 추가

#### Step 1: 작업 브랜치 생성
```bash
git checkout -b feat/bulk-create
```

#### Step 2: 코드 작성 & 테스트
```bash
# routes/taskRoutes.js, controllers/taskController.js, services/taskService.js 수정
npm test  # 통과 확인
```

#### Step 3: 단일 논리적 커밋
```bash
# 관련 파일 모두 스테이징
git add routes/taskRoutes.js controllers/taskController.js services/taskService.js tests/taskController.test.js CLAUDE.md

# 커밋 (Conventional Commits)
git commit -m "feat(api): POST /api/tasks/bulk 엔드포인트 추가

여러 태스크를 한 번에 생성합니다.
배열 검증은 Controller에서, 개별 생성은 Service에서 처리합니다.

요청:
  POST /api/tasks/bulk
  { \"tasks\": [{ title, assignee }, ...] }

응답:
  201 Created: [{ id, title, ... }, ...]
  400 Bad Request: { error: '...' }

관련: #45"
```

#### Step 4: 푸시 & PR 생성
```bash
git push origin feat/bulk-create
# GitHub → New Pull Request
```

#### Step 5: PR 템플릿 작성
```markdown
## 📋 변경 요약

여러 태스크를 한 번에 생성할 수 있는 POST /api/tasks/bulk 엔드포인트를 추가했습니다.
배열 검증은 Controller에서 수행되고, 각 항목 생성은 Service에서 처리됩니다.

## ✅ 테스트 결과

- [x] npm test 통과 (39/39)
- [x] curl로 수동 테스트 완료
  - [x] 유효한 배열 → 201 반환
  - [x] 빈 배열 → 400 반환
  - [x] 중복 title → 생성 (에러 아님)

## 📚 문서 변경

- [x] CLAUDE.md REST API 표 업데이트
- [x] tests/ 테스트 추가
- [x] 코드 주석 (JSDoc) 추가

## 🔗 관련 이슈

Closes #45
```

#### Step 6: 리뷰 & 병합
```bash
# 리뷰어 체크
# → APPROVED

# 병합
git merge feat/bulk-create
git push origin main

# 브랜치 정리
git branch -d feat/bulk-create
```

---

## 9. 자주 하는 실수

| 실수 | ❌ 잘못된 예 | ✅ 올바른 예 |
|------|-----------|-----------|
| **타입 선택** | `git commit -m "추가: 엔드포인트"` | `git commit -m "feat: POST /api/tasks"` |
| **첫 글자** | `git commit -m "Feat: 추가"` | `git commit -m "feat: 추가"` |
| **마침표** | `git commit -m "feat: 추가."` | `git commit -m "feat: 추가"` |
| **길이** | `git commit -m "feat: 새 엔드포인트를 추가했고..."` (길음) | `git commit -m "feat: POST /api/tasks"` (짧음) |
| **시제** | `feat: Added endpoint` (과거형) | `feat: add endpoint` (현재형) |
| **.env 커밋** | `git add .` (모든 파일) | `git add routes/ controllers/` (필요한 파일) |
| **한 커밋에 여러 기능** | `feat: 기능 A + B + C` | `feat: 기능 A` (분리) |
| **PR 제목과 내용 다름** | 제목: "수정", 내용: "완전히 다른 내용" | 일관성 유지 |

---

## 10. 체크리스트: 커밋 & PR 완료

### 커밋 전

```
- [ ] 코드 수정 완료 (routes, controllers, services)
- [ ] npm test 통과 (모든 테스트)
- [ ] 테스트 추가 (Happy + Error path)
- [ ] 문서 갱신 (CLAUDE.md, README, 주석)
- [ ] 금지 파일 확인 (.env, node_modules 없음)
- [ ] 커밋 메시지 작성 (Conventional Commits)
  - [ ] 타입 선택 (feat, fix, test, docs, refactor, chore)
  - [ ] 50자 이내 설명
  - [ ] 명령형 현재시제
  - [ ] 마침표 없음
```

### PR 전

```
- [ ] 브랜치 이름: feat/, fix/, refactor/, chore/ 접두어
- [ ] 커밋 메시지: 규약 준수 (Conventional Commits)
- [ ] PR 템플릿 작성
  - [ ] 변경 요약 (3~5문장)
  - [ ] 테스트 결과 (npm test 몇 개 통과?)
  - [ ] 문서 갱신 목록
  - [ ] 관련 이슈 (Closes #123)
- [ ] 관계없는 변경 없음
- [ ] 코드 자신 리뷰 (실수 없는지 확인)
```

---

## 참고

**관련 문서**:
- `CLAUDE.md` — 아키텍처, 계층, 불변식
- `.claude/rules/testing.md` — 테스트 규칙
- `.claude/rules/error-mapping.md` — HTTP 상태 코드 & 에러 메시지
- `.claude/rules/documentation.md` — 문서 갱신 규칙

**외부 참고**:
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)

---

**규칙 버전**: 1.0  
**최종 업데이트**: 2026-07-13  
**상태**: 활성화
