const { initDb } = require('../app');
const taskService = require('../services/taskService');

beforeAll(() => {
  initDb();
});

beforeEach(() => {
  const tasks = taskService.getAll();
  tasks.forEach(t => taskService.remove(t.id));
});

describe('taskService', () => {
  describe('create', () => {
    describe('정상 경로', () => {
      it('title만 있으면 새 태스크를 저장한다', () => {
        const task = taskService.create({ title: '새 태스크' });
        expect(task.id).toBeDefined();
        expect(task.title).toBe('새 태스크');
        expect(task.status).toBe('todo');
        expect(task.created_at).toBeDefined();
      });

      it('모든 필드를 지정하면 저장한다', () => {
        const task = taskService.create({
          title: '완전한 태스크',
          description: '설명',
          assignee: '김개발',
        });
        expect(task.title).toBe('완전한 태스크');
        expect(task.description).toBe('설명');
        expect(task.assignee).toBe('김개발');
      });
    });

    describe('실패 경로', () => {
      it('description/assignee가 null이면 null로 저장된다', () => {
        const task = taskService.create({ title: '테스트', description: null });
        expect(task.description).toBeNull();
      });
    });
  });

  describe('getById', () => {
    describe('정상 경로', () => {
      it('존재하는 id면 태스크를 반환한다', () => {
        const created = taskService.create({ title: '조회 테스트' });
        const result = taskService.getById(created.id);
        expect(result).toBeDefined();
        expect(result.title).toBe('조회 테스트');
        expect(result.id).toBe(created.id);
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

  describe('getAll', () => {
    describe('정상 경로', () => {
      it('모든 태스크를 역순으로 반환한다', () => {
        taskService.create({ title: 'A' });
        taskService.create({ title: 'B' });
        const all = taskService.getAll();
        expect(all.length).toBe(2);
        expect(all[0].title).toBe('B');
        expect(all[1].title).toBe('A');
      });

      it('데이터가 없으면 빈 배열을 반환한다', () => {
        const all = taskService.getAll();
        expect(all).toEqual([]);
      });

      it('status 필터로 특정 상태만 반환한다', () => {
        taskService.create({ title: '할 일 1', status: 'xfilter1' });
        taskService.create({ title: '진행중 1', status: 'xfilter2' });
        taskService.create({ title: '할 일 2', status: 'xfilter1' });
        const all = taskService.getAll({ status: 'xfilter1' });
        expect(all.length).toBe(2);
        expect(all.every(t => t.status === 'xfilter1')).toBe(true);
      });

      it('search로 제목 부분 일치 검색한다', () => {
        taskService.create({ title: 'xsearch버그수정' });
        taskService.create({ title: 'xsearch기능추가' });
        taskService.create({ title: 'xsearch버그테스트' });
        const all = taskService.getAll({ search: 'xsearch버그' });
        expect(all.length).toBe(2);
        expect(all.every(t => t.title.includes('xsearch버그'))).toBe(true);
      });

      it('status와 search를 동시에 적용한다', () => {
        taskService.create({ title: 'xyzsearch버그수정', status: 'xyzstat1' });
        taskService.create({ title: 'xyzsearch버그테스트', status: 'xyzstat2' });
        taskService.create({ title: 'xyzsearch기능추가', status: 'xyzstat1' });
        const all = taskService.getAll({ status: 'xyzstat1', search: 'xyzsearch버그' });
        expect(all.length).toBe(1);
        expect(all[0].title).toBe('xyzsearch버그수정');
        expect(all[0].status).toBe('xyzstat1');
      });

      it('페이지네이션 없이 status/search 필터는 배열을 반환한다', () => {
        taskService.create({ title: 'pA', status: 'pstat' });
        taskService.create({ title: 'pB', status: 'pstat' });
        const result = taskService.getAll({ status: 'pstat' });
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
      });

      it('페이지네이션 요청 시 envelope 객체를 반환한다', () => {
        taskService.create({ title: 'pA' });
        taskService.create({ title: 'pB' });
        taskService.create({ title: 'pC' });
        const result = taskService.getAll({ page: 1, pageSize: 2 });
        expect(result.data).toBeDefined();
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(2);
        expect(result.total).toBe(3);
        expect(result.totalPages).toBe(2);
        expect(result.data.length).toBe(2);
      });

      it('페이지네이션 + status 필터를 동시에 적용한다', () => {
        taskService.create({ title: 'pqA', status: 'pqstat' });
        taskService.create({ title: 'pqB', status: 'pqstat' });
        taskService.create({ title: 'pqC', status: 'other' });
        const result = taskService.getAll({ status: 'pqstat', page: 1, pageSize: 1 });
        expect(result.total).toBe(2);
        expect(result.totalPages).toBe(2);
        expect(result.data.length).toBe(1);
        expect(result.data[0].title).toBe('pqB');
      });
    });

    describe('실패 경로', () => {
      it('존재하지 않는 status로 필터링하면 빈 배열을 반환한다', () => {
        taskService.create({ title: 'eA', status: 'estat' });
        const all = taskService.getAll({ status: 'nonexistent-e' });
        expect(all).toEqual([]);
      });

      it('리터럴 % 포함된 검색어도 올바르게 이스케이프한다', () => {
        taskService.create({ title: 'e50% 할인' });
        taskService.create({ title: 'e50 percent' });
        const all = taskService.getAll({ search: 'e50%' });
        expect(all.length).toBe(1);
        expect(all[0].title).toBe('e50% 할인');
      });

      it('리터럴 _ 포함된 검색어도 올바르게 이스케이프한다', () => {
        taskService.create({ title: 'etask_name' });
        taskService.create({ title: 'etaskXname' });
        const all = taskService.getAll({ search: 'etask_' });
        expect(all.length).toBe(1);
        expect(all[0].title).toBe('etask_name');
      });

      it('데이터 범위를 벗어난 페이지는 빈 data를 반환한다', () => {
        taskService.create({ title: 'eA' });
        const result = taskService.getAll({ page: 2, pageSize: 10 });
        expect(result.data).toEqual([]);
        expect(result.totalPages).toBe(1);
      });

      it('totalPages는 최소 1 이상이다', () => {
        const result = taskService.getAll({ page: 1, pageSize: 10 });
        expect(result.totalPages).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('update', () => {
    let task;

    beforeEach(() => {
      task = taskService.create({ title: '수정 대상', assignee: '김개발' });
    });

    describe('정상 경로', () => {
      it('일부 필드만 변경한다', () => {
        const updated = taskService.update(task.id, { status: 'done' });
        expect(updated.status).toBe('done');
        expect(updated.title).toBe('수정 대상');
        expect(updated.assignee).toBe('김개발');
      });

      it('여러 필드를 동시에 변경할 수 있다', () => {
        const updated = taskService.update(task.id, {
          title: '새 제목',
          status: 'in_progress',
          assignee: '이개발',
        });
        expect(updated.title).toBe('새 제목');
        expect(updated.status).toBe('in_progress');
        expect(updated.assignee).toBe('이개발');
      });

      it('빈 업데이트 객체도 허용한다 (기존값 유지)', () => {
        const updated = taskService.update(task.id, {});
        expect(updated.title).toBe('수정 대상');
        expect(updated.status).toBe('todo');
      });

      it('description만 변경할 수 있다', () => {
        const updated = taskService.update(task.id, { description: '새로운 설명' });
        expect(updated.description).toBe('새로운 설명');
        expect(updated.title).toBe('수정 대상');
      });
    });

    describe('실패 경로', () => {
      it('존재하지 않는 id면 null을 반환한다', () => {
        const result = taskService.update(999, { status: 'done' });
        expect(result).toBeNull();
      });

      it('음수 id면 null을 반환한다', () => {
        const result = taskService.update(-1, { status: 'done' });
        expect(result).toBeNull();
      });
    });
  });

  describe('remove', () => {
    describe('정상 경로', () => {
      it('존재하는 id를 삭제하면 true를 반환한다', () => {
        const task = taskService.create({ title: '삭제 대상' });
        const result = taskService.remove(task.id);
        expect(result).toBe(true);
        expect(taskService.getById(task.id)).toBeUndefined();
      });
    });

    describe('실패 경로', () => {
      it('존재하지 않는 id면 false를 반환한다', () => {
        const result = taskService.remove(999);
        expect(result).toBe(false);
      });

      it('음수 id면 false를 반환한다', () => {
        const result = taskService.remove(-1);
        expect(result).toBe(false);
      });

      it('같은 id를 두 번 삭제하면 두 번째는 false를 반환한다', () => {
        const task = taskService.create({ title: '중복 삭제 테스트' });
        const first = taskService.remove(task.id);
        const second = taskService.remove(task.id);
        expect(first).toBe(true);
        expect(second).toBe(false);
      });
    });
  });
});
