---
name: refactor-safely
description: 안전한 리팩터링 (6단계) — 동작 보존 우선, 테스트 안전망 확인 후 진행
when_to_use: |
  "이 함수 리팩터해 줘", "중복 코드 정리해 줘", "변수명 개선해 줘", 
  "로직 간단히 해 줘", "함수 분리해 줘", "이 부분 다시 작성해 줘"
input: |
  - targetFile: 리팩터할 파일 또는 함수 (필수)
  - refactorType: 리팩터 유형 (선택: rename, extract, simplify, reorder, restructure)
  - scope: 범위 (선택: single-function, module, file, multi-file)
---

# Refactor Safely Skill

**핵심 원칙**: 동작(behavior)은 정확히 유지하고, 구조(structure)만 개선한다.

**모토**: "Green lights → Green lights" — 모든 테스트가 통과하는 상태에서 시작해서 통과하는 상태로 끝낸다.

**철학**: 리팩터링은 코드를 더 쉽게 읽고 유지보수할 수 있도록 구조를 개선하는 것이다. 동작을 바꾸는 것은 리팩터링이 아니라 기능 개발이다.

---

## 작업 흐름 (6단계)

### 1️⃣ 리팩터 후보 식별

**목표**: 리팩터할 정확한 범위를 파악합니다.

**작업**:
1. 대상 파일/함수 확인
2. 리팩터 유형 분류
3. 리팩터 이유 명확히

**리팩터 유형**:

| 유형 | 설명 | 예시 | 위험도 |
|------|------|------|--------|
| **Rename** | 변수/함수/클래스 이름 개선 | `tmp` → `temporaryCount` | 🟢 낮음 |
| **Extract** | 함수/메서드 추출 | 반복 로직을 함수로 | 🟡 중간 |
| **Simplify** | 복잡한 로직 단순화 | 중첩 if 제거 | 🟡 중간 |
| **Reorder** | 코드 순서 정렬 | 함수 순서 변경 | 🟢 낮음 |
| **Restructure** | 큰 구조 개선 | 파일 분리, 계층 재구성 | 🔴 높음 |

**식별 기준**:
```
✅ 좋은 리팩터 후보
- 테스트가 충분함 (80%+)
- 목적이 명확함
- 범위가 제한적임 (한 파일 이하)

❌ 피해야 할 리팩터
- 테스트 불충분 (<50%)
- 동작 변경을 포함함
- 범위가 너무 넓음 (전체 재구성)
```

**산출물**:
```
리팩터 후보:
- 파일: services/taskService.js
- 함수: update()
- 유형: Extract (COALESCE 로직을 헬퍼 함수로)
- 이유: 부분 업데이트 로직의 재사용성 향상
- 범위: 1개 함수
- 테스트: 39개 ✅ (충분함)
```

---

### 2️⃣ 테스트 안전망 확인

**목표**: 리팩터링이 안전한지 검증하기 위한 테스트가 충분한지 확인합니다.

**작업**:
```bash
npm test 2>&1
```

**검증 항목**:
```
✅ 모든 테스트 통과 (0 실패)
  └─ 만약 실패하면 → 그 테스트를 먼저 고쳐야 함

✅ 리팩터 범위에 대한 테스트 충분
  ├─ 함수별 정상 경로 (Happy path)
  ├─ 함수별 실패 경로 (Error path ≥2)
  └─ 통합 테스트 (API 호출)

✅ 테스트 커버리지 확인 (선택)
  └─ npm test -- --coverage
```

**안전망 체크리스트**:

| 항목 | 기준 | 상태 |
|------|------|------|
| 모든 테스트 통과 | 0 실패 | ✅ |
| Happy path 테스트 | 함수마다 ≥1개 | ✅ |
| Error path 테스트 | 함수마다 ≥2개 | ✅ |
| 통합 테스트 | HTTP 요청 포함 | ✅ |
| 커버리지 | 50%+ (권장: 80%+) | ✅ |

**만약 테스트 불충분하다면**:
```
❌ 문제: 리팩터할 함수에 대한 테스트가 부족
→ 해결: 먼저 테스트를 추가 (generate-tests 스킬 사용)
→ 그 후: 리팩터 진행
```

**산출물**:
```
테스트 안전망 확인:
✅ 모든 테스트 통과 (39 passed)
✅ update() 함수: 6개 테스트 (Happy ×4 + Error ×2)
✅ 커버리지: Service 90%+
→ 리팩터링 안전함 ✅
```

---

### 3️⃣ Plan Mode로 변경 계획 수립

**목표**: 리팩터의 단계별 계획을 수립합니다.

**작업**:
1. Plan Mode 진입 (`/plan` 명령)
2. 리팩터 계획 작성
3. 각 단계의 체크포인트 명시
4. 롤백 전략 수립

**계획 템플릿**:

```markdown
## Refactoring Plan: [파일명] [함수명]

### 목표
[무엇을 리팩터하는가? 왜?]

### 현재 상태
- 함수: [함수명]
- 라인 수: [개수]
- 테스트: [테스트 개수]

### 단계별 계획

#### Phase 1: 헬퍼 함수 추가 (안전)
1. 새 함수 작성 (예: `applyCoalesce()`)
2. 테스트 작성 (새 함수 단위 테스트)
3. npm test 통과 확인
✅ Checkpoint: 새 함수 추가되었으나 기존 코드 미변경

#### Phase 2: 기존 로직 리팩터 (점진적)
1. 한 줄씩 헬퍼 함수로 변경
2. 각 단계마다 npm test
3. 동작 보존 확인
✅ Checkpoint: 기존 동작 100% 유지

#### Phase 3: 정리 및 문서화
1. 불필요한 주석 제거
2. 새 함수 JSDoc 추가
3. 테스트 검증
✅ Checkpoint: 최종 검증 완료

### 롤백 전략
- 문제 발생 시: git checkout [파일명]
- 테스트 실패 시: 해당 단계로 돌아가서 재검토
```

**체크포인트 설정**:
```
각 단계 후 다음을 확인:
1. ✅ npm test 통과
2. ✅ 동작 보존됨 (새로운 기능 아님)
3. ✅ 코드 품질 개선됨 (읽기 쉬움)
4. ✅ 문서/주석 일치함
```

**산출물**:
```
리팩터 계획:
─────────────
목표: taskService.update()의 COALESCE 로직을 헬퍼 함수로 추출

Phase 1: applyPartialUpdate() 헬퍼 함수 작성
  - SQL COALESCE 로직 별도 함수로
  - 단위 테스트 추가
  - npm test ✅

Phase 2: update() 함수에서 헬퍼 사용으로 변경
  - 한 줄씩 리팩터
  - 각 단계마다 npm test
  - 동작 보존 확인

Phase 3: 문서화 및 정리
  - JSDoc 추가
  - 주석 동기화
  - 최종 검증

롤백: git checkout services/taskService.js
```

---

### 4️⃣ 작은 단위로 진행

**원칙**: "한 번에 한 가지만 변경한다"

**작은 단위 정의**:
```
✅ 작은 리팩터 단위
- 한 줄 변경
- 한 변수 이름 변경
- 한 함수 추출
- 한 조건 단순화

❌ 큰 리팩터 (피하기)
- 파일 전체 재구성
- 여러 함수를 동시에 변경
- 동작 변경 포함
```

**단위별 진행**:

```
Step 1: 준비 (동작 무변경)
  ├─ 새 함수 추가 (아직 사용 안 함)
  ├─ 단위 테스트 작성
  └─ npm test ✅

Step 2: 단계적 적용 (한 번에 한 곳)
  ├─ 함수 호출 위치 1군데 변경
  ├─ npm test ✅
  ├─ 함수 호출 위치 2군데 변경
  ├─ npm test ✅
  └─ ... (반복)

Step 3: 정리
  ├─ 불필요한 코드 제거
  ├─ npm test ✅
  └─ 문서화
```

**예시: COALESCE 로직 추출**:

```javascript
// Step 1: 헬퍼 함수 추가 (새로운 함수, 아직 사용 안 함)
function applyPartialUpdate(fields, existing) {
  return {
    title: fields.title ?? existing.title,
    description: fields.description ?? existing.description,
    status: fields.status ?? existing.status,
    assignee: fields.assignee ?? existing.assignee
  };
}

// 이 시점에서 npm test → ✅ (기존 코드 미변경)

// Step 2: 기존 update() 함수에서 사용
function update(id, fields) {
  const existing = getById(id);
  if (!existing) return null;
  
  const updated = applyPartialUpdate(fields, existing);
  
  db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, status = ?, assignee = ?
    WHERE id = ?
  `).run(updated.title, updated.description, updated.status, updated.assignee, id);
  
  return getById(id);
}

// 이 시점에서 npm test → ✅ (동작 동일)
```

**산출물**:
```
리팩터 진행 로그:
────────────────
✅ Step 1: applyPartialUpdate() 함수 추가 (테스트 추가)
   npm test: 40 passed (기존 39 + 신규 1)

✅ Step 2: update()에서 헬퍼 함수 사용
   npm test: 39 passed (동작 보존)

✅ Step 3: 인라인 주석 제거
   npm test: 39 passed

✅ Step 4: JSDoc 추가
   npm test: 39 passed
```

---

### 5️⃣ 단계마다 npm test로 동작 보존 확인

**원칙**: "Red → Green"을 반복하지 않는다. 항상 "Green"을 유지한다.

**동작 보존 검증**:

```
각 단계 후:
1️⃣ npm test 실행
   └─ 0 실패 여야 함 (새로운 테스트 실패는 OK)

2️⃣ 테스트 결과 분석
   ├─ ✅ 기존 테스트 모두 통과? → 동작 보존됨 ✅
   ├─ ❌ 기존 테스트 실패? → 리팩터 롤백 ↩️
   └─ 🆕 새 테스트 실패? → 새 코드 수정

3️⃣ 통합 테스트 확인
   └─ HTTP API 요청도 성공? → 엣지 케이스 없음 ✅
```

**테스트 실패 시 액션**:

```
상황 1: 기존 테스트 실패
  예: "기대값: 'todo', 실제값: 'in_progress'"
  → 리팩터 롤백 (git checkout)
  → 단계를 더 작게 나눔
  → 재시도

상황 2: 새 테스트만 실패
  예: applyPartialUpdate() 단위 테스트 실패
  → 새 함수 코드만 수정 (기존 코드 건드리지 않음)
  → 다시 npm test

상황 3: 모두 통과
  → 다음 단계 진행 ✅
```

**실시간 모니터링**:

```bash
# 각 단계 후 명령어
npm test 2>&1

# 통과 확인 기준
Test Suites: 2 passed, 2 total
Tests: 39 passed, 39 total  ← 기존 39개 모두 통과?
```

**산출물**:
```
테스트 결과 로그:
─────────────────

🔄 Step 1: 헬퍼 함수 추가
   Test Suites: 2 passed
   Tests: 40 passed (기존 39 + 신규 1) ✅

🔄 Step 2: update() 리팩터
   Test Suites: 2 passed
   Tests: 39 passed (동작 보존 확인됨) ✅

🔄 Step 3: 정리
   Test Suites: 2 passed
   Tests: 39 passed ✅

✅ 최종: 동작 100% 보존됨
```

---

### 6️⃣ 문서 동기화

**목표**: 리팩터 후 관련 문서를 최신 상태로 유지합니다.

**갱신 대상** (순서대로):

```
1. JSDoc/주석 (새 함수, 변경된 함수)
2. CLAUDE.md (아키텍처 변경시)
3. 테스트 문서 (새 테스트 추가시)
4. README (큰 변경시)
5. API.md (HTTP 동작 변경시)
```

**구체적 체크리스트**:

| 문서 | 확인 항목 | 액션 |
|------|---------|------|
| **JSDoc** | 새 함수에 @param, @returns 있나? | ✍️ 추가 |
| **주석** | WHY가 명확하지 않은 부분? | ✍️ 설명 추가 |
| **테스트** | 새 함수에 Happy + Error 테스트? | ✍️ 테스트 명 확인 |
| **CLAUDE.md** | 아키텍처 변경? | ✍️ 업데이트 (필요시) |
| **README** | 기술 스택/구조 변경? | ✍️ 업데이트 (필요시) |

**예시: update() 리팩터 후 문서 동기화**

```javascript
// ✅ JSDoc 추가 (새 함수)
/**
 * Apply partial update to existing task fields
 * @param {Object} fields - Fields to update (title?, description?, status?, assignee?)
 * @param {Object} existing - Existing task object
 * @returns {Object} Merged object with updated fields, unchanged fields from existing
 * @example
 * applyPartialUpdate({ status: 'done' }, { status: 'todo', title: 'Task' })
 * // → { status: 'done', title: 'Task' }
 */
function applyPartialUpdate(fields, existing) { ... }

// ✅ 변경된 함수의 주석도 업데이트
// Partial update: unspecified fields retain their values
function update(id, fields) { ... }
```

```markdown
# 테스트 문서 동기화

## update() — 부분 갱신

### 정상 경로
- ✅ applyPartialUpdate()로 필드 병합
- ✅ 기존 필드 유지 (변경 안 함)
- ✅ 새 필드만 갱신

### 실패 경로
- ✅ id 없으면 null 반환
- ✅ 음수 id면 null 반환
```

**문서 동기화 확인**:

```bash
# 1. JSDoc 문법 확인
grep -A 10 "function applyPartialUpdate" services/taskService.js
# → JSDoc 있는가?

# 2. 테스트 명칭 확인
grep "applyPartialUpdate" tests/taskService.test.js
# → 테스트가 함수명과 일치하는가?

# 3. 최종 검증
npm test
# → 모두 통과?
```

**산출물**:
```
문서 동기화 완료:
────────────────
✅ services/taskService.js
   - applyPartialUpdate() JSDoc 추가
   - update() 주석 명확화

✅ tests/taskService.test.js
   - applyPartialUpdate() 테스트 추가 (Happy ×1 + Error ×2)

✅ CLAUDE.md
   - 아키텍처 변경 없음 (skip)

✅ 최종 검증
   - npm test: 39 passed ✅
   - 문서-코드 일치 ✅
```

---

## 완료 조건

리팩터링이 **완료되었다**는 것은:

```
✅ 1️⃣ 리팩터 후보 명확히 식별됨
AND
✅ 2️⃣ 테스트 안전망 충분함 (39개 모두 통과)
AND
✅ 3️⃣ Plan Mode 계획 수립 및 검토됨
AND
✅ 4️⃣ 작은 단위로 진행됨 (한 번에 한 가지)
AND
✅ 5️⃣ 모든 단계에서 npm test 통과 (동작 보존)
AND
✅ 6️⃣ 문서 동기화 완료
AND
✅ 💚 "Green lights → Green lights" (테스트 실패 없음)
```

---

## 핵심 규칙

### 🚫 절대 하지 말 것

```
❌ 리팩터 중에 동작 변경
   ├─ "이참에 이 버그도 고쳐볼까?" → NO!
   ├─ "이 로직을 더 나은 방식으로?" → NO!
   └─ "이 부분을 다시 설계해볼까?" → NO!
   
❌ 테스트 없이 리팩터
   → 먼저 테스트 추가 (generate-tests 스킬)

❌ 큰 단위로 한 번에 리팩터
   → 한 번에 한 함수, 한 줄씩 진행

❌ npm test 없이 다음 단계 진행
   → 각 단계마다 반드시 확인

❌ 문서 미동기화
   → 마지막에 반드시 동기화
```

### ✅ 반드시 해야 할 것

```
✅ 리팩터 전: 계획 수립 (Plan Mode)
✅ 리팩터 중: 작은 단위, npm test 반복
✅ 리팩터 후: 문서 동기화, 최종 검증
✅ 전체: 동작 보존 확인 (테스트 통과)
```

---

## 안티패턴 예시

### ❌ 나쁜 리팩터 (피할 것)

```javascript
// 나쁜 예: 한 번에 너무 많이 변경
function update(id, { title, description, status, assignee }) {
  const existing = getById(id);
  if (!existing) return null;
  
  // 이 커다란 블록을 한 번에 모두 리팩터?
  const merged = {
    title: title ?? existing.title,
    description: description ?? existing.description,
    status: status ?? existing.status,
    assignee: assignee ?? existing.assignee
  };
  
  // 동시에 SQL도 변경?
  db.prepare(`UPDATE tasks SET ...`).run(...);
  
  return getById(id);
}

// 문제:
// 1. 테스트가 실패하면 뭐가 문제인지 알 수 없음
// 2. 롤백이 어려움
// 3. 동작 변경이 섞여 있을 수 있음
```

### ✅ 좋은 리팩터 (목표)

```javascript
// 좋은 예: 단계별로 진행

// Step 1: 헬퍼 함수 추가 (완전히 새로운, 기존 코드 미변경)
function applyPartialUpdate(fields, existing) {
  return {
    title: fields.title ?? existing.title,
    description: fields.description ?? existing.description,
    status: fields.status ?? existing.status,
    assignee: fields.assignee ?? existing.assignee
  };
}
// npm test ✅ (40 passed: 기존 39 + 신규 1)

// Step 2: 기존 함수에서 헬퍼 사용으로 변경
function update(id, fields) {
  const existing = getById(id);
  if (!existing) return null;
  
  const merged = applyPartialUpdate(fields, existing);
  // 나머지는 동일
  
  return getById(id);
}
// npm test ✅ (39 passed: 동작 동일)

// Step 3: 주석/문서 정리
// npm test ✅ (39 passed)

// 장점:
// 1. 각 단계에서 npm test로 검증
// 2. 문제 발생 시 정확히 어디서 실패했는지 알 수 있음
// 3. 롤백이 명확함
// 4. 동작 변경 없음
```

---

## 사용 예시

### 예 1: 함수 이름 변경 (낮은 위험도)

```
사용자: "services/taskService.js의 update() 함수 이름을 updateTask()로 바꿔 줄래?"

스킬 실행:

1️⃣ 리팩터 후보: 
   - 파일: services/taskService.js
   - 함수: update → updateTask
   - 유형: Rename
   - 테스트: 39개 ✅

2️⃣ 테스트 안전망: 
   - npm test: 39 passed ✅

3️⃣ 계획 (Plan Mode):
   - Step 1: 함수 정의 변경
   - Step 2: 모든 호출 위치 변경 (git grep으로 찾기)
   - Step 3: 테스트 파일의 함수명 변경
   - Step 4: 문서 동기화

4️⃣ 작은 단위 진행:
   ✅ Step 1: 함수 정의만 변경
      npm test → 실패 (호출이 여전히 update)
   ✅ Step 2: 각 호출 위치를 한 개씩 변경
      - controllers/taskController.js: update → updateTask
      npm test ✅
      - 다른 호출 변경...
   ✅ Step 3: 테스트 파일 변경
      npm test ✅

5️⃣ 동작 보존 확인:
   - npm test: 39 passed ✅ (호출 방식만 변경, 동작 동일)

6️⃣ 문서 동기화:
   - CLAUDE.md: 함수명 참조 변경 (필요시)
   - 주석: updateTask 사용

→ ✅ 완료
```

### 예 2: 함수 추출 (중간 위험도)

```
사용자: "COALESCE 로직을 헬퍼 함수로 추출해 줄래?"

스킬 실행:

1️⃣ 리팩터 후보:
   - 파일: services/taskService.js
   - 함수: applyPartialUpdate() 추출
   - 유형: Extract
   - 테스트: 39개 ✅

2️⃣ 테스트 안전망:
   - npm test: 39 passed ✅

3️⃣ 계획 (Plan Mode):
   - Phase 1: applyPartialUpdate() 함수 작성 + 단위 테스트
   - Phase 2: update()에서 호출하도록 변경
   - Phase 3: 정리 및 문서화

4️⃣ 작은 단위 진행:
   ✅ Phase 1: 새 함수 + 테스트
      npm test → 40 passed (신규 1 추가) ✅
   ✅ Phase 2: update()에서 호출
      npm test → 39 passed (동작 동일) ✅
   ✅ Phase 3: JSDoc, 주석
      npm test → 39 passed ✅

5️⃣ 동작 보존:
   - 39개 테스트 모두 통과 (동작 정확히 동일)

6️⃣ 문서 동기화:
   - applyPartialUpdate() JSDoc 추가
   - 테스트 파일에서 새 함수 테스트 명 확인
   - CLAUDE.md 아키텍처 변경 없음 (skip)

→ ✅ 완료
```

---

## 도움 되는 명령어

```bash
# 1. 전체 테스트 (항상 실행)
npm test

# 2. 변경 파일 조회
git status

# 3. 함수 호출 찾기 (Rename 시)
git grep "update(" -- "*.js"

# 4. 리팩터 전 코드 스냅샷
git diff services/taskService.js

# 5. 각 단계 후 테스트 실행
npm test
```

---

## 다음 단계

리팩터링 완료 후:
1. ✅ 모든 테스트 통과
2. ✅ 동작 보존됨
3. ✅ 문서 동기화됨
4. ✅ git commit (리팩터링 커밋)

```bash
# 예시 커밋 메시지
git commit -m "refactor: extract partial update logic to applyPartialUpdate()

Extracted COALESCE field merging into a separate function for reusability.
Behavior unchanged: all 39 tests still pass.

- New function: applyPartialUpdate(fields, existing)
- Tests: added unit tests for new function
- Documentation: added JSDoc"
```

---

**스킬 버전**: 1.0  
**핵심 원칙**: "동작은 정확히, 구조만 개선"  
**모토**: "Green lights → Green lights"
