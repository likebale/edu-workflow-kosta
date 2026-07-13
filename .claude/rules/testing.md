# Testing Rules — TaskFlow

이 규칙은 모든 테스트 작성자가 따라야 할 표준을 정의합니다.

---

## 1. 프레임워크 & 스타일

### 도구
- **프레임워크**: Jest 29.7.0+
- **HTTP 테스트**: supertest 7.0.0
- **실행**: `npm test` (단일 파일: `npm test -- tests/FILE.test.js`)

### 파일 구조
```
tests/
├── taskService.test.js       # 서비스 계층 (단위 테스트)
├── taskController.test.js    # 컨트롤러/HTTP (통합 테스트)
└── ...                        # 향후: notifications, email 등
```

### describe/it 구조
```javascript
describe('단위 구분 (기능명 또는 엔드포인트)', () => {
  describe('정상 경로', () => {
    it('입력이 유효하면 결과를 반환한다', () => {
      // test body
    });
  });

  describe('실패 경로', () => {
    it('입력이 잘못되면 에러를 반환한다', () => {
      // test body
    });
  });
});
```

**명명 규칙**:
- `describe`: 기능명 (create, update, remove) 또는 엔드포인트 (POST /api/tasks, PUT /api/tasks/:id)
- `it`: 한국어 또는 영어 (명확함 우선)
  - 입력/상태 + "→" + 기대 결과
  - 예: `'제목이 없으면 400 을 반환한다'`, `'존재하지 않는 id를 삭제하면 404 를 반환한다'`

---

## 2. 조건 짝짓기 (Happy Path ↔ Error Path)

**원칙**: 모든 정상 경로마다 대응하는 실패 경로를 반드시 짝짓는다.

### 패턴

```javascript
describe('기능명', () => {
  // ✅ 정상 경로: 입력 유효, 리소스 존재, 권한 있음
  describe('정상 경로', () => {
    it('입력이 유효하면 성공한다', () => {
      const result = functionUnderTest(validInput);
      expect(result).toBe(expectedOutput);
    });
  });

  // ❌ 실패 경로: 각각의 실패 조건
  describe('실패 경로', () => {
    it('입력 A가 유효하지 않으면 에러 X를 반환한다', () => {
      expect(() => functionUnderTest(invalidInputA)).toThrow(ErrorX);
    });

    it('입력 B가 유효하지 않으면 에러 Y를 반환한다', () => {
      expect(() => functionUnderTest(invalidInputB)).toThrow(ErrorY);
    });

    it('리소스가 없으면 null/undefined를 반환한다', () => {
      const result = functionUnderTest(nonExistentId);
      expect(result).toBeUndefined();
    });
  });
});
```

### 조건 짝짓기 체크리스트

각 기능마다 다음을 확인하세요:

| 정상 경로 | 대응하는 실패 경로 | 확인 |
|---------|-----------------|------|
| 유효한 title | title 없음, 빈 문자열, 공백만 | ✅ |
| 유효한 status | 유효하지 않은 status, null, 타입 오류 | ✅ |
| 리소스 존재 | 리소스 없음 (id 미존재) | ✅ |
| 담당자 있음 | 담당자 없음 (null/빈 문자열) | ✅ |
| 상태 변경 | 상태 동일 (변경 없음) | ✅ |

**예시** (update 함수):
```javascript
describe('update', () => {
  describe('정상 경로', () => {
    it('유효한 id와 필드면 업데이트한다', () => {
      const updated = taskService.update(1, { status: 'done' });
      expect(updated.status).toBe('done');
    });

    it('여러 필드를 동시에 업데이트할 수 있다', () => {
      const updated = taskService.update(1, { title: '새 제목', status: 'done' });
      expect(updated.title).toBe('새 제목');
      expect(updated.status).toBe('done');
    });
  });

  describe('실패 경로', () => {
    it('존재하지 않는 id면 null을 반환한다', () => {
      const result = taskService.update(999, { status: 'done' });
      expect(result).toBeNull();
    });

    it('빈 업데이트 객체도 허용한다 (부분 업데이트)', () => {
      const updated = taskService.update(1, {});
      expect(updated).toBeDefined();  // 기존 값 유지
    });
  });
});
```

---

## 3. HTTP 상태 코드 매핑

**CLAUDE.md REST API 규약과 일치시키세요.**

### 상태 코드 정의

| 코드 | 의미 | 언제 | 응답 본문 | 테스트 |
|------|------|------|---------|--------|
| **200** | OK (조회/수정 성공) | GET, PUT 성공 | JSON 객체 | `expect(res.status).toBe(200)` |
| **201** | Created (생성 성공) | POST 성공 | JSON 객체 (id 포함) | `expect(res.status).toBe(201)` |
| **204** | No Content (삭제 성공) | DELETE 성공 | 없음 (empty) | `expect(res.status).toBe(204)` |
| **400** | Bad Request (검증 실패) | title 없음, 빈 문자열, 타입 오류 | `{error: "message"}` | `expect(res.status).toBe(400)` |
| **404** | Not Found (리소스 없음) | 존재하지 않는 id 접근 | `{error: "태스크를 찾을 수 없습니다"}` | `expect(res.status).toBe(404)` |
| **500** | Server Error (미처리 예외) | DB 오류, 프로그래밍 오류 | `{error: "서버 에러"}` 또는 없음 | `expect(res.status).toBe(500)` |

### 에러 메시지 매핑

**다음 에러는 반드시 이 메시지를 사용하세요:**

```javascript
// 400 Bad Request
const errors = {
  MISSING_TITLE: 'title 은 필수입니다',
  INVALID_STATUS: '유효하지 않은 status 입니다',
  INVALID_ASSIGNEE_TYPE: 'assignee 는 문자열이어야 합니다',
  EMPTY_UPDATE: '업데이트할 필드가 없습니다',  // 선택: 허용 가능
};

// 404 Not Found
const notFoundErrors = {
  TASK_NOT_FOUND: '태스크를 찾을 수 없습니다',
  NOTIFICATION_NOT_FOUND: '알림을 찾을 수 없습니다',
};
```

### 테스트 예시

```javascript
describe('POST /api/tasks', () => {
  it('제목이 없으면 400 을 반환한다', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ assignee: '김개발' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title 은 필수입니다');
  });

  it('유효한 입력이면 201 과 태스크를 반환한다', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '새 태스크', assignee: '김개발' });
    
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('새 태스크');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('존재하는 id면 204 를 반환한다', async () => {
    const task = await request(app)
      .post('/api/tasks')
      .send({ title: '삭제할 태스크' });
    
    const res = await request(app)
      .delete(`/api/tasks/${task.body.id}`);
    
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});  // 응답 본문 없음
  });

  it('존재하지 않는 id면 404 를 반환한다', async () => {
    const res = await request(app)
      .delete('/api/tasks/999');
    
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
  });
});
```

---

## 4. Mock 사용 기준

### 원칙
- **Service 계층**: Mock 최소화 → 실제 인메모리 DB 사용
- **Controller 테스트**: 서비스는 실제 구현 사용 (통합 테스트)
- **외부 의존성** (이메일, Slack, API): Mock 필수

### Mock이 필요한 경우

| 대상 | Mock 여부 | 사유 | 방법 |
|------|---------|------|------|
| **Database (SQLite)** | ❌ 불필요 | 단위 테스트도 실제 DB 사용 (빠름, 격리됨) | `beforeEach`에서 테이블 정리 |
| **Service 호출** | ❌ 불필요 | Controller 테스트도 실제 서비스 사용 (통합) | 테스트 DB에서 실행 |
| **Email (Nodemailer)** | ✅ 필수 | 외부 서비스, 느림, 비용 | `jest.mock('nodemailer')` |
| **Slack Webhook** | ✅ 필수 | HTTP 요청, 외부 서비스 | `jest.mock('axios')` |
| **내부 함수** | ❌ 불필요 | 통합 테스트 권장 | Mock 대신 실제 경로 테스트 |
| **Date.now()** | ✅ 필수 | 시간 기반 동작 검증 시 | `jest.useFakeTimers()` |

### Mock 예시

```javascript
// ❌ 하지 말 것: Service Mock (불필요)
jest.mock('../services/taskService');
taskService.create.mockReturnValue({ id: 1, title: 'test' });

// ✅ 할 것: 외부 의존성 Mock
jest.mock('nodemailer');
nodemailer.createTransport.mockReturnValue({
  sendMail: jest.fn().mockResolvedValue({ response: 'OK' }),
});

// ✅ 할 것: HTTP Mock
jest.mock('axios');
axios.post.mockResolvedValue({ status: 200, data: { ok: true } });

// ✅ 할 것: 시간 Mock
jest.useFakeTimers();
jest.setSystemTime(new Date('2026-07-13').getTime());
```

### Mock 정리 규칙

```javascript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});
```

---

## 5. 격리 (Isolation) & 회귀 (Regression)

### 격리 원칙

각 테스트는 독립적이어야 합니다.

```javascript
beforeEach(() => {
  // 1. 테스트 DB 초기화 (모든 테스트 전)
  const tasks = taskService.getAll();
  tasks.forEach(t => taskService.remove(t.id));
  
  // 2. Mock 초기화
  jest.clearAllMocks();
});

afterEach(() => {
  // 1. 데이터 정리 (선택: beforeEach로 충분)
  const tasks = taskService.getAll();
  tasks.forEach(t => taskService.remove(t.id));
  
  // 2. Mock 리셋
  jest.resetAllMocks();
});

afterAll(() => {
  // 전역 정리 (DB 연결 종료 등)
  // (Jest 자동 정리로 충분한 경우 생략 가능)
});
```

### 회귀 방지

각 버그 수정 후 **회귀 테스트를 추가하세요:**

```javascript
describe('회귀 테스트', () => {
  it('[#123] 상태 enum 검증이 없으면 임의의 값이 저장되는 버그 수정', () => {
    // 수정 전: 'invalid_status' 저장 가능
    // 수정 후: 400 에러 반환
    const res = request(app)
      .put('/api/tasks/1')
      .send({ status: 'invalid_status' });
    expect(res.status).toBe(400);
  });
});
```

---

## 6. 실행 명령

### 전체 테스트 실행
```bash
npm test
```

### 단일 파일 실행
```bash
npm test -- tests/taskService.test.js
npm test -- tests/taskController.test.js
```

### 특정 테스트만 실행
```bash
npm test -- --testNamePattern="상태 변경"
npm test -- --testNamePattern="404"
```

### Watch 모드 (개발 중)
```bash
npm test -- --watch
```

### 커버리지 리포트
```bash
npm test -- --coverage
```

---

## 7. 완료 조건

테스트 작성이 완료되려면 **모든 조건을 만족해야 합니다:**

### 필수 조건

- [ ] **모든 테스트 통과**: `npm test` 결과 0 실패
- [ ] **조건 짝짓기**: 정상 경로 ↔ 실패 경로 완전한 쌍
- [ ] **상태 코드 검증**: 400, 404, 201, 204, 200, 500 규약 준수
- [ ] **에러 메시지**: 일관된 메시지 사용 (오타/대소문자 일치)
- [ ] **격리**: 테스트 간 영향 없음 (테스트 순서 무관)
- [ ] **회귀**: 기존 버그는 테스트로 보호
- [ ] **커버리지**: Service 90%+, Controller 80%+ (Step-6까지 목표)

### 체크리스트 (각 기능마다)

```markdown
## [기능명] 테스트 완료 체크리스트

### 테스트 작성
- [ ] describe 구조 (정상/실패 분리)
- [ ] it 명명 규칙 (입력 → 결과)
- [ ] Happy path 작성
- [ ] Error path 작성 (≥2개)

### 상태 코드
- [ ] 성공 코드 (200/201/204)
- [ ] 검증 실패 (400)
- [ ] 리소스 없음 (404)
- [ ] 에러 메시지 CLAUDE.md와 일치

### 격리 & 회귀
- [ ] beforeEach/afterEach 설정
- [ ] Mock 초기화
- [ ] 회귀 테스트 (이전 버그)

### 실행 & 통과
- [ ] npm test 통과
- [ ] 커버리지 확인
- [ ] 단일 파일 실행 (npm test -- FILE.test.js) 통과
```

---

## 8. 실패 시 행동

테스트가 실패하면 **반드시 따르세요:**

### 1단계: 실패 원인 파악

```bash
npm test -- tests/taskController.test.js --verbose
```

출력에서:
- 어느 테스트가 실패했는가?
- 기대값 vs 실제값?
- 에러 메시지는?

### 2단계: 원인 분류

| 원인 | 해결 방법 | 예시 |
|------|---------|------|
| **테스트 코드 오류** | 테스트 수정 | `expect(res.status).toBe(201)` ← 200으로 수정 |
| **상태 코드 오류** | Controller 수정 (CLAUDE.md 규약 재확인) | `res.status(404)` ← 400 오류로 변경 |
| **에러 메시지 불일치** | Controller 메시지 수정 (CLAUDE.md 규약 확인) | `error: '태스크를 찾을 수 없습니다'` |
| **Service 로직 오류** | Service 구현 수정 | `update()` COALESCE 로직 확인 |
| **격리 문제** (다른 테스트 영향) | beforeEach/afterEach 강화 | `taskService.remove(t.id)` 추가 |
| **Mock 설정 오류** | Mock 재설정 | `jest.clearAllMocks()` 추가 |

### 3단계: 수정 & 재실행

```bash
# 1. 원인에 따라 수정 (테스트 또는 소스)
# 2. 해당 테스트만 재실행
npm test -- tests/FILE.test.js --testNamePattern="실패한테스트이름"

# 3. 전체 테스트 재실행
npm test
```

### 4단계: 회귀 확인

```bash
# 같은 파일의 다른 테스트가 깨졌는가?
npm test -- tests/FILE.test.js

# 다른 파일도 영향받았는가?
npm test
```

### 예시: 실패 처리 과정

```bash
$ npm test
 FAIL  tests/taskController.test.js
  ✓ POST /api/tasks (valid input)
  ✗ DELETE /api/tasks/:id (not found)
    Expected: 404
    Received: 400

$ npm test -- tests/taskController.test.js --testNamePattern="DELETE.*not found" --verbose
# 에러 상세 출력

# 원인: 404 대신 400을 반환하고 있음
# 해결: controllers/taskController.js의 remove() 함수 확인
# → taskService.remove()가 false 반환 시 404인지 확인
# → 아니면 에러 메시지 변경

$ npm test
# 모든 테스트 재실행 → 통과 확인
```

---

## 9. 레이어별 테스트 책임

### Services 테스트 (taskService.test.js)

```javascript
// 책임: CRUD 로직만 (SQL 제외, DB와 실제 통합)
describe('taskService', () => {
  // DB 초기화
  beforeAll(() => { initDb(); });
  beforeEach(() => { /* 정리 */ });

  // 각 함수별 happy + error path
  describe('create', () => {
    it('[happy] 새 태스크를 저장한다');  // ✅ 필수
    it('[error] description 없으면?');    // ✅ 필수
  });

  describe('update', () => {
    it('[happy] 부분 업데이트한다');
    it('[error] id 없으면 null');
  });

  describe('remove', () => {
    it('[happy] 삭제하고 true 반환');
    it('[error] id 없으면 false');
  });
});
```

**특징**:
- 실제 DB (메모리 기반 가능) 사용
- Service 함수만 테스트 (Controller 불필요)
- Mock 최소화

### Controllers 테스트 (taskController.test.js)

```javascript
// 책임: HTTP 요청/응답, 검증, 상태 코드
describe('POST /api/tasks', () => {
  beforeEach(() => { /* DB 정리 */ });

  describe('정상 경로', () => {
    it('[happy] 201, 태스크 반환');
  });

  describe('실패 경로', () => {
    it('[error] 400, 에러 메시지');
  });
});
```

**특징**:
- supertest로 HTTP 요청
- 상태 코드 + 응답 본문 검증
- Service는 실제 구현 사용 (통합 테스트)

---

## 10. 자주 하는 실수

| 실수 | ❌ 잘못된 예 | ✅ 올바른 예 |
|------|-----------|-----------|
| **상태 코드 맞춤** | `res.body.statusCode` | `res.status` |
| **에러 메시지** | `'error'` (소문자, 추측) | `'title 은 필수입니다'` (CLAUDE.md 규약) |
| **응답 본문** | `res.body === {}` | `res.body` (상태에 따라) |
| **Mock 정리 안 함** | Mock 남아있음 | `jest.clearAllMocks()` |
| **DB 격리 안 함** | 테스트 간 데이터 상속 | `beforeEach` 정리 |
| **조건 짝짓기** | Happy만 작성 | Happy + Error ≥2 |
| **Service Mock** | `jest.mock('taskService')` | 실제 Service 사용 |
| **타이밍 오류** | `async` 빼먹음 | `async/await` 명시 |

---

## 참고: CLAUDE.md 규약

이 규칙은 CLAUDE.md의 다음을 따릅니다:

- **REST API 규약**: 상태 코드 (200/201/204/400/404/500)
- **계층**: Routes → Controllers → Services → Database
- **검증**: Controllers에서만 (validateTaskInput)
- **DTO**: toTaskDTO()로 변환
- **SQL**: Parameterized queries (?)
- **부분 업데이트**: PUT이 PATCH 처럼 동작 (COALESCE)

규칙 변경 시 CLAUDE.md도 함께 업데이트하세요.

---

**문서 버전**: 1.0  
**최종 업데이트**: 2026-07-13  
**작성자**: Claude Code  
