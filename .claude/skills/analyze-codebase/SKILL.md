---
name: analyze-codebase
description: This skill should be used when the user asks to "analyze this codebase", "코드베이스 분석해줘", "이 저장소 구조 파악해줘", "explain the architecture", "온보딩용으로 구조 설명해줘", or wants a repository overview before writing/updating CLAUDE.md, before a large refactor, or when onboarding to an unfamiliar repo. Runs a six-step structured analysis (dependency & stack verification, folder structure & layers, core data model, API endpoints & status codes, request flow tracing, hidden conventions & weakness spotting) and produces a CLAUDE.md-ready summary plus a prioritized list of discovered weaknesses.
version: 0.2.0
---

# Analyze Codebase

## Input
- Repository root path (default: current working directory, referred to below as `{{REPO_ROOT}}`)

## Output
Two artifacts, always both:
1. **CLAUDE.md 요약** — 아키텍처 요약(디렉터리 구조, 계층 표, 도메인 용어, REST 스펙, 대표 요청 흐름)을 CLAUDE.md에 바로 붙여넣을 수 있는 형태로 작성
2. **발견된 약점 목록** — 코드 변경 제안이 아니라 "발견 사실"만. 각 항목에 파일:라인 근거 포함, 우선순위순, 수정 여부는 사용자가 결정

## Method

Run the six steps in order. Each step builds on previous findings. Use Explore subagent or direct Read/Grep; do not skip to synthesis without evidence from each step.

### (1) 의존성과 스택 확인

**목표**: 의존도 흐름이 단방향인지, 순환 의존성이 있는지, 계층을 건너뛰는 호출이 있는지 검증

Prompt template:
> `{{REPO_ROOT}}` 저장소의 폴더 구조를 보고 이 프로젝트의 계층(layer) 구조를 식별해줘(예: routes → controllers → services → db). 각 계층의 대표 파일을 열어 import/require 관계를 확인하고:
> 1. 의존 방향이 단방향인지 (역방향 호출이 있는지)
> 2. 계층을 건너뛰는 호출이 있는지
> 3. 순환 의존성이 있는지
> 확인해줘. 결과를 "Routes → Controllers → Services → DB" 같은 흐름 다이어그램과 체크 리스트로 정리해줘.

---

### (2) 폴더 구조와 계층 파악

**목표**: 전체 디렉터리 구조와 각 계층의 책임 명확히 파악

Prompt template:
> `{{REPO_ROOT}}` 저장소의 전체 폴더 구조를 트리 형태로 나열해줘(`node_modules`, `.git`, `dist`, `build` 등 생성물 제외). 최상위 및 2단계 깊이까지 포함하고, 소스 코드 파일 확장자별 개수도 통계로 알려줘. 그 다음 각 계층별로 책임이 뭔지 (있는 것 vs 없는 것)를 표로 정리해줘.

---

### (3) 핵심 데이터 모델 지목

**목표**: 엔티티, 필드, 변환/검증 함수의 정의와 사용처 파악

Prompt template:
> `{{REPO_ROOT}}`의 소스 코드를 읽고 다음을 찾아줘:
> 1. 핵심 엔티티 이름 (예: task, user) — 테이블명, 변수명, 함수명에서 반복되는 패턴
> 2. 주요 필드명과 각각의 타입, 검증 여부, 기본값 (표로)
> 3. 여러 계층에서 재사용되는 함수 (예: DTO 변환, 입력 검증) — 정의 위치, 호출 위치
> 4. 같은 데이터가 계층마다 다르게 다뤄지는지 여부
> 결과를 필드명 테이블과 함수 매트릭스로 정리해줘.

---

### (4) 주요 엔드포인트와 상태 코드 정리

**목표**: REST API 스펙 정의 — 경로, 메서드, 성공/실패 상태 코드, 응답 형식

Prompt template:
> `{{REPO_ROOT}}`의 라우트 정의 파일을 읽고 모든 엔드포인트를 표로 정리해줘:
> - 메서드 (GET, POST, PUT, DELETE 등)
> - 경로 (/, /api/resource, /api/resource/:id 등)
> - 기능 설명
> - 성공 상태 코드 (200, 201, 204 등)
> - 실패 상태 코드 (400, 404, 500 등)
> - 응답 형식 (JSON, HTML, 응답 본문 유무)
> 그리고 각 엔드포인트별 에러 핸들링 패턴을 정리해줘.

---

### (5) 한 요청의 흐름 끝까지 추적

**목표**: 가장 복잡한 쓰기 작업(생성/수정) 엔드포인트를 선택해 진입점부터 DB까지 추적

Prompt template:
> `{{REPO_ROOT}}`에서 POST (생성) 또는 PUT (수정) 엔드포인트 중 가장 많은 계층을 통과하는 것을 선택해줘. 그 엔드포인트의 전체 흐름을 단계별로 추적해줘:
> 
> 각 단계마다 명시해줄 것:
> - 파일 경로와 라인 번호
> - 함수명
> - 입력값 (예: req.body = {...})
> - 처리 내용 (검증? SQL? 변환?)
> - 출력값 (다음 단계로 넘어가는 데이터)
> 
> 성공 경로와 실패 경로(검증 실패 시 조기 반환 등)도 함께 표시해줘. 마크다운 코드 블록과 플로우 다이어그램으로 정리해줘.

---

### (6) 숨은 규약과 약점 발견

**목표**: 암묵적 규약(관례), 일관성 부재, 검증 격차 등 약점 식별

Prompt template:
> 지금까지 수집한 정보 (1-5단계)를 바탕으로 다음을 확인해줘:
>
> **(검증)**
> - title만 검증되는가? 다른 필드는?
> - create와 update에서 검증이 다른가?
> - 서비스 레벨에서 입력을 신뢰하는가?
> - DB 스키마에 제약이 있는가? (NOT NULL, CHECK, UNIQUE 등)
>
> **(비대칭성)**
> - 같은 데이터가 뷰와 API에서 다르게 처리되는가?
> - 응답 형식이 일관되는가? (상태 코드, 본문 유무)
> - 부분 업데이트(PATCH)와 전체 교체(PUT)가 구분되는가?
>
> **(규약)**
> - 검증 위치는 어디인가? (모든 엔드포인트에서 동일한가?)
> - 에러 응답 형식은 통일되어 있는가?
> - 자동 값(기본값, 타임스탬프)이 어디서 설정되는가?
>
> 발견한 약점을 우선순위 테이블로 정리해줘. 각 약점마다 파일:라인, 문제점, 심각도(🔴/🟠/🟡)를 명시해줘.

---

## Output format

ALWAYS structure the final response using this template:

```markdown
# <프로젝트명> 코드베이스 분석

## CLAUDE.md에 반영할 요약

### 아키텍처
(의존도 다이어그램, 폴더 트리, 계층 표)

### 데이터 모델
(엔티티명, 필드 테이블, 검증 상태)

### REST API
(엔드포인트 표, 상태 코드 규약)

### 대표 요청 흐름
(POST /api/... 단계별 추적, 플로우 다이어그램)

## 발견된 약점

| 우선순위 | 파일:라인 | 문제점 | 심각도 |
|---------|----------|--------|--------|
| 1       | ...      | ...    | 🔴    |
| 2       | ...      | ...    | 🔴    |
```

**중요**: 약점 목록은 "발견 사실"로만. 수정 방안이나 권장사항은 절대 넣지 마 — 사용자가 결정해. 각 약점에 구체적인 파일:라인 근거 필수.
