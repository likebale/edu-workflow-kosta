# TaskFlow REST API

모든 API는 JSON을 사용합니다. 상태 코드는 REST 규약을 따릅니다.

---

## 엔드포인트 목록

| 메서드 | 경로 | 설명 | 요청 본문 | 성공 응답 | 에러 상태 |
|--------|------|------|---------|---------|----------|
| **GET** | `/` | 태스크 목록 (HTML 뷰) | (없음) | 200 (HTML) | 500 |
| **GET** | `/api/tasks` | 태스크 목록 (JSON) | (없음) | 200 (배열) | 500 |
| **POST** | `/api/tasks` | 태스크 생성 | `{title, description?, assignee?}` | 201 (객체) | 400, 500 |
| **PUT** | `/api/tasks/:id` | 태스크 부분 갱신 | `{title?, description?, status?, assignee?}` | 200 (객체) | 404, 500 |
| **DELETE** | `/api/tasks/:id` | 태스크 삭제 | (없음) | 204 (없음) | 404, 500 |

---

## 상세 명세

### 1. GET /

**설명**: 태스크 목록을 HTML 뷰로 렌더링합니다.

**요청**:
```
GET / HTTP/1.1
Host: localhost:3000
```

**성공 응답** (200 OK):
```html
<!DOCTYPE html>
<html>
<head>
  <title>TaskFlow</title>
</head>
<body>
  <!-- 태스크 목록 렌더링 -->
</body>
</html>
```

**에러 응답**:
- `500 Internal Server Error` — 서버 오류

---

### 2. GET /api/tasks

**설명**: 태스크를 조회합니다. 선택적 쿼리 파라미터로 필터링 및 페이지네이션 가능합니다.

**쿼리 파라미터** (모두 선택):

| 파라미터 | 타입 | 설명 | 예시 |
|---------|------|------|------|
| `status` | string | 상태로 정확히 필터링 (대소문자 구분, 화이트리스트 없음) | `?status=todo` |
| `search` | string | 제목에서 부분 문자열 검색 (대소문자 구분, 와일드카드 이스케이프) | `?search=버그` |
| `page` | integer | 페이지 번호 (1-indexed, 기본값 없음) | `?page=2` |
| `pageSize` | integer | 페이지당 항목 수 (기본값 20, 최대 100) | `?pageSize=50` |

**요청** (페이지네이션 없음):
```
GET /api/tasks HTTP/1.1
Host: localhost:3000
Accept: application/json
```

또는

```
GET /api/tasks?status=todo&search=버그 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

**성공 응답 (page 파라미터 없음)** (200 OK):

배열을 직접 반환합니다 (역순 정렬):

```json
[
  {
    "id": 2,
    "title": "두 번째 태스크",
    "description": "설명",
    "status": "in_progress",
    "assignee": "이개발",
    "created_at": "2026-07-13 14:30:00"
  },
  {
    "id": 1,
    "title": "첫 번째 태스크",
    "description": null,
    "status": "todo",
    "assignee": "김개발",
    "created_at": "2026-07-13 14:25:00"
  }
]
```

**요청 (page 파라미터 있음)**:
```
GET /api/tasks?page=1&pageSize=20 HTTP/1.1
Host: localhost:3000
Accept: application/json
```

**성공 응답 (page 파라미터 있음)** (200 OK):

envelope 객체를 반환합니다:

```json
{
  "data": [
    {
      "id": 5,
      "title": "다섯 번째 태스크",
      "description": null,
      "status": "done",
      "assignee": "박개발",
      "created_at": "2026-07-13 14:40:00"
    },
    {
      "id": 4,
      "title": "네 번째 태스크",
      "description": "설명",
      "status": "todo",
      "assignee": "이개발",
      "created_at": "2026-07-13 14:35:00"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 5,
  "totalPages": 1
}
```

**특별 동작**:
- 잘못된 `page` 값 (`abc`, `-1`, `0`, `1.7`) → 1페이지로 클램프
- 잘못된 `pageSize` 값 (음수, 초과) → 1-100 범위로 클램프, 기본값 20
- 범위 밖 페이지 → `data: []` 반환, `totalPages` 정상 계산
- `search` 필터의 `%`, `_` 문자 → 리터럴로 매칭 (SQL 와일드카드 아님)

**에러 응답**:
- `500 Internal Server Error` — 서버 오류

---

### 3. POST /api/tasks

**설명**: 새 태스크를 생성합니다.

**요청**:
```
POST /api/tasks HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "title": "새 태스크",
  "description": "선택적 설명",
  "assignee": "담당자명"
}
```

**필수 필드**:
- `title` (string, 비어있지 않음)

**선택 필드**:
- `description` (string, 기본값: null)
- `assignee` (string, 기본값: null)

**성공 응답** (201 Created):
```json
{
  "id": 3,
  "title": "새 태스크",
  "description": "선택적 설명",
  "status": "todo",
  "assignee": "담당자명",
  "created_at": "2026-07-13 14:35:00"
}
```

**에러 응답**:
- `400 Bad Request` — title 검증 실패 (누락, 빈 문자열, 공백만, 타입 오류)
  ```json
  {
    "error": "title 은 필수입니다"
  }
  ```
- `500 Internal Server Error` — 서버 오류

---

### 4. PUT /api/tasks/:id

**설명**: 기존 태스크를 부분 갱신합니다. (지정된 필드만 수정)

**경로 파라미터**:
- `id` (integer) — 태스크 ID

**요청**:
```
PUT /api/tasks/1 HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "status": "done",
  "assignee": "이개발"
}
```

**선택 필드** (지정되지 않은 필드는 유지):
- `title` (string)
- `description` (string)
- `status` (string)
- `assignee` (string)

**성공 응답** (200 OK):
```json
{
  "id": 1,
  "title": "첫 번째 태스크",
  "description": null,
  "status": "done",
  "assignee": "이개발",
  "created_at": "2026-07-13 14:25:00"
}
```

**에러 응답**:
- `404 Not Found` — 태스크가 존재하지 않음
  ```json
  {
    "error": "태스크를 찾을 수 없습니다"
  }
  ```
- `500 Internal Server Error` — 서버 오류

---

### 5. DELETE /api/tasks/:id

**설명**: 태스크를 삭제합니다.

**경로 파라미터**:
- `id` (integer) — 태스크 ID

**요청**:
```
DELETE /api/tasks/1 HTTP/1.1
Host: localhost:3000
```

**성공 응답** (204 No Content):
```
(응답 본문 없음)
```

**에러 응답**:
- `404 Not Found` — 태스크가 존재하지 않음
  ```json
  {
    "error": "태스크를 찾을 수 없습니다"
  }
  ```
- `500 Internal Server Error` — 서버 오류

---

## HTTP 상태 코드 규약

| 상태 코드 | 의미 | 사용 경우 |
|----------|------|---------|
| **200** | OK | GET, PUT 성공 |
| **201** | Created | POST 성공 (새 리소스 생성) |
| **204** | No Content | DELETE 성공 (응답 본문 없음) |
| **400** | Bad Request | 검증 실패 (title 누락, 타입 오류 등) |
| **404** | Not Found | 리소스 없음 (ID 미존재) |
| **500** | Internal Server Error | 미처리 예외 (DB 오류, 프로그래밍 오류) |

---

## 에러 메시지 규약

| 에러 메시지 | 상태 코드 | 상황 |
|-----------|----------|------|
| `"title 은 필수입니다"` | 400 | POST 시 title 누락, 빈 문자열, 공백만, null, 타입 오류 |
| `"태스크를 찾을 수 없습니다"` | 404 | PUT/DELETE 시 해당 ID 미존재 |

---

## 요청/응답 규약

### 요청 본문
- Content-Type: `application/json`
- 모든 필드는 선택 (지정되지 않으면 생략 가능)

### 응답 본문
- Content-Type: `application/json` (204 제외)
- 모든 성공 응답은 JSON 객체 또는 배열

### Task 객체 스키마
```json
{
  "id": 1,                                    // integer (자동 생성)
  "title": "태스크 제목",                     // string (필수)
  "description": "설명",                       // string | null (선택)
  "status": "todo",                           // string (기본값: "todo")
  "assignee": "담당자명",                     // string | null (선택)
  "created_at": "2026-07-13 14:30:00"       // string (자동 생성)
}
```

---

## 예제

### 태스크 생성
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "새 기능 개발",
    "assignee": "김개발"
  }'
```

응답:
```json
{
  "id": 5,
  "title": "새 기능 개발",
  "description": null,
  "status": "todo",
  "assignee": "김개발",
  "created_at": "2026-07-13 15:00:00"
}
```

### 태스크 갱신
```bash
curl -X PUT http://localhost:3000/api/tasks/5 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done"
  }'
```

응답:
```json
{
  "id": 5,
  "title": "새 기능 개발",
  "description": null,
  "status": "done",
  "assignee": "김개발",
  "created_at": "2026-07-13 15:00:00"
}
```

### 태스크 삭제
```bash
curl -X DELETE http://localhost:3000/api/tasks/5
```

응답: (204 No Content, 본문 없음)

---

## 참고

- **문서 생성**: 2026-07-13
- **준수 규칙**: `.claude/rules/error-mapping.md`, `CLAUDE.md` REST API 계약
- **테스트**: 39개 테스트 모두 통과 (taskService.test.js, taskController.test.js)
