# TaskFlow — 최초 소스 (step-0 원형)

"Claude Code 기반 개발 자동화" 과정의 관통 실습 프로젝트입니다. 이 디렉터리는 **학생이 수업 시작에 받아 작업하는 최초 소스**(step-0 원형)입니다. 순수 앱 상태로 CLAUDE.md·CI·알림 기능이 아직 없습니다. 실습집을 따라 일곱 단계를 진행하며 코드와 자동화 자산을 차례로 추가합니다.

## 기술 스택

- Node.js 20 이상
- Express (웹 프레임워크), EJS (뷰 템플릿)
- better-sqlite3 (데이터베이스)
- Jest, supertest (테스트)

## 시작

```bash
npm install
cp .env.example .env   # 값 채우기
npm start
# http://localhost:3000  (빈 태스크 목록이 뜹니다)
```

## 테스트

```bash
npm test
```

원형(step-0)은 테스트가 거의 없습니다. 실습 3(테스트 자동화)부터 본격 추가해 과정 끝에 31개가 통과합니다. 완료 상태는 `labs/taskflow-completed/`에서 `npm install && npm test`로 확인할 수 있습니다.

## 디렉터리 구조 (4계층 단방향 의존)

```
taskflow-starter/
├── app.js                          # Express 설정·라우트 마운트
├── routes/taskRoutes.js            # REST 라우트 정의
├── controllers/taskController.js   # 입력 검증·DTO 변환·상태 코드
├── services/taskService.js         # 비즈니스 로직·DB 접근(SQL)
├── db/database.js                  # better-sqlite3 연결·initDb
├── views/index.ejs                 # 태스크 목록 뷰
└── tests/                          # Jest 테스트
```

## tasks 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 자동 증가 식별자 |
| title | TEXT NOT NULL | 태스크 제목 |
| description | TEXT | 설명 |
| status | TEXT | todo, in_progress, done (기본 todo, **현재 검증 없음 — 실습 5에서 화이트리스트 추가**) |
| assignee | TEXT | 담당자 |
| created_at | TEXT | 생성 시각 |

## REST 라우트

| 메서드 | 경로 | 기능 | 상태 코드 |
|--------|------|------|-----------|
| GET | / | 태스크 목록 뷰(EJS) | 200 |
| GET | /api/tasks | 태스크 목록 JSON | 200 |
| POST | /api/tasks | 태스크 생성 | 201 (title 누락 시 400) |
| PUT | /api/tasks/:id | 태스크 부분 갱신 | 200 (없으면 404) |
| DELETE | /api/tasks/:id | 태스크 삭제 | 204 (없으면 404) |

**상세 API 문서**: [`API.md`](./API.md) — 요청/응답 스키마, 에러 메시지, curl 예제 포함

에러 매핑 규약(고정): 검증 실패 400, 레코드 없음 404, 생성 성공 201, 삭제 성공 204, 미처리 예외 500.

## 실습 진행

이 코드에 실습집을 따라 다음을 차례로 추가합니다.

1. CLAUDE.md(프로젝트 맥락) · 2. 테스트 자동화(testing Rule·generate-tests 스킬·PostToolUse 훅·test-reviewer) · 3. 문서화·리팩터(documentation Rule·update-docs·refactor-safely) · 4. Git 자동화(git-workflow Rule·prepare-pr·code-reviewer·verify 훅) · 5. 버그 수정(fix-bug 스킬·Settings 권한 통제) · 6. 종합 실전(notificationService 알림, 부수 효과 설계).

각 단계에서 이 소스가 어떻게 바뀌는지(어느 파일이 추가·수정되는지)는 실습집 부록 **"TaskFlow step 체크포인트 요약"** 표를 참고하십시오. 모든 단계를 마친 완료본은 `labs/taskflow-completed/`(31 테스트 통과)에 있습니다.
