---
name: fix-bug
description: 버그 수정 (6단계) — 재현 우선 (Red → Green), 부작용 검증
when_to_use: |
  "이 기능이 동작 안 해", "이 경우에 에러가 나", "데이터가 잘못 저장돼", 
  "API가 잘못된 상태 코드 반환해", "테스트가 실패해"
input: |
  - bugDescription: 버그 설명 또는 증상 (필수)
  - affectedComponent: 영향받는 파일/함수 (선택)
  - severity: 심각도 (선택: low, medium, high, critical)
---

# Fix Bug Skill — 재현 우선

**핵심 원칙**: 절대 먼저 고치지 말 것. **재현 테스트를 먼저 작성하고, 그 테스트가 실패하는 것을 확인한 후에 수정한다.**

**모토**: "Red → Green" — 실패하는 테스트(Red)를 먼저 만들고, 그걸 통과시키기 위해 수정(Green)한다.

**철학**: 버그는 "실패하는 테스트"로 정의된다. 재현 테스트 없이 수정하면, 같은 버그가 다시 발생할 수 있다.

---

## 작업 흐름 (6단계 — 절대 순서 바꾸지 않기)

### 1️⃣ 버그 정보 구조화

**목표**: 버그를 정확히 파악하고 재현 가능한 형태로 정리합니다.

**수집 항목**:

| 항목 | 설명 | 예시 |
|------|------|------|
| **버그 제목** | 한 줄 요약 | "status 필드 검증 없음" |
| **예상 결과** | 정상 동작 시 기대값 | HTTP 400 + error message |
| **실제 결과** | 현재 버그 증상 | HTTP 200 + 잘못된 값 저장 |
| **재현 조건** | 버그를 일으키는 조작 단계 | curl 명령어 또는 API 호출 시나리오 |
| **오류 로그** | 스택 트레이스 또는 에러 메시지 | (없음) 또는 (종류/위치) |
| **영향 범위** | 버그의 영향 (데이터/기능/성능) | data-integrity, api-contract, feature |

**산출물 형식**:

```markdown
# 버그: status 필드 검증 없음

## 예상 결과
PUT /api/tasks/1 에 status="INVALID" 전송
→ HTTP 400 + { error: "유효하지 않은 status 입니다" }

## 실제 결과
PUT /api/tasks/1 에 status="INVALID" 전송
→ HTTP 200 + { status: "INVALID" } (DB에 저장됨)

## 재현 조건
1. curl -X PUT http://localhost:3000/api/tasks/1 -d '{"status":"INVALID"}'
2. GET /api/tasks/1 → status="INVALID"로 저장되어 있음

## 오류 로그
없음 (조용한 실패)

## 영향 범위
- 데이터 무결성: HIGH (enum 외 값 저장 가능)
- API 계약: MEDIUM (400 정의와 불일치)
```

---

### 2️⃣ 헤드리스 파이프로 원인 좁히기

**목표**: 버그가 어디서 발생하는지 코드 위치를 특정합니다.

**작업**:

```bash
# 1. 로그/오류 메시지에서 파일/라인 번호 추출
npm test 2>&1 | grep -E "Error|at |line"

# 2. 소스 코드에서 버그 패턴 찾기
grep -r "status" services/ controllers/ tests/

# 3. 제어 흐름 추적
# Request → Route → Controller → Service → DB
# 각 계층에서 status 처리 확인
```

**예시**:
```
버그 증상: status validation 없음
↓
Route: GET /api/tasks/:id → controller.update 호출
↓
Controller: taskController.update() → status를 검증하지 않음
         (validateTaskInput()이 title만 검증)
↓
Service: taskService.update() → status를 그대로 DB에 저장
↓
Database: tasks 테이블에 INVALID status 저장 ✗

원인 위치: controllers/taskController.js - validateTaskInput() 함수
          (line 5-10) - status 검증 로직 누락
```

**산출물**: 원인 위치 특정
```
# 버그 근본 원인
- 파일: controllers/taskController.js
- 함수: validateTaskInput()
- 라인: 5-10
- 문제: status 필드에 대한 화이트리스트 검증 없음
```

---

### 3️⃣ 재현 테스트 먼저 작성 (🔴 Red)

**⚠️ 가장 중요한 단계 — 절대 수정하지 말 것**

**목표**: 버그를 "실패하는 테스트"로 정의합니다.

**원칙**:
- 테스트는 **실패해야** 함 (Red)
- 아직 버그를 고치지 **않음**
- 테스트 파일에만 추가 (소스 코드 수정 금지)
- 이 테스트는 버그를 "증명"하는 것

**테스트 작성 위치**: `tests/taskController.test.js` 또는 `tests/taskService.test.js`

**예시**:

```javascript
describe('버그: status 필드 검증 없음', () => {
  describe('status 검증 (현재 실패)', () => {
    it('유효하지 않은 status는 400을 반환해야 한다', async () => {
      // Arrange
      const task = taskService.create({ title: 'Test' });
      
      // Act
      const res = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ status: 'INVALID' });
      
      // Assert
      expect(res.status).toBe(400);  // ← 현재 실패 (200 반환함)
      expect(res.body.error).toBe('유효하지 않은 status 입니다');
    });

    it('유효한 status (todo/in_progress/done)만 허용해야 한다', async () => {
      const task = taskService.create({ title: 'Test' });
      
      const validStatuses = ['todo', 'in_progress', 'done'];
      for (const status of validStatuses) {
        const res = await request(app)
          .put(`/api/tasks/${task.id}`)
          .send({ status });
        
        expect(res.status).toBe(200);  // ← 현재 통과
        expect(res.body.status).toBe(status);
      }
    });

    it('빈 문자열 status는 400을 반환해야 한다', async () => {
      const task = taskService.create({ title: 'Test' });
      
      const res = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ status: '' });
      
      expect(res.status).toBe(400);  // ← 현재 실패
    });

    it('null status는 400을 반환해야 한다', async () => {
      const task = taskService.create({ title: 'Test' });
      
      const res = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ status: null });
      
      expect(res.status).toBe(400);  // ← 현재 실패
    });
  });
});
```

**테스트 실행**:
```bash
npm test -- --testNamePattern="status 검증"

# ❌ FAIL tests/taskController.test.js
#     ✕ 유효하지 않은 status는 400을 반환해야 한다
#     ✕ 빈 문자열 status는 400을 반환해야 한다
#     ✕ null status는 400을 반환해야 한다
#     ✓ 유효한 status는 허용해야 한다
```

**체크리스트**:
- [ ] 테스트가 작성됨
- [ ] npm test 실행 시 **실패** 확인 (Red ✗)
- [ ] 버그가 명확히 "증명"됨
- [ ] 아직 소스 코드 수정 안 함 ⚠️

---

### 4️⃣ 수정안 두세 개 비교와 부작용 점검

**목표**: 여러 수정 방법을 비교하고, 부작용(side effects)을 미리 파악합니다.

**수정안 후보 생성**:

#### 수정안 A: Controller에서 검증 (추천)
```javascript
const VALID_STATUSES = ['todo', 'in_progress', 'done'];

function validateTaskInput(body) {
  if (!body || !body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return { valid: false, message: 'title 은 필수입니다' };
  }
  
  // ← 새로 추가
  if (body.status !== undefined && body.status !== null) {
    if (!VALID_STATUSES.includes(body.status)) {
      return { valid: false, message: '유효하지 않은 status 입니다' };
    }
  }
  
  return { valid: true };
}
```

**부작용 분석**:
- ✅ API 계약에 맞음 (400 에러 반환)
- ✅ 테스트 기대 결과와 일치
- ✅ 다른 엔드포인트 영향 없음 (validation은 controller 책임)
- ✓ 롤백 용이 (Controller 수정만)

#### 수정안 B: Service에서 검증
```javascript
function create({ title, description, assignee, status }) {
  if (status && !['todo', 'in_progress', 'done'].includes(status)) {
    throw new Error('유효하지 않은 status');
  }
  // ...
}
```

**부작용 분석**:
- ❌ 에러가 Exception으로 발생 (HTTP 500 반환 가능성)
- ❌ Service는 validation을 하지 않는다는 아키텍처 규칙 위배
- ❌ 테스트 기대값(400)과 불일치
- ✓ 다른 서비스도 status 검증 필요 (중복 코드)

#### 수정안 C: DB 레벨 제약 조건
```sql
CREATE TABLE tasks (
  ...
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  ...
)
```

**부작용 분석**:
- ❌ DB 스키마 변경 (마이그레이션 필요)
- ❌ 에러가 SQL exception → HTTP 500 (사용자 친화적이 아님)
- ❌ 유효하지 않은 데이터 이미 존재 시 마이그레이션 실패
- ❌ API 에러 메시지 개선 불가

**비교 결과**:

| 수정안 | 아키텍처 | 에러 처리 | 테스트 | 부작용 | 권장도 |
|--------|---------|---------|--------|--------|--------|
| **A: Controller** | ✅ 정확 | ✅ 400 | ✅ 일치 | ✅ 최소 | 🟢 추천 |
| B: Service | ❌ 위배 | ❌ 500 | ❌ 불일치 | ❌ 중복 | 🔴 비추천 |
| C: DB 제약 | ✅ 안전 | ❌ 500 | ❌ 불일치 | ❌ 마이그레이션 | 🟡 차순 |

**결정**: 수정안 A 선택

---

### 5️⃣ 근본 원인 제거 적용 (🟢 Green)

**목표**: 선택된 수정안을 코드에 적용합니다.

**작업**:
1. 최소 단위로 수정 (한 함수만)
2. 테스트와 정확히 일치하는 수정
3. 추가 기능 구현 금지

**수정 코드** (수정안 A 적용):

```javascript
// controllers/taskController.js

const VALID_STATUSES = ['todo', 'in_progress', 'done'];

function validateTaskInput(body) {
  if (!body || !body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return { valid: false, message: 'title 은 필수입니다' };
  }
  
  // Step-5: status 화이트리스트 검증
  if (body.status !== undefined && body.status !== null) {
    if (!VALID_STATUSES.includes(body.status)) {
      return { valid: false, message: '유효하지 않은 status 입니다' };
    }
  }
  
  return { valid: true };
}
```

**변경 파일**: `controllers/taskController.js` (한 파일만)

**체크리스트**:
- [ ] 수정 코드 작성 (소스만, 테스트 아님)
- [ ] 한 함수/파일만 수정 (범위 최소화)
- [ ] 테스트 기대값과 정확히 일치
- [ ] 추가 기능 구현 안 함 (버그 수정만)

---

### 6️⃣ 회귀 테스트 통과 확인

**목표**: 수정이 정상 동작하고, 다른 기능을 깨뜨리지 않았는지 확인합니다.

**작업**:

#### Step 1: 버그 재현 테스트 실행 (🟢 Green이어야 함)
```bash
npm test -- --testNamePattern="status 검증"

# ✅ PASS tests/taskController.test.js
#     ✓ 유효하지 않은 status는 400을 반환해야 한다
#     ✓ 유효한 status는 허용해야 한다
#     ✓ 빈 문자열 status는 400을 반환해야 한다
#     ✓ null status는 400을 반환해야 한다
```

#### Step 2: 전체 테스트 통과 확인 (회귀 없음)
```bash
npm test

# ✅ Test Suites: 2 passed, 2 total
# ✅ Tests: 59 passed, 59 total
```

#### Step 3: 기존 기능이 깨지지 않았는지 점검
```bash
# 유효한 status로 업데이트 (기존 기능)
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'

# → HTTP 200, status="done" 저장됨 ✓

# 유효하지 않은 status로 업데이트 (버그 수정)
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"INVALID"}'

# → HTTP 400, error 메시지 반환 ✓
```

**체크리스트**:
- [ ] 재현 테스트 모두 통과 (🟢 Green)
- [ ] 전체 테스트 통과 (회귀 없음)
- [ ] 유효한 값은 여전히 작동
- [ ] 무효한 값은 거부됨

---

## 절대 하지 말 것 (금지 사항)

### ❌ 순서 뒤바꾸기

```
❌ 나쁜 순서:
1. 소스 코드 수정 (버그 고치기)
2. 테스트 작성 (수정 검증)
3. 테스트 실행

✅ 올바른 순서:
1. 버그 정보 구조화
2. 원인 파악
3. 재현 테스트 작성 (Red)
4. 수정안 검토
5. 버그 수정 (Green)
6. 전체 테스트 통과 (회귀 확인)
```

### ❌ 재현 테스트 없이 수정

```javascript
// ❌ 하지 말 것: 재현 테스트 없이 그냥 수정
// 코드만 수정하고 넘어감
function validateTaskInput(body) {
  if (body.status && !['todo', 'in_progress', 'done'].includes(body.status)) {
    return { valid: false, message: '유효하지 않은 status 입니다' };
  }
  // ...
}

// 문제: 같은 버그가 다시 발생해도 모를 수 있음
```

### ❌ 과도한 수정

```javascript
// ❌ 버그만 수정해야 하는데 다른 것까지 수정
function validateTaskInput(body) {
  // 원래 목표: status 검증만
  
  // But 추가로:
  if (body.title && body.title.length > 255) {  // ← 범위 확대
    return { valid: false, message: '제목이 너무 길어요' };
  }
  
  if (body.description && body.description.length > 1000) {  // ← 범위 확대
    return { valid: false, message: '설명이 너무 길어요' };
  }
  
  // 이건 버그 수정이 아니라 기능 추가임!
}
```

### ❌ 테스트 수정으로 녹색 만들기

```javascript
// ❌ 하지 말 것: 버그는 안 고치고 테스트만 수정
// Before (올바른 테스트)
it('유효하지 않은 status는 400을 반환해야 한다', async () => {
  const res = await request(app)
    .put(`/api/tasks/1`)
    .send({ status: 'INVALID' });
  
  expect(res.status).toBe(400);  // ← 올바른 기대값
});

// After (잘못된 수정)
it('유효하지 않은 status는 200을 반환한다', async () => {
  // ← 테스트를 기대값에 맞추지 말고 코드를 테스트에 맞춰야 함!
  expect(res.status).toBe(200);  // ← 버그 호응형 테스트
});
```

---

## 안티패턴 예시

### ❌ 나쁜 버그 수정 흐름

```bash
# 1. 버그 보고 받음
# 2. 바로 소스 코드 수정
# 3. npm test 실행
# 4. 통과하니까 끝

# 문제:
# - 재현 테스트 없음
# - 같은 버그 반복 가능
# - 부작용 미확인
# - 추후 유지보수 어려움
```

### ✅ 좋은 버그 수정 흐름

```bash
# 1. 버그 정보 수집 (예상, 실제, 재현 조건, 영향)
# 2. 원인 파악 (코드 위치, 함수)
# 3. 재현 테스트 작성 → npm test → ❌ 실패 확인 (Red)
# 4. 수정안 여러 개 검토 (부작용, 아키텍처)
# 5. 최선의 수정안 적용 (최소 변경)
# 6. npm test → ✅ 통과 (Green)
# 7. 전체 회귀 테스트 → ✅ 통과

# 장점:
# - 버그가 재현되고 증명됨
# - 같은 버그는 다시 안 생김
# - 부작용 최소화
# - 유지보수 용이 (테스트 존재)
```

---

## 도움 되는 명령어

```bash
# 1. 버그 확인 (현재 동작)
npm test
npm test -- --testNamePattern="status"

# 2. 재현 테스트만 실행 (아직 실패해야 함)
npm test -- tests/taskController.test.js --testNamePattern="status 검증"

# 3. 특정 테스트 상세 출력
npm test -- tests/taskController.test.js --verbose

# 4. 버그 수정 후 전체 검증
npm test

# 5. 영향받은 코드 찾기
grep -r "status" controllers/ services/ tests/
```

---

## 체크리스트: 버그 수정 완료 기준

### 1️⃣ 버그 정보 구조화
- [ ] 예상 결과 명확
- [ ] 실제 결과 명확
- [ ] 재현 조건 작성
- [ ] 영향 범위 파악

### 2️⃣ 원인 파악
- [ ] 파일 특정
- [ ] 함수 특정
- [ ] 라인 번호 확인

### 3️⃣ 재현 테스트 작성 (🔴 Red)
- [ ] 테스트 작성
- [ ] npm test 실행
- [ ] ❌ 실패 확인
- [ ] 버그 명확히 증명됨

### 4️⃣ 수정안 검토
- [ ] 후보안 3개 비교
- [ ] 부작용 분석
- [ ] 최선안 선택

### 5️⃣ 버그 수정 (🟢 Green)
- [ ] 최소 단위 수정
- [ ] 한 파일만 변경
- [ ] 테스트 기대값과 정확히 일치

### 6️⃣ 회귀 테스트 (✅ All Green)
- [ ] 재현 테스트 통과 (🟢)
- [ ] 전체 테스트 통과 (🟢)
- [ ] 수동 검증 완료 (curl, 브라우저)

---

## 다음 단계

수정 완료 후:
1. ✅ 모든 테스트 통과
2. ✅ 버그 증명 테스트 포함
3. ✅ 회귀 테스트 통과
4. ✅ git commit (버그 수정 및 테스트)

```bash
git commit -m "fix: add status field validation

Validate status field to prevent invalid enum values.
- status must be one of: 'todo', 'in_progress', 'done'
- Invalid status now returns HTTP 400 with error message

Test: added regression tests to prevent recurrence
- testNamePattern='status 검증'
- All 59 tests passing (no regression)"
```

---

## 참고

### 버그 수정 vs 기능 개발

| 구분 | 버그 수정 | 기능 개발 |
|------|---------|---------|
| **목표** | 예상 동작으로 복구 | 새로운 동작 추가 |
| **테스트** | 재현 + 회귀 | 새로운 사례 |
| **범위** | 최소 (한 함수) | 광범위 (여러 계층) |
| **부작용** | 0 (기존 기능 유지) | 점검 필요 |

### 재현 우선의 이점

1. **증명**: 버그가 실제로 존재한다는 것을 증명
2. **방지**: 같은 버그가 다시 발생하는 것을 방지
3. **검증**: 수정이 정확하다는 것을 확인
4. **회귀**: 다른 기능이 깨지지 않았음을 보증
5. **유지보수**: 미래의 개발자가 왜 이 코드가 있는지 이해 가능

---

**스킬 버전**: 1.0  
**핵심 원칙**: "Red → Green" — 재현 테스트 우선  
**모토**: "절대 먼저 고치지 말 것"
