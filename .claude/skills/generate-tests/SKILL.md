---
name: generate-tests
description: 파일 분석 후 testing.md 규칙을 따르는 테스트 자동 생성 (Happy ↔ Error 짝짓기)
when_to_use: |
  "테스트를 만들어 줘", "이 파일 테스트해 줘", "테스트 커버리지 높여 줘", 
  "services/taskService.js 테스트 작성", "컨트롤러 테스트 추가"
---

# Generate Tests Skill

**목적**: 파일의 모든 함수/엔드포인트에 대해 `.claude/rules/testing.md` 규칙을 따르는 테스트를 자동 생성합니다.

**핵심 원칙**: 각 함수마다 **정상 경로 + 실패 경로(≥2개)** 의 완전한 쌍을 작성합니다.

---

## 입력

```
파일 경로 (필수):
  - services/taskService.js
  - controllers/taskController.js
  - 기타 .js 파일

옵션 (선택):
  --coverage     커버리지 리포트 먼저 보기
  --edge-cases   엣지 케이스 중심
  --fix          실패 시 자동 수정 시도
```

---

## 작업 절차 (5단계)

### 1단계: 커버리지로 빈틈 지도 (Coverage Gap Analysis)

**목표**: 현재 테스트 상태를 파악하고 새로 작성할 함수/엔드포인트를 파악합니다.

**작업**:
```bash
npm test -- --coverage
```

**분석 내용**:
- [ ] 파일에 몇 개 함수/엔드포인트가 있는가?
- [ ] 현재 테스트된 함수는?
- [ ] 빠진 함수는? (0% coverage)
- [ ] 부분 커버된 함수는? (50~99%)
- [ ] Happy path만 있는 함수는? (Error path 빠짐)

**출력**:
```markdown
## 커버리지 분석 결과

### 파일: services/taskService.js
| 함수 | 현재 | 상태 | 필요한 테스트 |
|------|------|------|--------------|
| create | 100% | ✅ 완료 | - |
| getAll | 100% | ✅ 완료 | - |
| getById | 0% | ❌ 새로 작성 | Happy + Error ×3 |
| update | 50% | ⚠️ 부분 완료 | Error path 추가 ×2 |
| remove | 100% | ✅ 완료 | - |

### 새로 작성할 테스트: 총 7개
- getById: 2개 (happy ×1, error ×1)
- update: 2개 (error ×2)
```

---

### 2단계: Services 단위 테스트 스캐폴딩 (Unit Test Scaffolding)

**목표**: 각 Service 함수마다 정상 경로 + 실패 경로 테스트를 작성합니다.

**규칙 (testing.md 준수)**:
- 파일: `tests/[filename].test.js`
- 구조: `describe` (정상 경로 / 실패 경로 분리)
- 각 함수마다: Happy path ×1 + Error path ≥2

**작업**:

```javascript
// 예: services/taskService.js 분석 → tests/taskService.test.js 작성

describe('getById', () => {
  describe('정상 경로', () => {
    it('존재하는 id면 태스크를 반환한다', () => {
      const task = taskService.create({ title: '테스트' });
      const result = taskService.getById(task.id);
      expect(result).toBeDefined();
      expect(result.title).toBe('테스트');
    });
  });

  describe('실패 경로', () => {
    it('존재하지 않는 id면 undefined를 반환한다', () => {
      const result = taskService.getById(999);
      expect(result).toBeUndefined();
    });

    it('음수 id면 undefined를 반환한다', () => {
      const result = taskService.getById(-1);
      expect(result).toBeUndefined();
    });
  });
});
```

**생성 규칙**:
- [ ] 각 함수마다 `describe` 블록
  - [ ] `describe('정상 경로')`
  - [ ] `describe('실패 경로')`
- [ ] 정상 경로: 유효한 입력 → 기대 결과
- [ ] 실패 경로: 각 실패 조건마다 별도 `it`
  - 입력 없음 (null, undefined)
  - 타입 오류 (숫자 대신 문자열)
  - 경계값 (0, -1, 빈 문자열)
  - 리소스 없음

**체크리스트**:
```
[ ] create() 테스트
  [ ] 정상: 유효한 입력 → id 반환
  [ ] 실패: title 없음 (검증은 Controller인데, Service는?)
  [ ] 실패: description 타입 오류 (검증 안 함)

[ ] getById() 테스트
  [ ] 정상: 존재하는 id → 데이터 반환
  [ ] 실패: 존재하지 않는 id → undefined
  [ ] 실패: 잘못된 id (문자열, 음수)

[ ] update() 테스트
  [ ] 정상: 유효한 id + 필드 → 업데이트됨
  [ ] 정상: 여러 필드 동시 업데이트
  [ ] 실패: 존재하지 않는 id → null
  [ ] 실패: 빈 업데이트 객체

[ ] remove() 테스트
  [ ] 정상: 존재하는 id → true
  [ ] 실패: 존재하지 않는 id → false
  [ ] 실패: 중복 삭제
```

**출력**:
```
tests/taskService.test.js — [함수별 테스트 코드]
```

---

### 3단계: 컨트롤러 통합 테스트 (Integration Tests with supertest)

**목표**: HTTP 엔드포인트별로 상태 코드 + 응답 본문을 검증합니다.

**규칙 (testing.md 준수)**:
- 파일: `tests/taskController.test.js`
- 도구: supertest
- 상태 코드: CLAUDE.md REST API 규약과 정확히 일치
  - 201: POST 성공
  - 200: GET/PUT 성공
  - 204: DELETE 성공
  - 400: 검증 실패
  - 404: 리소스 없음
- 에러 메시지: CLAUDE.md와 동일

**작업**:

```javascript
// 예: controllers/taskController.js 분석 → tests/taskController.test.js 추가

describe('PUT /api/tasks/:id', () => {
  let task;

  beforeEach(() => {
    // 테스트 데이터 준비
    task = await request(app)
      .post('/api/tasks')
      .send({ title: '수정 대상' });
  });

  describe('정상 경로', () => {
    it('유효한 id와 필드면 200과 업데이트된 태스크를 반환한다', async () => {
      const res = await request(app)
        .put(`/api/tasks/${task.body.id}`)
        .send({ status: 'done' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.id).toBe(task.body.id);
    });

    it('여러 필드를 동시에 업데이트할 수 있다', async () => {
      const res = await request(app)
        .put(`/api/tasks/${task.body.id}`)
        .send({ title: '새 제목', status: 'done', assignee: '김개발' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('새 제목');
      expect(res.body.status).toBe('done');
      expect(res.body.assignee).toBe('김개발');
    });
  });

  describe('실패 경로', () => {
    it('존재하지 않는 id면 404와 에러를 반환한다', async () => {
      const res = await request(app)
        .put('/api/tasks/999')
        .send({ status: 'done' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
    });

    it('잘못된 status면 400과 에러를 반환한다', async () => {
      const res = await request(app)
        .put(`/api/tasks/${task.body.id}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('유효하지 않은');
    });
  });
});
```

**엔드포인트별 체크리스트**:
```
[ ] GET /
  [ ] 정상: 200, HTML 뷰 렌더링
  [ ] 실패: 500 (500 은 예외 처리 필요)

[ ] GET /api/tasks
  [ ] 정상: 200, JSON 배열 반환
  [ ] 실패: 500

[ ] POST /api/tasks
  [ ] 정상: 201, task 객체 반환
  [ ] 실패: 400 (title 없음, 빈 문자열, 타입 오류)

[ ] PUT /api/tasks/:id
  [ ] 정상: 200, 업데이트된 task
  [ ] 정상: 여러 필드 동시 수정
  [ ] 실패: 404 (id 없음)
  [ ] 실패: 400 (유효하지 않은 status)

[ ] DELETE /api/tasks/:id
  [ ] 정상: 204, 빈 응답
  [ ] 실패: 404 (id 없음)
  [ ] 실패: 중복 삭제 (두 번째는 404)
```

**출력**:
```
tests/taskController.test.js — [엔드포인트별 테스트 코드]
```

---

### 4단계: 엣지 케이스 보강 (Edge Case Enhancement)

**목표**: 경계값, null, 타입 오류 등 특수한 입력에 대한 테스트를 추가합니다.

**작업**:

각 함수/엔드포인트마다 다음을 확인합니다:

| 카테고리 | 테스트 케이스 | 예시 |
|---------|---------------|------|
| **Null/Undefined** | null, undefined 입력 | `title: null`, `assignee: undefined` |
| **빈 값** | 빈 문자열, 빈 배열, 빈 객체 | `title: ''`, `{}` |
| **공백** | 공백만 있는 문자열 | `title: '   '` |
| **타입 오류** | 숫자 대신 문자열, 반대 | `id: 'abc'`, `status: 123` |
| **경계값** | 0, -1, 매우 큰 수 | `id: 0`, `id: 999999` |
| **특수 문자** | 따옴표, 백슬래시 | `title: "O'Reilly"` |
| **SQL Injection** | SQL 쿼리처럼 보이는 입력 | `title: "'; DROP TABLE tasks; --"` |
| **매우 긴 입력** | 1000자 이상 | `title: "a".repeat(10000)` |
| **중복 작업** | 같은 작업 반복 | 같은 id 삭제 2회 |
| **상태 전이** | 논리적으로 불가능한 상태 | `todo` → `todo` (상태 변경 없음) |

**생성 규칙**:
```javascript
describe('엣지 케이스', () => {
  it('title이 null이면 에러를 반환한다', () => {
    const res = request(app)
      .post('/api/tasks')
      .send({ title: null, assignee: '김개발' });
    expect(res.status).toBe(400);
  });

  it('title이 공백만이면 에러를 반환한다', () => {
    const res = request(app)
      .post('/api/tasks')
      .send({ title: '   ' });
    expect(res.status).toBe(400);
  });

  it('SQL Injection 형태의 title도 안전하게 처리한다', () => {
    const res = request(app)
      .post('/api/tasks')
      .send({ title: "'; DROP TABLE tasks; --" });
    expect(res.status).toBe(201);  // 삽입되지만 SQL로 실행 안 됨
    expect(res.body.title).toBe("'; DROP TABLE tasks; --");  // 리터럴로 저장
  });

  it('매우 긴 title도 저장할 수 있다', () => {
    const longTitle = 'a'.repeat(10000);
    const res = request(app)
      .post('/api/tasks')
      .send({ title: longTitle });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe(longTitle);
  });
});
```

**체크리스트**:
```
[ ] 각 필드마다 엣지 케이스
  [ ] title: null, '', 공백, 특수문자, 매우 긴 값
  [ ] status: invalid, null, 타입 오류, 상태 무변화
  [ ] assignee: null, '', 타입 오류
  [ ] id: 0, -1, 문자열, null

[ ] 반복 작업
  [ ] 같은 id 두 번 삭제
  [ ] 같은 값으로 여러 번 업데이트

[ ] 보안
  [ ] SQL Injection
  [ ] XSS (특수 문자)
```

**출력**:
```
tests/taskService.test.js / tests/taskController.test.js — [엣지 케이스 추가]
```

---

### 5단계: 실행과 수정 (Execute & Fix)

**목표**: 작성한 테스트를 실행하고, 실패 시 원인을 파악해 수정합니다.

**작업**:

```bash
# 1단계: 전체 테스트 실행
npm test

# 2단계: 특정 파일만 실행
npm test -- tests/taskService.test.js
npm test -- tests/taskController.test.js

# 3단계: 커버리지 확인
npm test -- --coverage
```

**실패 시 처리**:

| 실패 유형 | 원인 | 해결 |
|----------|------|------|
| **테스트 코드 오류** | expect 조건 잘못됨 | 테스트 수정 |
| **상태 코드 불일치** | Controller 반환값 안 맞음 | CLAUDE.md 규약 재확인, Controller 수정 |
| **에러 메시지 다름** | 실제 메시지 ≠ 기대 메시지 | CLAUDE.md와 비교, Controller 수정 |
| **Service 로직 오류** | 구현 버그 | Service 함수 수정 |
| **격리 문제** | 테스트 간 데이터 간섭 | beforeEach/afterEach 강화 |
| **비동기 오류** | async/await 빠짐 | `async/await` 추가 또는 `return` |

**수정 순서**:
1. 실패한 테스트 파악
2. 원인 분류 (위 표 참고)
3. 해당 파일 수정 (테스트 또는 소스)
4. 해당 테스트만 재실행: `npm test -- --testNamePattern="실패한테스트"`
5. 전체 재실행: `npm test`
6. 회귀 확인 (다른 테스트 깨짐?)

**성공 조건**:
```
✅ npm test 실행 → 모든 테스트 통과 (0 실패)
✅ 각 함수마다 정상 경로 + 실패 경로 (≥2) 완성
✅ HTTP 상태 코드 CLAUDE.md 규약 준수
✅ 에러 메시지 일치
✅ 커버리지: Service 90%+, Controller 80%+
```

**실패 예시 & 해결**:

```bash
$ npm test
 FAIL  tests/taskController.test.js
  DELETE /api/tasks/:id (not found)
    Expected: 404
    Received: 400

# 원인: remove() 컨트롤러에서 잘못된 상태 코드 반환
# 해결: controllers/taskController.js 확인
#   if (!deleted) {
#     return res.status(404).json({...});  // 404 확인
#   }

# 수정 후 재실행
$ npm test -- tests/taskController.test.js

# 전체 확인
$ npm test
```

---

## 준수 사항 (Rules)

**다음 규칙을 반드시 따르세요:**

### 1. `.claude/rules/testing.md` 완전 준수
- [ ] 파일 위치: `tests/[filename].test.js`
- [ ] describe/it 구조 준수
- [ ] Happy path + Error path 짝짓기
- [ ] 상태 코드 정확히 일치

### 2. 조건 짝짓기 (반드시 짝지으세요!)
```javascript
// ❌ 하지 말 것: Happy path만
describe('update', () => {
  it('상태를 변경한다');
});

// ✅ 할 것: Happy + Error 짝짓기
describe('update', () => {
  describe('정상 경로', () => {
    it('상태를 변경한다');
  });
  describe('실패 경로', () => {
    it('id가 없으면 null을 반환한다');
    it('타입이 잘못되면 에러를 반환한다');
  });
});
```

### 3. 상태 코드 매핑 (정확히!)
- 201: POST 생성 성공
- 200: GET/PUT 성공
- 204: DELETE 성공
- 400: 검증 실패 (title, status)
- 404: 리소스 없음 (id 미존재)
- 500: 서버 오류 (예외)

### 4. 에러 메시지 (CLAUDE.md와 동일)
```javascript
// CLAUDE.md에서
{
  MISSING_TITLE: 'title 은 필수입니다',
  INVALID_STATUS: '유효하지 않은 status 입니다',
  TASK_NOT_FOUND: '태스크를 찾을 수 없습니다',
}

// 테스트에서 정확히 같은 문자열 사용
expect(res.body.error).toBe('title 은 필수입니다');
```

### 5. Mock 기준 (testing.md 준수)
- ❌ Service Mock 금지 (실제 구현 사용)
- ✅ 외부 의존성만 Mock (Email, Slack, API)

### 6. 격리 (Isolation)
```javascript
beforeEach(() => {
  // DB 정리
  const tasks = taskService.getAll();
  tasks.forEach(t => taskService.remove(t.id));
  
  // Mock 초기화
  jest.clearAllMocks();
});
```

---

## 명시 사항

**각 함수마다 반드시 다음을 작성하세요:**

### 정상 경로 (Happy Path)
- 조건: 유효한 입력
- 결과: 기대한 값 반환
- 개수: 1개 (기본) ~ N개 (복잡하면)
- 예시: `it('유효한 title이면 생성한다')`

### 실패 경로 (Error Path)
- 조건: 각각의 실패 원인 (≥2개)
- 결과: 에러 반환 또는 null/false
- 개수: 반드시 2개 이상
- 예시:
  - `it('title이 없으면 에러를 반환한다')`
  - `it('id가 없으면 null을 반환한다')`
  - `it('타입이 잘못되면 에러를 반환한다')`

### 패턴
```javascript
describe('functionName', () => {
  describe('정상 경로', () => {
    it('입력이 유효하면 결과를 반환한다', () => {
      const result = functionUnderTest(validInput);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('실패 경로', () => {
    it('입력 A가 없으면 에러 X를 반환한다', () => {
      expect(() => functionUnderTest(invalidA)).toThrow(ErrorX);
    });

    it('입력 B가 잘못되면 null을 반환한다', () => {
      const result = functionUnderTest(invalidB);
      expect(result).toBeNull();
    });
  });
});
```

---

## 완료 조건

다음을 모두 만족하면 스킬 작업 완료:

- [ ] 5단계 모두 완료
- [ ] `npm test` → 모든 테스트 통과 (0 실패)
- [ ] 각 함수마다 Happy ↔ Error 짝짓기 완성
- [ ] HTTP 상태 코드 CLAUDE.md 규약 준수
- [ ] 에러 메시지 CLAUDE.md와 동일
- [ ] 격리 검증 (테스트 순서 무관)
- [ ] 회귀 테스트 포함
- [ ] 커버리지 명시 (Service 90%+, Controller 80%+)

```bash
# 완료 확인 명령
npm test -- --coverage
```

---

## 사용 예시

### 예 1: Service 테스트 작성
```
사용자: "services/taskService.js 테스트 만들어 줘"

스킬 실행:
1. npm test -- --coverage 실행 → 현재 getById 0% 확인
2. getById 함수 분석 → Happy path ×1 + Error path ×2 작성
3. supertest 필요 없음 (Service는 DB만)
4. null, undefined, 잘못된 id 추가
5. npm test -- tests/taskService.test.js 실행 → 통과 확인
```

### 예 2: Controller 테스트 작성
```
사용자: "DELETE /api/tasks/:id 테스트 추가해 줘"

스킬 실행:
1. npm test -- --coverage 확인 → DELETE 0%
2. DELETE 엔드포인트 분석
3. supertest로 Happy + Error (404, 중복 삭제) 작성
4. 엣지 케이스 추가 (문자열 id, 음수 등)
5. npm test -- tests/taskController.test.js 실행 → 통과
```

### 예 3: 전체 파일 테스트
```
사용자: "controllers/taskController.js 모든 엔드포인트 테스트해 줘"

스킬 실행:
1. 커버리지로 빠진 엔드포인트 파악
2. 각 엔드포인트마다 supertest 테스트 작성
3. 모든 상태 코드 검증 (201, 200, 204, 400, 404)
4. 엣지 케이스 추가
5. npm test 실행 → 전체 통과 확인
```

---

## 다음 단계

이 스킬 완료 후:
- Step-6: 알림 기능(Email, Slack) 테스트 추가
- 커버리지 90%+ 달성
- 회귀 버그 0% 유지

---

**스킬 버전**: 1.0  
**마지막 업데이트**: 2026-07-13  
**규칙 참고**: `.claude/rules/testing.md`
