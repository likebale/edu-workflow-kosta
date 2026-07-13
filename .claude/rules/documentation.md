# Documentation Rules — TaskFlow

**원칙**: 코드가 먼저, 문서는 따라온다. 변경 후 관련 문서를 반드시 동기화하세요.

---

## 1. 핵심 원칙

### 코드 우선 (Code First)
```
1. 코드 작성/변경 (routes, controllers, services, db)
   ↓
2. 테스트 작성 및 통과 (npm test)
   ↓
3. 관련 문서 갱신 (README, CLAUDE.md, 주석, API 문서)
   ↓
4. 커밋 (코드 + 문서 함께)
```

**이 순서를 벗어나면 안 됩니다.**

### 문서의 역할
- **README.md**: 프로젝트 개요, 빠른 시작, 기술 스택 (학생용)
- **CLAUDE.md**: 아키텍처, 규약, 불변식 (Claude Code용)
- **.claude/rules/**: 개발 표준 (모두용)
- **코드 주석**: WHY가 명확하지 않은 부분만 (개발자용)
- **API 문서**: Swagger/OpenAPI (자동 생성, 항상 최신)

### 진실의 원천 (Single Source of Truth)
```
코드 > 테스트 > 문서

코드가 변경되었는데 문서가 다르면?
→ 문서가 틀린 것 (코드가 맞음)
→ 즉시 문서 갱신
```

---

## 2. 코드 변경 유형별 갱신 대상

### 2-A: REST 엔드포인트 변경

#### 추가 (POST, GET, PUT, DELETE)
**변경**:
```javascript
// routes/taskRoutes.js
router.post('/api/tasks/bulk', taskController.bulkCreate);
```

**갱신 대상** (우선순위순):
1. ✅ **Swagger/JSDoc** (routes/taskRoutes.js)
   ```javascript
   /**
    * @openapi
    * /api/tasks/bulk:
    *   post:
    *     summary: Create multiple tasks
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             required: [tasks]
    *             properties:
    *               tasks: { type: array }
    *     responses:
    *       201: { description: Created }
    *       400: { description: Invalid input }
    */
   ```

2. ✅ **CLAUDE.md** (REST API 계약 테이블)
   ```markdown
   | POST | /api/tasks/bulk | 대량 생성 | 201 | 400 |
   ```

3. ✅ **테스트** (tests/taskController.test.js)
   ```javascript
   describe('POST /api/tasks/bulk', () => {
     describe('정상 경로', () => {
       it('유효한 배열이면 201 반환');
     });
     describe('실패 경로', () => {
       it('빈 배열이면 400 반환');
     });
   });
   ```

#### 수정 (엔드포인트 변경, 응답 형식 변경)
**변경**:
```javascript
// PUT /api/tasks/:id → PATCH /api/tasks/:id로 변경
router.patch('/api/tasks/:id', taskController.update);
```

**갱신 대상**:
1. ✅ Swagger/JSDoc (routes)
2. ✅ CLAUDE.md (REST API 표, HTTP 메서드)
3. ✅ 기존 테스트 수정 및 새 테스트 추가
4. ✅ README.md (기술 스택에 PATCH 메서드 언급)

#### 삭제
**변경**:
```javascript
// router.delete('/api/tasks/:id', ...); 삭제
```

**갱신 대상**:
1. ✅ Swagger/JSDoc (제거)
2. ✅ CLAUDE.md (테이블에서 행 삭제)
3. ✅ 관련 테스트 삭제
4. ⚠️ README (필요시 언급 제거)

---

### 2-B: 데이터베이스 스키마 변경

#### 컬럼 추가
**변경**:
```javascript
// db/database.js
CREATE TABLE IF NOT EXISTS tasks (
  ...
  priority TEXT DEFAULT 'medium',  // ← 새 컬럼
  updated_at TEXT DEFAULT (datetime('now'))  // ← 새 컬럼
)
```

**갱신 대상** (우선순위순):
1. ✅ **CLAUDE.md** (데이터베이스 스키마 표)
   ```markdown
   | priority | TEXT | 우선순위 | medium |
   | updated_at | TEXT | 수정 시각 | (datetime) |
   ```

2. ✅ **코드 주석** (db/database.js)
   ```javascript
   // priority: 'low', 'medium', 'high' (기본: medium)
   // updated_at: 수정 시각 (INSERT 시 설정, UPDATE 시 갱신)
   ```

3. ✅ **Service 함수** (taskService.js)
   ```javascript
   // priority, updated_at 처리 로직 추가
   function update(id, { ..., priority, updated_at }) { ... }
   ```

4. ✅ **Controller** (taskController.js)
   ```javascript
   // priority 검증 추가 (enum: low/medium/high)
   // toTaskDTO에 updated_at 포함
   ```

5. ✅ **테스트** (tests/)
   ```javascript
   it('priority를 설정할 수 있다');
   it('updated_at이 갱신된다');
   ```

6. ✅ **README** (필요시, tasks 테이블 섹션)

#### 컬럼 수정 (타입, 기본값)
**변경**:
```javascript
status TEXT DEFAULT 'todo'  // ← status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done'))
```

**갱신 대상**:
1. ✅ CLAUDE.md (스키마 표의 설명 수정)
2. ✅ Controller 검증 (validateTaskInput에 status 화이트리스트 추가)
3. ✅ 테스트 (유효하지 않은 status 거부 확인)

#### 컬럼 삭제
⚠️ **주의**: 마이그레이션 필요

**갱신 대상**:
1. ✅ CLAUDE.md (스키마 표에서 행 삭제)
2. ✅ Service/Controller 함수 (사용 제거)
3. ✅ 테스트 (관련 테스트 수정/삭제)

---

### 2-C: HTTP 상태 코드 또는 에러 메시지 변경

#### 상태 코드 추가/변경
**변경**:
```javascript
// controllers/taskController.js
if (!task) {
  return res.status(410).json({ error: '태스크가 삭제되었습니다' });  // 404 → 410
}
```

**갱신 대상** (우선순위순):
1. ✅ **CLAUDE.md** (REST API 규약 섹션)
   ```markdown
   | 410 | Gone | 리소스가 영구 삭제됨 | 태스크 soft-delete |
   ```

2. ✅ **.claude/rules/error-mapping.md** (매핑 테이블)
   ```markdown
   410 Gone: 리소스 영구 삭제 → "태스크가 삭제되었습니다"
   ```

3. ✅ **테스트** (상태 코드 410 확인)
   ```javascript
   it('삭제된 태스크면 410을 반환한다');
   ```

#### 에러 메시지 추가/변경
**변경**:
```javascript
// 기존: '태스크를 찾을 수 없습니다'
// 변경: '해당 태스크가 없습니다'
return res.status(404).json({ error: '해당 태스크가 없습니다' });
```

**갱신 대상**:
1. ✅ **.claude/rules/error-mapping.md** (에러 메시지 정확한 값)
2. ✅ **테스트** (메시지 정확히 일치 확인)
   ```javascript
   expect(res.body.error).toBe('해당 태스크가 없습니다');
   ```
3. ⚠️ CLAUDE.md (필요시)

---

### 2-D: 함수 시그니처 또는 로직 변경

#### 함수 파라미터 추가
**변경**:
```javascript
// 기존: function create({ title, description, assignee })
// 변경: function create({ title, description, assignee, priority })
function create({ title, description, assignee, priority }) {
  ...
}
```

**갱신 대상**:
1. ✅ **코드 주석** (함수 위 JSDoc)
   ```javascript
   /**
    * @param {string} data.priority - Task priority (low/medium/high)
    */
   ```

2. ✅ **Controller** (toTaskDTO에 priority 포함)

3. ✅ **테스트** (새 파라미터에 대한 테스트)
   ```javascript
   it('priority를 포함해서 생성할 수 있다');
   ```

4. ✅ **Swagger/JSDoc** (requestBody에 priority 추가)

#### 함수 반환값 변경
**변경**:
```javascript
// 기존: return true/false
// 변경: return { success: boolean, message: string, taskId: number }
function remove(id) {
  return { success: true, message: '삭제됨', taskId: id };
}
```

**갱신 대상**:
1. ✅ **JSDoc** (반환값 타입/구조)
2. ✅ **Controller** (응답 처리 수정)
3. ✅ **테스트** (응답 구조 확인)
4. ✅ **Swagger** (responses 수정)

---

### 2-E: 테스트 추가

**변경**:
```javascript
// tests/taskService.test.js
describe('priority validation', () => {
  it('유효하지 않은 priority면 에러');
});
```

**갱신 대상**:
1. ✅ **테스트 파일** (새 테스트 추가)
2. ✅ **README** (필요시, 테스트 개수 업데이트)
   - 또는 자동화: `npm run sync:test-count`

---

## 3. 갱신 체크리스트

각 변경 후 **반드시 확인하세요:**

### 모든 변경 후 (필수)
- [ ] `npm test` 통과 (모든 테스트)
- [ ] 관련 문서 갱신 (위의 "2. 코드 변경 유형별" 참고)
- [ ] 갱신된 문서가 **코드와 정확히 일치**
  - 엔드포인트 경로 일치?
  - 상태 코드 일치?
  - 에러 메시지 정확한 문자열 일치?
  - 파라미터/필드명 일치?

### REST API 엔드포인트 변경 시
- [ ] Swagger/JSDoc 업데이트 (정확한 경로, 메서드, 파라미터)
- [ ] CLAUDE.md REST API 표 업데이트
- [ ] 테스트 추가 (Happy path + Error path)
- [ ] `npm test` 통과

### 데이터베이스 스키마 변경 시
- [ ] db/database.js의 CREATE TABLE 업데이트
- [ ] CLAUDE.md 스키마 표 업데이트
- [ ] Service 함수 수정 (필요시)
- [ ] Controller 검증 추가 (필요시)
- [ ] 테스트 추가
- [ ] `npm test` 통과

### HTTP 상태 코드 또는 에러 메시지 변경 시
- [ ] error-mapping.md 업데이트
- [ ] CLAUDE.md 업데이트 (필요시)
- [ ] 테스트의 expect 문 정확히 수정
  ```javascript
  // ❌ 잘못된 것
  expect(res.body.error).toContain('찾을 수 없');
  
  // ✅ 올바른 것
  expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
  ```
- [ ] `npm test` 통과

### 함수 시그니처 변경 시
- [ ] 함수 위에 JSDoc 추가/수정 (파라미터, 반환값)
- [ ] 호출 위치 모두 수정
- [ ] 테스트 수정
- [ ] 필요시 Swagger 업데이트
- [ ] `npm test` 통과

---

## 4. 완료 조건

변경이 **완료되었다**는 것은:

### 필수 조건 (AND)
```
✅ npm test 모두 통과
AND
✅ 코드와 문서가 정확히 일치
AND
✅ 불필요한 문서는 제거됨
AND
✅ 이중 관리 문서는 없음
```

### 정확히 일치한다는 뜻
```
코드의 상태 코드 201
  = CLAUDE.md의 상태 코드 201
  = Swagger API 문서의 상태 코드 201
  = 테스트의 expect(res.status).toBe(201)

코드의 에러 메시지 '태스크를 찾을 수 없습니다'
  = error-mapping.md의 메시지 '태스크를 찾을 수 없습니다'
  = 테스트의 expect(res.body.error).toBe('...')
  = CLAUDE.md의 메시지 (필요시)

코드의 파라미터 { title, description, assignee }
  = JSDoc의 @param
  = Swagger requestBody
  = 테스트의 .send({ ... })
```

### 체크리스트: 완료 직전

```markdown
## 변경 완료 전 최종 확인

- [ ] **코드 테스트**
  - [ ] npm test 통과 (모든 테스트)
  - [ ] 실제로 동작 확인 (npm start 후 브라우저 테스트)

- [ ] **문서 일치도**
  - [ ] REST API 변경: Swagger + CLAUDE.md + 테스트 일치
  - [ ] DB 스키마 변경: CLAUDE.md 스키마 표 + Service 로직 일치
  - [ ] 상태 코드 변경: error-mapping.md + Controller + 테스트 일치
  - [ ] 함수 변경: JSDoc + Swagger + 호출 코드 + 테스트 일치

- [ ] **문서 중복 제거**
  - [ ] 같은 정보가 2곳 이상에 있는가?
    - 있으면 → 1곳만 유지, 나머지는 링크로 변경
    - 없으면 → 통과

- [ ] **이전 릴리스와 호환성**
  - [ ] 하위 호환 가능한 변경인가? (breaking change 아닌가?)
  - [ ] 그렇지 않으면 → CHANGELOG나 마이그레이션 가이드 추가

- [ ] **커밋 메시지**
  - [ ] 변경 사항 명확한가?
  - [ ] 관련 문서도 함께 커밋했는가?
  - [ ] 문서-코드 버전이 일치하는가?
```

---

## 5. 안티패턴 (하지 말 것)

### ❌ 문서 먼저 작성
```javascript
// ❌ 하지 말 것: README 먼저 쓰고 나중에 코드
// 1. README에 "POST /api/tasks/bulk 추가" 작성
// 2. (시간이 지남)
// 3. 코드 구현 시작

// ✅ 할 것
// 1. 코드 구현
// 2. 테스트 작성
// 3. 문서 갱신
```

### ❌ 문서 부분 갱신
```javascript
// ❌ 하지 말 것: 일부만 업데이트
// - Swagger는 수정 ✓
// - CLAUDE.md는 미수정 ✗
// - 테스트는 수정 ✓

// ✅ 할 것: 모든 관련 문서 갱신
// - Swagger ✓
// - CLAUDE.md ✓
// - 테스트 ✓
```

### ❌ 부정확한 에러 메시지 테스트
```javascript
// ❌ 하지 말 것
expect(res.body.error).toContain('찾을 수 없');

// ✅ 할 것
expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
```

### ❌ JSDoc 없이 함수 변경
```javascript
// ❌ 하지 말 것
function create({ title, description, assignee, priority, dueDate }) {
  // 파라미터 설명 없음
}

// ✅ 할 것
/**
 * @param {string} data.title - Task title (required)
 * @param {string} [data.priority] - Task priority (low/medium/high)
 * @param {string} [data.dueDate] - Due date (YYYY-MM-DD)
 */
function create({ title, description, assignee, priority, dueDate }) {
}
```

### ❌ 이중 관리 문서
```markdown
❌ 하지 말 것:
README.md의 REST API 표
+ CLAUDE.md의 동일 표
+ Swagger 문서
→ 3곳을 모두 수정해야 함

✅ 할 것:
Swagger 문서 (자동 생성)
README.md = "Swagger 문서 참조" 링크만
CLAUDE.md = 개념/규약만 (기술 상세는 제외)
```

---

## 6. 도움 되는 자동화 명령어 (미래)

```bash
# 테스트 개수 자동 동기화 (예: 39 → README에 자동 반영)
npm run sync:test-count

# Swagger 문서 자동 생성
npm run docs:api

# 코드 문서 자동 생성 (HTML)
npm run docs:code

# 문서 일치도 검증 (코드와 문서가 일치하는가?)
npm run docs:validate

# 깃 커밋 전 체크(문서-코드 일치도 검증)
pre-commit hook
```

현재는 수동이지만, 향후 추가 가능합니다.

---

## 7. 예시: 엔드포인트 추가 전체 흐름

### 🎯 목표: `PATCH /api/tasks/:id/assign` 엔드포인트 추가

#### Step 1: 코드 작성
```javascript
// routes/taskRoutes.js
router.patch('/api/tasks/:id/assign', taskController.assign);

// controllers/taskController.js
function assign(req, res) {
  const id = Number(req.params.id);
  const { assignee } = req.body;
  
  if (!assignee || typeof assignee !== 'string') {
    return res.status(400).json({ error: 'assignee 는 필수입니다' });
  }
  
  const task = taskService.update(id, { assignee });
  if (!task) {
    return res.status(404).json({ error: '태스크를 찾을 수 없습니다' });
  }
  return res.json(toTaskDTO(task));
}
```

#### Step 2: 테스트 작성
```javascript
// tests/taskController.test.js
describe('PATCH /api/tasks/:id/assign', () => {
  describe('정상 경로', () => {
    it('유효한 assignee면 200과 업데이트된 task를 반환한다', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task.id}/assign`)
        .send({ assignee: '김개발' });
      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('김개발');
    });
  });

  describe('실패 경로', () => {
    it('assignee가 없으면 400을 반환한다', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task.id}/assign`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('assignee 는 필수입니다');
    });

    it('존재하지 않는 id면 404를 반환한다', async () => {
      const res = await request(app)
        .patch('/api/tasks/999/assign')
        .send({ assignee: '김개발' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
    });
  });
});
```

#### Step 3: 테스트 실행
```bash
npm test
# ✅ 모든 테스트 통과
```

#### Step 4: 문서 갱신

**A. Swagger/JSDoc** (routes/taskRoutes.js)
```javascript
/**
 * @openapi
 * /api/tasks/{id}/assign:
 *   patch:
 *     summary: Assign a task to someone
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignee]
 *             properties:
 *               assignee: { type: string, example: "김개발" }
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       400:
 *         description: assignee 는 필수입니다
 *       404:
 *         description: 태스크를 찾을 수 없습니다
 */
router.patch('/api/tasks/:id/assign', taskController.assign);
```

**B. CLAUDE.md** (REST API 표 추가)
```markdown
| PATCH | /api/tasks/:id/assign | 담당자 지정 | 200 | 400 (assignee 필수), 404 (미존재) |
```

**C. error-mapping.md** (에러 메시지)
```markdown
### 400 Bad Request
- `assignee 는 필수입니다` — PATCH /api/tasks/:id/assign에서 assignee 누락
```

#### Step 5: 커밋
```bash
git add routes/taskRoutes.js controllers/taskController.js tests/taskController.test.js CLAUDE.md .claude/rules/error-mapping.md

git commit -m "feat: PATCH /api/tasks/:id/assign 엔드포인트 추가

새로운 엔드포인트로 태스크를 특정 사용자에게 할당할 수 있습니다.
- 201 성공 → 200 반환 (200 = 수정)
- 400: assignee 필수
- 404: id 미존재

문서 동기화:
- Swagger/JSDoc 추가
- CLAUDE.md REST API 표 업데이트
- error-mapping.md 에러 메시지 추가"
```

#### ✅ 완료 체크
```
✅ npm test 통과
✅ Swagger 문서 업데이트
✅ CLAUDE.md 업데이트
✅ error-mapping.md 업데이트
✅ 테스트 추가 (Happy + Error)
✅ 모든 문서가 코드와 정확히 일치
✅ 커밋 완료
```

---

## 참고

**관련 문서**:
- `.claude/rules/testing.md` — 테스트 규칙 (문서 갱신의 전제)
- `.claude/rules/error-mapping.md` — HTTP 상태 코드 & 에러 메시지 규약
- `CLAUDE.md` — 아키텍처 & 규약
- `README.md` — 프로젝트 개요

**체크 포인트**:
- 코드 변경 후 반드시 `npm test` 실행
- 모든 테스트 통과 후 문서 갱신
- 문서 갱신 후 코드와 일치도 확인
- 커밋할 때 코드와 문서를 함께 포함

---

**규칙 버전**: 1.0  
**최종 업데이트**: 2026-07-13  
**상태**: 활성화
