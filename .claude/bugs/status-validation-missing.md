---
id: BUG-001
title: status 필드 검증 부재
severity: medium
status: known
target_step: step-5
---

# Status 필드 검증 부재 (BUG-001)

## 개요

`PUT /api/tasks/:id` 요청에서 `status` 필드에 임의의 문자열을 전송해도 **검증 오류 대신 그대로 데이터베이스에 저장**되는 문제입니다.

---

## 예상 결과 (Expected Behavior)

**요청**:
```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{ "status": "invalid_status_value" }'
```

**기대하는 응답** (400 Bad Request):
```json
{
  "status": 400,
  "body": {
    "error": "유효하지 않은 status 입니다"
  }
}
```

---

## 실제 결과 (Actual Behavior)

**요청**: (위와 동일)

**실제 응답** (200 OK):
```json
{
  "status": 200,
  "body": {
    "id": 1,
    "title": "태스크 제목",
    "status": "invalid_status_value",
    "description": null,
    "assignee": null,
    "created_at": "2026-07-13 14:30:00"
  }
}
```

**결과**: `invalid_status_value`가 데이터베이스에 저장됨 (validation 통과)

---

## 재현 조건 (Reproduction Steps)

### 1단계: 정상 태스크 생성
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{ "title": "테스트 태스크", "status": "todo" }'

# 응답에서 id 획득 (예: id=1)
```

### 2단계: 유효하지 않은 status로 갱신
```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{ "status": "completed" }'  # 유효한 값: todo, in_progress, done 만 허용 예정

# 또는

curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{ "status": "INVALID" }'  # 아무 값이나 가능
```

### 3단계: 데이터 확인
```bash
curl http://localhost:3000/api/tasks/1

# status 필드가 "completed" 또는 "INVALID"로 저장됨 확인
```

### 유효하지 않은 status 값 예시
- `"completed"` (올바른 값은 `"done"`)
- `"INVALID"`
- `"pending_approval"`
- `""` (빈 문자열)
- `null`
- `123` (숫자)

---

## 오류 로그 (Error Logs)

**로그 없음** — 에러가 발생하지 않음

```
// PUT /api/tasks/1 with status=INVALID
// → 200 OK (에러 로그 없음)
// → DB에 "INVALID" 값 그대로 저장됨
```

---

## 근본 원인 (Root Cause)

### 코드 위치

**파일**: `controllers/taskController.js` (line 5-10)
```javascript
function validateTaskInput(body) {
  if (!body || !body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return { valid: false, message: 'title 은 필수입니다' };
  }
  return { valid: true };  // ← status 검증 없음!
}
```

**현재 상태**:
- ✅ `title` 검증: O (필수, 비어있지 않음)
- ✅ `description` 검증: X (선택)
- ✅ `status` 검증: X ⚠️ (선택이지만 화이트리스트 있어야 함)
- ✅ `assignee` 검증: X (선택)

### CLAUDE.md 규약 위배

**CLAUDE.md - Current limitations** 섹션:
> `status` field has no whitelist validation (accepts any string). This is intentional—step-5 adds enum validation.

이는 **의도적인 제한사항**이며, step-5에서 수정 예정입니다.

---

## 영향 범위 (Impact)

### 데이터 무결성 (High)
- ❌ `status` 컬럼에 임의의 값 저장 가능
- ❌ 데이터 일관성 위험: status enum 값 외의 값 존재 가능
- ❌ 향후 status 기반 쿼리 결과 예측 불가능

### 예시
```javascript
// status가 제대로 검증되지 않으면:
const tasks = taskService.getAll({ status: 'todo' });  // 정상 값만 반환
// 하지만 DB에는 'TODO', 'PENDING', 'INVALID' 같은 값이 섞여 있을 수 있음

// status 기반 필터링이 정확하지 않음
// → 사용자가 기대하는 결과와 실제 결과 불일치
```

### API 계약 위반 (Medium)
- ⚠️ `.claude/rules/error-mapping.md`에서 정의한 `400 Bad Request` 응답이 반환되지 않음
- ⚠️ 테스트 가정: status enum이 있을 것 (하지만 실제로는 없음)

### 클라이언트 오류 처리 (Medium)
- ❌ 클라이언트가 잘못된 status 입력 시 400을 기대하지만, 200을 받음
- ❌ 에러 처리 로직이 작동하지 않음
- ❌ 데이터가 조용히 저장되어 문제 감지 어려움

### 데이터 마이그레이션 (High)
- ⚠️ step-5에서 status enum을 추가할 때, 기존 유효하지 않은 값들을 정리해야 함
- ⚠️ 마이그레이션 스크립트 필요 가능성

---

## 해결 방법 (Solution)

### 임시 해결책 (Workaround) — Now

**없음** — 클라이언트가 유효한 status 값만 전송하도록 주의

**유효한 status 값**:
- `"todo"` (기본값)
- `"in_progress"` (진행 중)
- `"done"` (완료)

---

### 영구 해결책 (Fix) — Step-5

**구현 대상**: `controllers/taskController.js` - `validateTaskInput()`

```javascript
const VALID_STATUSES = ['todo', 'in_progress', 'done'];

function validateTaskInput(body) {
  if (!body || !body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return { valid: false, message: 'title 은 필수입니다' };
  }
  
  // Step-5: status 검증 추가
  if (body.status !== undefined && body.status !== null) {
    if (!VALID_STATUSES.includes(body.status)) {
      return { valid: false, message: '유효하지 않은 status 입니다' };
    }
  }
  
  return { valid: true };
}
```

**변경 파일**:
1. `controllers/taskController.js` — validateTaskInput() 확장
2. `tests/taskController.test.js` — status 검증 테스트 추가
3. `.claude/rules/error-mapping.md` — status 오류 메시지 추가
4. `CLAUDE.md` — Current limitations 업데이트

**테스트 케이스** (추가 예정):
- ✅ 유효한 status ('todo', 'in_progress', 'done')
- ❌ 유효하지 않은 status ('INVALID', 'pending', 'completed')
- ❌ 잘못된 타입 (123, null, 배열)

---

## 관련 문서

- **CLAUDE.md** — "Current limitations" 섹션 (의도적 제한)
- **.claude/rules/error-mapping.md** — HTTP 400 에러 정의
- **tests/taskController.test.js** — 현재 테스트 (status 검증 없음)

---

## 버그 추적

| 항목 | 값 |
|------|-----|
| ID | BUG-001 |
| 심각도 | Medium (데이터 무결성) |
| 상태 | Known / By Design (step-5까지 의도적 제한) |
| 발견일 | 2026-07-13 (필터링 기능 추가 시) |
| 대상 단계 | step-5 |
| 작업자 | [미할당] |

---

## 참고

이 버그는 **의도적인 설계 선택**입니다:
- Step-0 (현재): status enum 검증 없음 (아무 값이나 허용)
- Step-5 (향후): status enum 검증 추가 (화이트리스트: todo, in_progress, done)

CLAUDE.md의 "Course Progression" 섹션에 명시되어 있습니다.
