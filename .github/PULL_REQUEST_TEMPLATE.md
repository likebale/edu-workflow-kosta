## 📋 변경 요약

<!-- 3~5문장으로 무엇을 했는지 설명하세요. -->
<!-- 예: 새 엔드포인트 추가, 버그 수정, 리팩터링 등 -->

## 🔍 상세 설명

### 변경 사항

<!-- 구체적으로 어떤 파일과 기능이 변경되었는지 설명하세요. -->

- **routes/taskRoutes.js**: 
- **controllers/taskController.js**: 
- **services/taskService.js**: 
- **tests/**: 
- **CLAUDE.md**: 

### 왜 이 변경이 필요한가?

<!-- 문제 정의, 선택한 솔루션, 대안 검토 등을 설명하세요. -->

**문제**:
- 

**솔루션**:
- 

**대안**:
- (검토했으나 선택하지 않은 대안)

### 관련 이슈

<!-- 예: Closes #123, Refs #45 -->

Closes #

---

## ✅ 테스트 결과

### npm test

<!-- npm test 실행 결과를 복사해서 붙여넣으세요. -->

```
PASS  tests/taskController.test.js
PASS  tests/taskService.test.js

Test Suites: 2 passed, 2 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        2.145s
```

- [x] 모든 테스트 통과 (X/X)
- [x] 새로 추가된 테스트도 통과
- [x] 기존 테스트 깨지지 않음 (회귀 확인)

### npm test -- --coverage

<!-- 커버리지 결과를 포함하세요. 목표: Service 90%+, Controller 80%+ -->

```
File                          | % Stmts | % Branch | % Funcs | % Lines
------------------------------|---------|----------|---------|----------
services/taskService.js       |    92.3 |    90.0  |   95.2  |   92.3
controllers/taskController.js |    85.7 |    82.5  |   88.0  |    85.7
```

### 수동 테스트

<!-- npm start 후 브라우저/curl로 테스트한 내용 -->

- [x] 정상 경로 (Happy path) 확인
  - 예: `curl -X POST http://localhost:3000/api/tasks`
  - 결과: 201, 응답 본문에 id 포함
  
- [x] 실패 경로 (Error path) 확인
  - 예: `curl -X POST http://localhost:3000/api/tasks` (title 없음)
  - 결과: 400, 에러 메시지 '...'

- [x] UI 동작 (필요시)
  - http://localhost:3000 에서 기본 기능 동작

---

## 📚 문서 동기화

<!-- CLAUDE.md에 문서 갱신 규칙이 있습니다 (.claude/rules/documentation.md) -->

- [ ] CLAUDE.md REST API 표 갱신 (엔드포인트 변경 시)
- [ ] CLAUDE.md 스키마 표 갱신 (DB 변경 시)
- [ ] `.claude/rules/error-mapping.md` 갱신 (상태 코드/에러 메시지 변경 시)
- [ ] README.md 갱신 (필요시)
- [ ] 코드 주석/JSDoc 추가 (필요시)
- [ ] 테스트 파일에 테스트 추가

### 갱신 내용

<!-- 각 문서별로 무엇을 변경했는지 나열하세요. -->

- CLAUDE.md REST API 표: `POST /api/tasks/bulk` 행 추가
- tests/taskController.test.js: 새 엔드포인트 테스트 6개 추가

---

## 🔗 관계없는 변경 방지

<!-- .claude/rules/git-workflow.md 참고 -->

- [x] 이 PR은 하나의 주제만 다룸
  - 주제: `POST /api/tasks/bulk 엔드포인트 추가`
  
- [x] 관계없는 리팩터링/포맷팅 섞여 있지 않음
  
- [x] 다른 기능의 버그 수정이 없음

---

## 🔐 보안 & 규칙 준수

### 금지 파일 검사

<!-- .claude/rules/git-workflow.md 참고 -->

- [x] `.env`, `.env.local` 없음
- [x] `node_modules/` 없음
- [x] `credentials.json`, `*.pem` 없음
- [x] `.aws/`, `.ssh/` 없음
- [x] `dist/`, `build/` 없음

### Conventional Commits 규약

<!-- COMMIT_CONVENTION.md 참고 -->

- [x] 커밋 메시지가 Conventional Commits 1.0 준수
  - Type: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `style`, `ci` 중 하나
  - Scope: 해당 레이어/기능 명시 (api, service, db, test 등)
  - Description: 명령형 현재시제, 50자 이하, 마침표 없음
  - Footer: 이슈 연결 (Closes #123)

### 아키텍처 규칙

<!-- CLAUDE.md 참고 -->

- [x] 계층 분리 준수
  - [ ] Routes → Controllers → Services → DB (단방향)
  - [ ] Controllers가 DB 접근하지 않음
  - [ ] Services가 HTTP 처리하지 않음

- [x] SQL 파라미터화 (SQL 인젝션 방지)
  - 모든 쿼리가 `?` 플레이스홀더 사용

- [x] HTTP 상태 코드 규약 준수
  - 201 Created (POST 성공)
  - 200 OK (GET/PUT 성공)
  - 204 No Content (DELETE 성공)
  - 400 Bad Request (검증 실패)
  - 404 Not Found (리소스 없음)
  - 500 Internal Server Error (서버 오류)

---

## 📊 변경 통계

<!-- GitHub가 자동 생성, 수동 수정 금지 -->

- **파일**: X개 변경
- **추가**: XXX줄
- **삭제**: XX줄

---

## 🎯 리뷰 요청 (선택)

<!-- 코드리뷰 요청할 팀원을 명시하세요. -->

@reviewer1 @reviewer2 — 코드 리뷰 요청합니다.

---

## 📝 추가 노트 (선택)

<!-- 리뷰어가 알아야 할 추가 정보가 있으면 작성하세요. -->

- 이 PR 후 다음 작업: [링크]
- 성능 영향 없음 (테스트 시간 2ms 증가)
- 기존 기능 100% 호환

---

## ✨ 완료 체크리스트

PR 제출 전에 반드시 확인하세요:

- [ ] **코드**
  - [ ] `npm test` 모두 통과 (X/X)
  - [ ] 금지 파일 없음 (.env, node_modules 등)
  - [ ] 아키텍처 규칙 준수 (Routes → Controllers → Services → DB)
  - [ ] HTTP 상태 코드 규약 준수

- [ ] **테스트**
  - [ ] Happy path 테스트 있음
  - [ ] Error path 테스트 있음 (≥2개)
  - [ ] 격리 설정 (beforeEach/afterEach)
  - [ ] 커버리지 Service 90%+, Controller 80%+

- [ ] **문서**
  - [ ] CLAUDE.md 갱신 (필요시)
  - [ ] error-mapping.md 갱신 (필요시)
  - [ ] README.md 갱신 (필요시)
  - [ ] 코드 주석/JSDoc (필요시)

- [ ] **규칙**
  - [ ] Conventional Commits 준수
  - [ ] PR 템플릿 작성 완료
  - [ ] 하나의 주제만 다룸
  - [ ] 관계없는 변경 없음

---

**템플릿 버전**: 1.0  
**최종 업데이트**: 2026-07-13  
**참고**: `.claude/rules/git-workflow.md`, `COMMIT_CONVENTION.md`, `CLAUDE.md`
