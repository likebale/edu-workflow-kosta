# HTTP 상태 코드 & 에러 메시지 매핑 규약

**모든 HTTP 응답은 다음 규약을 정확히 따릅니다.**

---

## 1. 성공 응답 (2xx)

### 201 Created — POST 요청 성공

**엔드포인트**: `POST /api/tasks`

**응답**:
```json
{
  "id": 1,
  "title": "새 태스크",
  "description": null,
  "status": "todo",
  "assignee": "김개발",
  "created_at": "2026-07-13 HH:MM:SS"
}
```

**테스트**:
```javascript
it('201과 task 객체를 반환한다', async () => {
  const res = await request(app).post('/api/tasks').send({ title: '테스트' });
  expect(res.status).toBe(201);
  expect(res.body.id).toBeDefined();
  expect(res.body.status).toBe('todo');
});
```

---

### 200 OK — GET 또는 PUT 성공

#### GET /api/tasks (목록)

**응답**:
```json
[
  { "id": 1, "title": "...", ... },
  { "id": 2, "title": "...", ... }
]
```

**테스트**:
```javascript
it('200과 배열을 반환한다', async () => {
  const res = await request(app).get('/api/tasks');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});
```

#### GET / (뷰)

**응답**: HTML 콘텐츠

**테스트**:
```javascript
it('200과 HTML을 반환한다', async () => {
  const res = await request(app).get('/');
  expect(res.status).toBe(200);
  expect(res.type).toContain('html');
});
```

#### PUT /api/tasks/:id (수정)

**응답**:
```json
{
  "id": 1,
  "title": "수정된 제목",
  "status": "done",
  ...
}
```

**테스트**:
```javascript
it('200과 수정된 task를 반환한다', async () => {
  const res = await request(app).put(`/api/tasks/${taskId}`).send({ status: 'done' });
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('done');
});
```

---

### 204 No Content — DELETE 성공

**엔드포인트**: `DELETE /api/tasks/:id`

**응답**: 빈 본문

**테스트**:
```javascript
it('204와 빈 응답을 반환한다', async () => {
  const res = await request(app).delete(`/api/tasks/${taskId}`);
  expect(res.status).toBe(204);
  expect(res.body).toEqual({});
});
```

---

## 2. 클라이언트 오류 (4xx)

### 400 Bad Request — 검증 실패

**원인들**:
- title 없음
- title이 빈 문자열 또는 공백만
- title이 null 또는 타입 오류
- status가 유효하지 않은 값 (미래)
- assignee 타입 오류 (미래)

**응답 포맷**:
```json
{
  "error": "[에러 메시지]"
}
```

**에러 메시지 정의**:
```javascript
// 필수 준수 메시지
const ERROR_MESSAGES = {
  MISSING_TITLE: 'title 은 필수입니다',
  INVALID_STATUS: '유효하지 않은 status 입니다',  // 미래
  INVALID_ASSIGNEE: 'assignee 는 문자열이어야 합니다',  // 미래
};
```

**테스트**:
```javascript
describe('400 Bad Request', () => {
  it('title이 없으면 400을 반환한다', async () => {
    const res = await request(app).post('/api/tasks').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title 은 필수입니다');
  });

  it('title이 빈 문자열이면 400을 반환한다', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title 은 필수입니다');
  });

  it('title이 공백만이면 400을 반환한다', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title 은 필수입니다');
  });

  it('title이 null이면 400을 반환한다', async () => {
    const res = await request(app).post('/api/tasks').send({ title: null });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title 은 필수입니다');
  });

  it('title이 숫자면 400을 반환한다', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 123 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title 은 필수입니다');
  });
});
```

---

### 404 Not Found — 리소스 없음

**원인들**:
- 존재하지 않는 id로 PUT 또는 DELETE 시도
- 음수 id로 시도

**응답 포맷**:
```json
{
  "error": "태스크를 찾을 수 없습니다"
}
```

**테스트**:
```javascript
describe('404 Not Found', () => {
  it('존재하지 않는 id면 404를 반환한다', async () => {
    const res = await request(app).put('/api/tasks/999').send({ status: 'done' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
  });

  it('음수 id면 404를 반환한다', async () => {
    const res = await request(app).delete('/api/tasks/-1');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
  });

  it('같은 id를 두 번 삭제하면 두 번째는 404를 반환한다', async () => {
    const first = await request(app).delete(`/api/tasks/${taskId}`);
    expect(first.status).toBe(204);

    const second = await request(app).delete(`/api/tasks/${taskId}`);
    expect(second.status).toBe(404);
    expect(second.body.error).toBe('태스크를 찾을 수 없습니다');
  });
});
```

---

## 3. 서버 오류 (5xx)

### 500 Internal Server Error — 예외 발생

**원인들**:
- DB 연결 오류
- SQL 오류
- 프로그래밍 버그

**응답 포맷** (선택):
```json
{
  "error": "서버 에러"
}
```

또는 빈 응답

**현재 테스트**: 없음 (의도적으로 500을 발생시키기는 어려움)

---

## 4. 규약 준수 체크리스트

### 컨트롤러 작성 시

- [ ] 검증 실패 → `res.status(400).json({ error: '...' })`
- [ ] 리소스 없음 → `res.status(404).json({ error: '태스크를 찾을 수 없습니다' })`
- [ ] 생성 성공 → `res.status(201).json(task)`
- [ ] 조회/수정 성공 → `res.status(200).json(task)`
- [ ] 삭제 성공 → `res.status(204).send()`

### 테스트 작성 시

- [ ] 상태 코드: `expect(res.status).toBe(XXX)`
- [ ] 응답 본문: 해당 형식 확인
- [ ] 에러 메시지: **정확한 문자열 일치** (오타 없음, 공백 포함)

**예시**:
```javascript
// ❌ 하지 말 것
expect(res.body.error).toContain('필수');  // 부분 매칭

// ✅ 할 것
expect(res.body.error).toBe('title 은 필수입니다');  // 정확한 매칭
```

---

## 5. 구현 예시

### controllers/taskController.js

```javascript
function validateTaskInput(body) {
  if (!body || !body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return { valid: false, message: 'title 은 필수입니다' };  // 정확한 메시지
  }
  return { valid: true };
}

function create(req, res) {
  const validation = validateTaskInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });  // 400
  }
  const task = taskService.create(req.body);
  return res.status(201).json(toTaskDTO(task));  // 201
}

function update(req, res) {
  const id = Number(req.params.id);
  const task = taskService.update(id, req.body);
  if (!task) {
    return res.status(404).json({ error: '태스크를 찾을 수 없습니다' });  // 404
  }
  return res.json(toTaskDTO(task));  // 200
}

function remove(req, res) {
  const id = Number(req.params.id);
  const deleted = taskService.remove(id);
  if (!deleted) {
    return res.status(404).json({ error: '태스크를 찾을 수 없습니다' });  // 404
  }
  return res.status(204).send();  // 204
}
```

---

## 6. 규약 위반 패턴 (금지)

| 금지 패턴 | 올바른 방법 | 사유 |
|----------|-----------|------|
| 400 대신 `res.json({ error })` | `res.status(400).json(...)` | 상태 코드 필수 |
| 메시지 약자 ('필수입니다' → 'required') | `'title 은 필수입니다'` | 일관성, 테스트 깨짐 |
| 404 대신 400 반환 | `res.status(404).json(...)` | 의미 구분 |
| DELETE 성공 시 본문 반환 | `res.status(204).send()` | REST 규약 |
| PUT/GET 성공 시 상태 코드 생략 | `res.status(200).json(...)` | 명시적 규약 |

---

## 참고

- **CLAUDE.md**: REST API 규약 정의
- **.claude/rules/testing.md**: 테스트 작성 표준
- **tests/taskController.test.js**: 실제 구현 예시

---

**규약 버전**: 1.0  
**최종 업데이트**: 2026-07-13  
**상태**: 모든 테스트 통과 (39/39 ✅)
