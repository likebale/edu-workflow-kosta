---
name: update-docs
description: 코드 변경에 따른 문서 자동 갱신 (9단계) — .claude/rules/documentation.md 규칙 준수
when_to_use: |
  "문서 갱신해 줘", "변경 후 문서 동기화", "코드-문서 불일치 수정", 
  "REST API 추가했는데 문서도 갱신해 줘", "함수 시그니처 변경했으니 주석 업데이트"
input: |
  - filePath: 변경된 파일 경로 (선택, 명시하면 그 파일 위주로 분석)
  - changeType: 변경 유형 (선택: REST_ENDPOINT, DB_SCHEMA, HTTP_CODE, FUNCTION_SIGNATURE, TEST_ADD)
  - description: 변경 내용 설명 (선택)
execution: 9단계 자동화 프로세스
---

# Update Docs Skill

**목적**: 코드 변경 후 관련 문서를 자동으로 식별하고 갱신합니다.

**규칙**: `.claude/rules/documentation.md` 완전 준수

**가정**:
- 코드 변경은 이미 완료됨 (이 스킬은 문서 동기화만 담당)
- `npm test`는 통과 상태 (또는 이 스킬 실행 후 통과할 예정)
- git 변경 사항을 추적할 수 있음 (`git diff`, `git status`)

---

## 작업 흐름 (9단계)

### 1️⃣ 변경된 파일 식별

**목표**: 코드에서 정확히 어떤 파일이 변경되었는지 파악합니다.

**방법**:
```bash
git diff HEAD~1..HEAD --name-only  # 최근 커밋
# 또는
git status --short                   # 현재 변경사항 (커밋 전)
# 또는
git diff --name-only                 # Staged + Unstaged
```

**수집 정보**:
```
변경된 파일 목록:
- routes/taskRoutes.js (엔드포인트 추가/변경)
- controllers/taskController.js (검증/응답 변경)
- services/taskService.js (비즈니스 로직 변경)
- db/database.js (스키마 변경)
- tests/ (테스트 추가)
```

**산출물**:
```
파일별 변경 내용:
- routes/taskRoutes.js:
  * 추가: router.patch('/api/tasks/:id/assign', ...)
  * 변경 줄 수: 5줄

- controllers/taskController.js:
  * 추가: function assign(req, res) { ... }
  * 변경 줄 수: 20줄

- tests/taskController.test.js:
  * 추가: describe('PATCH /api/tasks/:id/assign', ...)
  * 변경 줄 수: 30줄
```

---

### 2️⃣ 영향 받는 문서 후보 나열

**목표**: 변경된 파일에 따라 갱신이 필요한 문서를 모두 식별합니다.

**매핑 규칙** (`.claude/rules/documentation.md` 2절 참고):

```
변경된 파일              → 갱신 대상 문서
─────────────────────────────────────────
routes/*.js             → Swagger/JSDoc, CLAUDE.md, README
controllers/*.js        → error-mapping.md, 주석, CLAUDE.md
services/*.js           → 주석, CLAUDE.md, 테스트
db/database.js          → CLAUDE.md 스키마 표, 주석
tests/*.test.js         → README (테스트 개수)
package.json            → README (기술 스택, npm 스크립트)
```

**예시 (PATCH /api/tasks/:id/assign 추가)**:
```
변경 파일:
1. routes/taskRoutes.js ✓
2. controllers/taskController.js ✓
3. tests/taskController.test.js ✓

식별된 갱신 대상:
1. Swagger/JSDoc (routes) — 필수
2. CLAUDE.md REST API 표 — 필수
3. error-mapping.md — 필수 (에러 메시지 추가)
4. 함수 주석 (controller.assign) — 권장
5. README (테스트 개수) — 권장
6. 테스트 코드 검증 — 필수
```

**산출물**:
```
갱신 필요 문서:
- 🔴 필수 (코드와 직접 관련)
  1. Swagger/JSDoc
  2. CLAUDE.md REST API 표
  3. error-mapping.md

- 🟡 권장 (코드 품질 향상)
  4. 함수 주석
  5. README
```

---

### 3️⃣ 갱신 우선순위 결정

**목표**: 어느 순서로 갱신할지 결정합니다.

**우선순위 기준**:
1. **필수** (코드와 직접 동기화) — 우선순위 1-2
2. **권장** (코드 품질) — 우선순위 3-4
3. **선택** (참고용) — 우선순위 5+

**결정 로직**:
```
IF 변경이 REST 엔드포인트라면:
  → 우선순위 1: Swagger/JSDoc
  → 우선순위 2: CLAUDE.md 표
  → 우선순위 3: error-mapping.md
  → 우선순위 4: 테스트 검증
  → 우선순위 5: README

IF 변경이 DB 스키마라면:
  → 우선순위 1: CLAUDE.md 스키마 표
  → 우선순위 2: db/database.js 주석
  → 우선순위 3: Service/Controller 수정
  → 우선순위 4: 테스트

IF 변경이 에러 코드라면:
  → 우선순위 1: error-mapping.md
  → 우선순위 2: 테스트
  → 우선순위 3: CLAUDE.md
```

**산출물**:
```
갱신 계획:
1️⃣ Swagger/JSDoc (routes/taskRoutes.js)
2️⃣ CLAUDE.md REST API 표
3️⃣ error-mapping.md 에러 메시지
4️⃣ 함수 주석 (controller.assign)
5️⃣ 테스트 검증
6️⃣ README (필요시)
```

---

### 4️⃣ API 문서 갱신

**목표**: Swagger/JSDoc을 코드에 추가하거나 수정합니다.

**작업**:
1. `routes/taskRoutes.js`의 엔드포인트 파악
2. OpenAPI/Swagger JSDoc 작성
3. 파라미터, 요청 본문, 응답 명시

**예시**:
```javascript
/**
 * @openapi
 * /api/tasks/{id}/assign:
 *   patch:
 *     summary: Assign a task to someone
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignee]
 *             properties:
 *               assignee:
 *                 type: string
 *                 example: 김개발
 *     responses:
 *       200:
 *         description: Task assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer }
 *                 assignee: { type: string }
 *       400:
 *         description: assignee 는 필수입니다
 *       404:
 *         description: 태스크를 찾을 수 없습니다
 */
router.patch('/api/tasks/:id/assign', taskController.assign);
```

**검증**:
- [ ] 경로가 정확한가? (e.g., `/api/tasks/{id}/assign`)
- [ ] HTTP 메서드가 정확한가? (GET/POST/PATCH/DELETE)
- [ ] 파라미터가 모두 나열되었는가?
- [ ] 요청 본문 스키마가 정확한가?
- [ ] 응답 스키마가 정확한가?
- [ ] 에러 응답 (400, 404, 500)이 모두 있는가?

**산출물**:
```
routes/taskRoutes.js에 Swagger JSDoc 추가
```

---

### 5️⃣ CLAUDE.md 규약 갱신

**목표**: CLAUDE.md의 관련 섹션을 코드와 동기화합니다.

**갱신 대상** (우선순위순):
1. **REST API 계약** (존재하면)
   ```markdown
   | PATCH | /api/tasks/:id/assign | 담당자 지정 | 200 | 400, 404 |
   ```

2. **데이터 모델** (스키마 변경시)
   ```markdown
   | 새 컬럼 | 타입 | 설명 | 기본값 |
   ```

3. **HTTP 상태 코드 규약** (새 코드 추가시)
   ```markdown
   | 410 | Gone | 리소스 영구 삭제 |
   ```

4. **Key Invariants** (설계 변경시)

**검증**:
- [ ] REST API 표의 경로가 정확한가?
- [ ] 상태 코드가 코드의 res.status()와 일치하는가?
- [ ] 설명이 명확한가?
- [ ] 스키마 정보가 db/database.js와 일치하는가?

**산출물**:
```
CLAUDE.md의 REST API 표 업데이트
```

---

### 6️⃣ README 갱신

**목표**: README의 변경 관련 섹션을 업데이트합니다.

**갱신 대상**:
1. **기술 스택** (package.json 변경시)
   ```markdown
   - Express 4.19.2 (← 버전 확인)
   ```

2. **npm 스크립트** (package.json 추가시)
   ```bash
   npm run [새 스크립트]
   ```

3. **REST 라우트 표** (새 엔드포인트시)
   → ⚠️ 주의: 이중 관리 금지
   → README는 Swagger 링크만 유지
   → 상세 내용은 `/api/docs`에서 보도록

4. **테스트 개수** (테스트 추가시)
   ```markdown
   Tests: 39 passed (← 자동 동기화 가능)
   ```

**검증**:
- [ ] 기술 스택 버전이 package.json과 일치하는가?
- [ ] npm 스크립트가 정확한가?
- [ ] 테스트 개수가 실제와 일치하는가?

**산출물**:
```
README.md 업데이트 (필요한 섹션만)
```

---

### 7️⃣ 주석 동기화

**목표**: 코드의 주석을 함수 변경과 맞춥니다.

**갱신 대상**:
1. **함수 JSDoc** (파라미터/반환값 변경시)
   ```javascript
   /**
    * Assign a task to someone
    * @param {string} data.assignee - Assignee name (required)
    * @returns {Object|null} Updated task, or null if not found
    */
   ```

2. **로직 설명 주석** (WHY가 명확하지 않은 부분)
   ```javascript
   // Partial update: unspecified fields retain their values via COALESCE
   function update(id, { title, description, status, assignee }) { ... }
   ```

3. **상수/설정 주석** (변경시)
   ```javascript
   // Valid statuses: 'todo', 'in_progress', 'done'
   ```

**규칙** (`.claude/rules/documentation.md`):
- WHY가 명확하지 않은 부분만 주석 추가
- WHAT은 코드 자체가 설명 (주석 불필요)
- HOW도 일반적으로 주석 불필요

**검증**:
- [ ] 함수 JSDoc이 파라미터/반환값과 일치하는가?
- [ ] 주석이 과도하지는 않은가? (코드 가독성 방해)
- [ ] 주석이 정확한가? (문법, 오타)

**산출물**:
```
services/, controllers/, db/ 등의 함수 주석 추가/수정
```

---

### 8️⃣ 문서와 코드 일치 확인

**목표**: 모든 문서가 코드와 정확히 일치하는지 검증합니다.

**검증 항목** (documentation.md 4절 참고):

```
A. REST API 일치도
  [ ] 경로: Swagger = CLAUDE.md = 테스트 코드
  [ ] 메서드: Swagger = CLAUDE.md = 테스트 코드
  [ ] 파라미터: Swagger = JSDoc = 테스트 send()
  [ ] 응답: Swagger = Controller res.status() = 테스트 expect()
  [ ] 에러: error-mapping.md = Controller = 테스트 expect(res.body.error)

B. DB 스키마 일치도
  [ ] 컬럼명: CLAUDE.md = db/database.js = Service 함수
  [ ] 타입: CLAUDE.md = db/database.js CREATE TABLE
  [ ] 기본값: CLAUDE.md = db/database.js DEFAULT

C. 함수 일치도
  [ ] 파라미터: JSDoc = 함수 선언 = 호출 코드
  [ ] 반환값: JSDoc = return 문 = 사용 코드

D. 상태 코드 일치도
  [ ] 200: Controller res.status(200) = 테스트 expect(res.status).toBe(200)
  [ ] 201: Controller res.status(201) = CLAUDE.md 201
  [ ] 400: Controller res.status(400) = error-mapping.md 400
  [ ] 404: Controller res.status(404) = CLAUDE.md 404

E. 에러 메시지 정확성
  [ ] 'title 은 필수입니다': Controller = error-mapping.md = 테스트
  [ ] '태스크를 찾을 수 없습니다': Controller = error-mapping.md = 테스트
  (부분 매칭 ❌, 정확한 문자열 일치 ✅)
```

**수동 검증 (spot check)**:
```bash
# 예: REST API PATCH /api/tasks/:id/assign 검증

# 1. routes에 있는가?
grep "patch.*assign" routes/taskRoutes.js

# 2. Swagger JSDoc 정확한가?
grep -A 20 "@openapi" routes/taskRoutes.js | grep -A 5 "/api/tasks/{id}/assign"

# 3. CLAUDE.md에 나열되었는가?
grep "PATCH.*assign" CLAUDE.md

# 4. error-mapping.md에 에러 메시지 있는가?
grep "assignee 는 필수입니다" .claude/rules/error-mapping.md

# 5. 테스트 코드와 일치하는가?
grep -A 5 "PATCH.*assign" tests/taskController.test.js
```

**산출물**:
```
✅ 또는 ❌ 일치도 리포트
- 항목별 일치 상태
- 불일치 항목 명시 (있으면)
- 수정 필요 사항 (있으면)
```

---

### 9️⃣ 테스트 통과 확인

**목표**: 모든 변경 후 테스트가 여전히 통과하는지 확인합니다.

**작업**:
```bash
npm test 2>&1
```

**검증**:
- [ ] 모든 테스트 통과 (0 실패)
- [ ] 새 테스트 추가시 정상 작동
- [ ] 기존 테스트 여전히 통과 (회귀 없음)

**산출물**:
```
Test Suites: X passed, X total
Tests: Y passed, Y total
Time: Z s
```

---

## 완료 조건

이 스킬의 작업이 **완료되었다**는 것은:

```
✅ 1️⃣ 변경된 파일 식별됨
AND
✅ 2️⃣ 영향 받는 문서 모두 식별됨
AND
✅ 3️⃣ 갱신 우선순위 결정됨
AND
✅ 4️⃣ API 문서 (Swagger/JSDoc) 갱신됨
AND
✅ 5️⃣ CLAUDE.md 갱신됨
AND
✅ 6️⃣ README 갱신됨 (필요시)
AND
✅ 7️⃣ 주석 동기화됨
AND
✅ 8️⃣ 코드-문서 일치 확인됨 (모두 일치)
AND
✅ 9️⃣ npm test 통과
```

---

## 규칙 준수

**이 스킬은 다음을 반드시 따릅니다**:

1. ✅ `.claude/rules/documentation.md` 완전 준수
   - 코드 우선 원칙
   - 변경 유형별 갱신 대상 (2-A ~ 2-E)
   - 갱신 체크리스트
   - 완료 조건

2. ✅ `.claude/rules/error-mapping.md` 준수
   - 상태 코드 (201, 200, 204, 400, 404, 500)
   - 에러 메시지 정확한 문자열

3. ✅ `.claude/rules/testing.md` 참고
   - 테스트는 수정하지 않음 (테스트는 별도 스킬)
   - 테스트 통과 확인만 함

---

## 사용 예시

### 예 1: REST 엔드포인트 추가
```
사용자: "update-docs 스킬 실행해 줘. PATCH /api/tasks/:id/assign 추가했어"

스킬 실행:
1️⃣ git diff 로 routes/taskRoutes.js, controllers/taskController.js 변경 감지
2️⃣ 갱신 대상: Swagger, CLAUDE.md, error-mapping.md, 주석
3️⃣ 우선순위: 1=Swagger, 2=CLAUDE.md, 3=error-mapping.md, 4=주석
4️⃣ Swagger JSDoc 작성/추가
5️⃣ CLAUDE.md REST API 표 업데이트
6️⃣ error-mapping.md 에러 메시지 추가
7️⃣ 함수 주석 (JSDoc) 동기화
8️⃣ 코드-문서 일치 확인 (9개 항목 검증)
9️⃣ npm test 통과 확인

결과: ✅ 모든 문서 동기화 완료
```

### 예 2: DB 스키마 추가
```
사용자: "DB에 priority 컬럼 추가했으니 문서 갱신해 줘"

스킬 실행:
1️⃣ git diff로 db/database.js 변경 감지
2️⃣ 갱신 대상: CLAUDE.md 스키마, 주석, Service 코드
3️⃣ 우선순위: 1=CLAUDE.md 스키마, 2=주석, 3=검증
4️⃣ (API 문서는 필요없음, skip)
5️⃣ CLAUDE.md 스키마 표 업데이트 (priority 행 추가)
6️⃣ (README 필요없음, skip)
7️⃣ db/database.js와 Service 함수 주석 추가
8️⃣ 코드-문서 일치 확인 (컬럼명, 타입, 기본값)
9️⃣ npm test 통과 확인

결과: ✅ 모든 문서 동기화 완료
```

---

## 도움 되는 명령어

```bash
# 변경된 파일 식별
git diff HEAD~1..HEAD --name-only        # 최근 커밋
git status --short                        # 현재 변경

# 변경 내용 상세 보기
git diff routes/taskRoutes.js             # 특정 파일

# Swagger 문서 검증 (생성 후)
npm run docs:validate

# 테스트 통과 확인
npm test

# 문서-코드 일치도 검증 (미래 자동화)
npm run docs:check
```

---

## 다음 단계

이 스킬 완료 후:
1. ✅ 코드와 문서 완벽 동기화
2. ✅ git commit (코드 + 문서 함께)
3. ✅ PR 생성 (자동화 가능)

---

**스킬 버전**: 1.0  
**최종 업데이트**: 2026-07-13  
**규칙 참고**: `.claude/rules/documentation.md`
