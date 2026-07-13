# Commit Convention — TaskFlow

**표준**: [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)

모든 커밋 메시지는 이 규약을 따릅니다. `.claude/rules/git-workflow.md`와 함께 읽으세요.

---

## 1. 형식

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

### 예시

```
feat(api): POST /api/tasks/bulk 엔드포인트 추가

여러 태스크를 한 번에 생성할 수 있습니다.
배열 검증은 Controller에서 수행되고,
개별 생성은 Service에서 처리됩니다.

Closes #45
```

---

## 2. Type (필수)

| Type | 의미 | 예시 | BREAKING CHANGE? |
|------|------|------|------------------|
| **feat** | 새 기능 추가 | `feat(api): POST /api/tasks 엔드포인트` | O (선택) |
| **fix** | 버그 수정 | `fix(service): taskService.update() null 체크` | X |
| **test** | 테스트만 추가/수정 | `test(controller): 404 상태 코드 테스트` | X |
| **docs** | 문서만 변경 | `docs(readme): 설치 가이드 추가` | X |
| **refactor** | 기능 유지, 코드 재구성 | `refactor(service): 중복 검증 로직 제거` | X |
| **chore** | 의존성, 빌드, 설정 | `chore(deps): Jest 업그레이드 (29.7.0)` | X |
| **style** | 포맷팅, 세미콜론 (기능 변화 X) | `style(lint): ESLint 경고 수정` | X |
| **ci** | CI/CD 설정 변경 | `ci(github): 테스트 워크플로우 추가` | X |
| **perf** | 성능 개선 | `perf(db): 쿼리 인덱스 추가` | X (선택) |

**선택 규칙**:
- `feat`와 `perf`는 BREAKING CHANGE를 일으킬 수 있으므로 (선택) 헤더에 `!` 추가 가능
  ```
  feat!: 주요 기능 변경 (하위 호환 불가)
  ```
- 나머지 타입은 BREAKING CHANGE를 일으키지 않음

---

## 3. Scope (선택, 권장)

**변경 범위를 표시**합니다. 없을 수도 있음.

```
feat(api): ...        # API 레이어
feat(service): ...    # Service 레이어
feat(db): ...         # Database 레이어
feat(test): ...       # 테스트
feat(doc): ...        # 문서
feat(deps): ...       # 의존성
feat(config): ...     # 설정
```

### 권장 Scope 목록

| Scope | 대상 | 예시 |
|-------|------|------|
| **api** | REST 엔드포인트 | `feat(api): POST /api/tasks/bulk` |
| **controller** | Controller 레이어 | `fix(controller): 입력 검증 추가` |
| **service** | Service 레이어 | `refactor(service): 쿼리 로직 단순화` |
| **db** | Database, 스키마 | `feat(db): priority 컬럼 추가` |
| **test** | 테스트 코드 | `test(service): 엣지 케이스 테스트` |
| **docs** | 문서 | `docs(api): API 명세 갱신` |
| **rules** | 개발 규칙 | `docs(rules): git-workflow.md 추가` |
| **config** | 설정 (jest, eslint, .env 등) | `chore(config): jest.config.js 업데이트` |
| **deps** | 의존성 | `chore(deps): express 4.18.2 → 4.19.0` |
| **ci** | CI/CD | `ci(github): 테스트 워크플로우` |

---

## 4. Description (필수)

**규칙**:
- ✅ 명령형 현재시제 ("add" O, "added" X, "adds" X)
- ✅ 첫 글자 소문자 ("add endpoint" O, "Add endpoint" X)
- ✅ 마침표 없음 ("add endpoint" O, "add endpoint." X)
- ✅ 50자 이하
- ✅ 무엇을 했는지 명확함

### ✅ Good

```
feat(api): POST /api/tasks 엔드포인트 추가
fix(service): taskService.update() null 체크 누락
test(controller): DELETE /api/tasks 404 테스트 추가
docs(readme): 빠른 시작 섹션 추가
refactor(controller): 검증 로직 공통 함수로 추출
chore(deps): Jest 업그레이드 (29.7.0)
style(lint): ESLint 경고 해결
```

### ❌ Bad

```
feat(api): Added new endpoint         # 과거형
feat(api): Add POST /api/tasks.       # 마침표
feat(api): Adding POST endpoint       # 진행형
feat(api): 새 엔드포인트를 추가했습니다. # 과거형, 마침표, 길음
fix: 버그 수정                         # scope 없음, 모호함
WIP: 작업 진행 중                      # type 잘못됨
```

---

## 5. Body (선택, 복잡한 경우)

**언제 작성?**
- Description만으로 부족할 때
- "왜" 이 변경이 필요한지 설명할 때
- 대안을 검토했을 때

**규칙**:
- Description과 공백 라인으로 분리
- 3~5문장으로 요약
- 마크다운 형식 가능 (불릿, 코드)

### 예시

```
feat(api): POST /api/tasks/bulk 엔드포인트 추가

여러 태스크를 한 번에 생성할 수 있습니다.
배열 검증은 Controller에서 수행되고,
개별 생성은 Service에서 처리됩니다.

변경 사항:
- routes/taskRoutes.js: 라우트 추가
- controllers/taskController.js: 핸들러 구현
- services/taskService.js: 비즈니스 로직
- tests/taskController.test.js: 테스트 추가

이 변경으로 임포트 기능(#45)을 지원합니다.
```

---

## 6. Footer (선택)

### 관련 이슈 링크

```
Closes #45                 # PR 병합 시 이슈 자동 종료
Closes #45, #46, #47       # 여러 이슈
Closes taskflow-starter#45  # 다른 저장소의 이슈
Refs #45                    # 단순 참조 (자동 종료 X)
```

### BREAKING CHANGE

```
BREAKING CHANGE: 하위 호환 불가 설명

BREAKING CHANGE: /api/tasks 응답 구조 변경
  - 기존: { tasks: [...] }
  - 변경: { data: [...], page, total }
```

### 예시

```
fix(service): taskService.update() null 체크 누락

id 없을 때 에러 대신 null을 반환했습니다.
이제 null을 확인해서 404를 반환합니다.

Closes #123
```

---

## 7. 커밋 작성 예시 모음

### 예시 1: 새 기능 (feat)

```bash
git commit -m "feat(api): POST /api/tasks/bulk 엔드포인트 추가

여러 태스크를 한 번에 생성할 수 있습니다.
배열 검증은 Controller에서 수행되고,
개별 생성은 Service에서 처리됩니다.

Closes #45"
```

### 예시 2: 버그 수정 (fix)

```bash
git commit -m "fix(service): taskService.update() null 체크 누락

id 없을 때 에러 대신 null을 반환했습니다.
이제 null을 확인해서 404를 반환합니다."
```

### 예시 3: 테스트 추가 (test)

```bash
git commit -m "test(controller): POST /api/tasks 400 상태 코드 테스트"
```

### 예시 4: 문서 갱신 (docs)

```bash
git commit -m "docs(rules): git-workflow.md 규칙 추가"
```

### 예시 5: 리팩터링 (refactor)

```bash
git commit -m "refactor(controller): 입력 검증 로직 공통 함수로 추출

taskController의 validateTaskInput 중복을 제거하고,
별도 함수로 분리하여 재사용성 향상"
```

### 예시 6: 의존성 변경 (chore)

```bash
git commit -m "chore(deps): Jest 업그레이드 (29.7.0 → 30.0.0)"
```

### 예시 7: 설정 변경 (chore)

```bash
git commit -m "chore(config): .eslintrc.json 규칙 업데이트"
```

### 예시 8: 포맷팅 (style)

```bash
git commit -m "style(lint): ESLint 경고 해결 (세미콜론)"
```

---

## 8. BREAKING CHANGE (선택, feat/perf만)

**하위 호환 불가 변경일 때**:

### 헤더에 `!` 추가

```
feat!: /api/tasks 응답 구조 변경 (하위 호환 불가)
```

### 또는 Footer에 명시

```
feat(api): /api/tasks 응답 구조 변경

이전: { tasks: [...] }
현재: { data: [...], page, total }

BREAKING CHANGE: 응답 구조 변경됨. 클라이언트 수정 필요
```

---

## 9. 완료 체크리스트

```markdown
## 커밋 메시지 작성 전 체크

- [ ] Type 정확함? (feat, fix, test, docs, refactor, chore, style, ci, perf)
- [ ] Scope 명시? (api, service, db, test, docs, rules, config, deps, ci)
- [ ] Description 50자 이하?
  - [ ] 명령형 현재시제? (add O, added X, adds X)
  - [ ] 첫 글자 소문자?
  - [ ] 마침표 없음?
- [ ] Body 필요한 경우 작성? (3~5문장)
- [ ] Footer에 이슈 링크? (Closes #123)
- [ ] BREAKING CHANGE? (feat/perf만, `!` 또는 footer 명시)

예시:
```
feat(api): POST /api/tasks/bulk 엔드포인트 추가

여러 태스크를 한 번에 생성할 수 있습니다.

Closes #45
```
```

---

## 10. 자동 검증 (CI)

`.github/workflows/test.yml`에서 커밋 메시지를 자동 검증합니다.

**검증 항목**:
- ✅ Type 유효함?
- ✅ Scope (선택사항) 유효함?
- ✅ Description 규칙 준수?
- ✅ BREAKING CHANGE 명시?

**실패 시**:
```
❌ Commit message validation failed
   - Type 'feat'는 유효
   - Description '엔드포인트'는 50자 미만 ✓
   - Body 있음 ✓
   - Footer 'Closes #45' ✓
```

---

## 11. 참고

**관련 문서**:
- `.claude/rules/git-workflow.md` — 커밋 단위, PR 규칙, 리뷰 기준
- `.github/PULL_REQUEST_TEMPLATE.md` — PR 템플릿
- `.github/workflows/test.yml` — CI 워크플로우

**외부 참고**:
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)

---

**문서 버전**: 1.0  
**최종 업데이트**: 2026-07-13  
**표준**: Conventional Commits 1.0.0
