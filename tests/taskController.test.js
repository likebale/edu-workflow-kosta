const request = require('supertest');
const { app, initDb } = require('../app');
const taskService = require('../services/taskService');

beforeAll(() => {
  initDb();
});

beforeEach(() => {
  const tasks = taskService.getAll();
  tasks.forEach(t => taskService.remove(t.id));
});

describe('POST /api/tasks', () => {
  describe('정상 경로', () => {
    it('유효한 title이면 201과 task 객체를 반환한다', async () => {
      const res = await request(app).post('/api/tasks').send({ title: '새 태스크' });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('새 태스크');
      expect(res.body.status).toBe('todo');
      expect(res.body.created_at).toBeDefined();
    });

    it('assignee도 저장할 수 있다', async () => {
      const res = await request(app).post('/api/tasks').send({
        title: '담당자 있는 태스크',
        assignee: '김개발',
      });
      expect(res.status).toBe(201);
      expect(res.body.assignee).toBe('김개발');
    });

    it('description도 저장할 수 있다', async () => {
      const res = await request(app).post('/api/tasks').send({
        title: '설명 있는 태스크',
        description: '이것은 설명입니다',
      });
      expect(res.status).toBe(201);
      expect(res.body.description).toBe('이것은 설명입니다');
    });
  });

  describe('실패 경로', () => {
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
});

describe('GET /api/tasks', () => {
  describe('정상 경로', () => {
    it('데이터가 있으면 200과 배열을 반환한다', async () => {
      taskService.create({ title: '조회 테스트 1' });
      taskService.create({ title: '조회 테스트 2' });
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('데이터가 없으면 200과 빈 배열을 반환한다', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('?status=필터로 상태별 필터링한다', async () => {
      taskService.create({ title: 'ct1', status: 'todo' });
      taskService.create({ title: 'ct2', status: 'done' });
      taskService.create({ title: 'ct3', status: 'todo' });
      const res = await request(app).get('/api/tasks?status=todo');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body.every(t => t.status === 'todo')).toBe(true);
    });

    it('?search=필터로 제목 검색한다', async () => {
      taskService.create({ title: 'xsearch에러수정' });
      taskService.create({ title: 'xsearch기능추가' });
      taskService.create({ title: 'xsearch에러테스트' });
      const res = await request(app).get('/api/tasks?search=xsearch에러');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('?page=1은 배열을 반환한다 (envelope 아님)', async () => {
      taskService.create({ title: 'ct1' });
      taskService.create({ title: 'ct2' });
      const res = await request(app).get('/api/tasks?page=1');
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(20);
      expect(res.body.total).toBeDefined();
      expect(res.body.totalPages).toBeDefined();
    });

    it('?status=X&search=Y&page=Z를 동시에 적용한다', async () => {
      taskService.create({ title: 'xyza1', status: 'xyzst' });
      taskService.create({ title: 'xyza2', status: 'xyzst' });
      taskService.create({ title: 'xyzb1', status: 'xyzst' });
      const res = await request(app).get('/api/tasks?status=xyzst&search=xyza&page=1&pageSize=1');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(2);
    });
  });

  describe('실패 경로', () => {
    it('?page=abc는 200, 1페이지로 처리한다', async () => {
      taskService.create({ title: 'ct1' });
      const res = await request(app).get('/api/tasks?page=abc');
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
    });

    it('?page=-1은 200, 1페이지로 클램프한다', async () => {
      taskService.create({ title: 'ct1' });
      const res = await request(app).get('/api/tasks?page=-1');
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
    });

    it('?page=0은 200, 1페이지로 클램프한다', async () => {
      taskService.create({ title: 'ct1' });
      const res = await request(app).get('/api/tasks?page=0');
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
    });

    it('?pageSize=9999는 100으로 클램프한다', async () => {
      taskService.create({ title: 'ct1' });
      const res = await request(app).get('/api/tasks?page=1&pageSize=9999');
      expect(res.status).toBe(200);
      expect(res.body.pageSize).toBe(100);
    });

    it('범위 밖 페이지는 빈 data를 반환한다', async () => {
      taskService.create({ title: 'ct1' });
      const res = await request(app).get('/api/tasks?page=999&pageSize=10');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});

describe('GET /', () => {
  describe('정상 경로', () => {
    it('200과 HTML을 반환한다', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.type).toContain('html');
    });
  });
});

describe('PUT /api/tasks/:id', () => {
  let task;

  beforeEach(() => {
    task = taskService.create({
      title: '수정 대상',
      assignee: '김개발',
      status: 'todo',
    });
  });

  describe('정상 경로', () => {
    it('status를 변경하면 200과 updated task를 반환한다', async () => {
      const res = await request(app).put(`/api/tasks/${task.id}`).send({
        status: 'in_progress',
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in_progress');
      expect(res.body.title).toBe('수정 대상');
      expect(res.body.id).toBe(task.id);
    });

    it('여러 필드를 동시에 변경할 수 있다', async () => {
      const res = await request(app).put(`/api/tasks/${task.id}`).send({
        title: '수정된 제목',
        status: 'done',
        assignee: '이개발',
        description: '새 설명',
      });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('수정된 제목');
      expect(res.body.status).toBe('done');
      expect(res.body.assignee).toBe('이개발');
      expect(res.body.description).toBe('새 설명');
    });

    it('일부 필드만 변경해도 다른 필드는 유지된다', async () => {
      const res = await request(app).put(`/api/tasks/${task.id}`).send({
        description: '추가 설명',
      });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('수정 대상');
      expect(res.body.assignee).toBe('김개발');
      expect(res.body.description).toBe('추가 설명');
    });
  });

  describe('실패 경로', () => {
    it('존재하지 않는 id면 404를 반환한다', async () => {
      const res = await request(app).put('/api/tasks/999').send({
        status: 'done',
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
    });

    it('id가 음수면 404를 반환한다', async () => {
      const res = await request(app).put('/api/tasks/-1').send({
        status: 'done',
      });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
    });
  });

  describe('버그: status 필드 검증 없음 (재현 테스트)', () => {
    it('유효하지 않은 status는 400을 반환해야 한다 (현재 버그)', async () => {
      const res = await request(app).put(`/api/tasks/${task.id}`).send({
        status: 'INVALID',
      });
      // 예상: HTTP 400 + error message
      // 실제: HTTP 200 + 잘못된 status 저장됨 (버그)
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('유효하지 않은 status 입니다');
    });

    it('유효한 status (todo/in_progress/done)는 200을 반환해야 한다', async () => {
      const validStatuses = ['todo', 'in_progress', 'done'];

      for (const status of validStatuses) {
        const res = await request(app).put(`/api/tasks/${task.id}`).send({
          status,
        });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe(status);
      }
    });

    it('빈 문자열 status는 400을 반환해야 한다', async () => {
      const res = await request(app).put(`/api/tasks/${task.id}`).send({
        status: '',
      });
      // 예상: 400 (빈 값 거부)
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('유효하지 않은 status 입니다');
    });

    it('null status는 그냥 허용해야 한다 (부분 업데이트)', async () => {
      const res = await request(app).put(`/api/tasks/${task.id}`).send({
        description: '설명만 변경',
        status: null,
      });
      // status가 null이면 업데이트 스킵 (기존값 유지)
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('todo'); // 변경되지 않음
    });

    it('숫자 타입 status는 400을 반환해야 한다', async () => {
      const res = await request(app).put(`/api/tasks/${task.id}`).send({
        status: 123,
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('유효하지 않은 status 입니다');
    });
  });
});

describe('DELETE /api/tasks/:id', () => {
  let task;

  beforeEach(() => {
    task = taskService.create({ title: '삭제 대상' });
  });

  describe('정상 경로', () => {
    it('존재하는 id면 204와 빈 응답을 반환한다', async () => {
      const res = await request(app).delete(`/api/tasks/${task.id}`);
      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('삭제 후 조회하면 존재하지 않는다', async () => {
      await request(app).delete(`/api/tasks/${task.id}`);
      const found = taskService.getById(task.id);
      expect(found).toBeUndefined();
    });
  });

  describe('실패 경로', () => {
    it('존재하지 않는 id면 404를 반환한다', async () => {
      const res = await request(app).delete('/api/tasks/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
    });

    it('음수 id면 404를 반환한다', async () => {
      const res = await request(app).delete('/api/tasks/-1');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('태스크를 찾을 수 없습니다');
    });

    it('같은 id를 두 번 삭제하면 두 번째는 404를 반환한다', async () => {
      const first = await request(app).delete(`/api/tasks/${task.id}`);
      expect(first.status).toBe(204);

      const second = await request(app).delete(`/api/tasks/${task.id}`);
      expect(second.status).toBe(404);
      expect(second.body.error).toBe('태스크를 찾을 수 없습니다');
    });
  });
});
