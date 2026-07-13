// 요청 처리, 입력 검증, 응답 변환을 담당한다.
const taskService = require('../services/taskService');

const VALID_STATUSES = ['todo', 'in_progress', 'done'];

// 입력 검증. title 은 필수이며 빈 문자열이면 안 된다. status 는 화이트리스트만 허용.
function validateTaskInput(body) {
  if (!body || !body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return { valid: false, message: 'title 은 필수입니다' };
  }

  // Step-5: status 검증 추가 (화이트리스트: todo, in_progress, done)
  if (body.status !== undefined && body.status !== null) {
    if (!VALID_STATUSES.includes(body.status)) {
      return { valid: false, message: '유효하지 않은 status 입니다' };
    }
  }

  return { valid: true };
}

// 부분 업데이트 시 status 필드만 검증 (title은 선택)
function validateStatusField(body) {
  if (body.status !== undefined && body.status !== null) {
    if (!VALID_STATUSES.includes(body.status)) {
      return { valid: false, message: '유효하지 않은 status 입니다' };
    }
  }
  return { valid: true };
}

// 데이터베이스 행을 응답용 DTO 로 변환한다.
function toTaskDTO(task) {
  if (!task) return null;
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    assignee: task.assignee,
    created_at: task.created_at
  };
}

function listView(req, res) {
  const tasks = taskService.getAll();
  res.render('index', { tasks });
}

function listApi(req, res) {
  const { status, search } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (search) filters.search = search;

  if (req.query.page !== undefined) {
    const pageNum = Number(req.query.page);
    filters.page = Number.isFinite(pageNum) && pageNum >= 1 ? Math.floor(pageNum) : 1;

    const sizeNum = Number(req.query.pageSize);
    filters.pageSize = Number.isFinite(sizeNum) && sizeNum >= 1 ? Math.min(Math.floor(sizeNum), 100) : 20;
  }

  const result = taskService.getAll(filters);
  const payload = Array.isArray(result)
    ? result.map(toTaskDTO)
    : { ...result, data: result.data.map(toTaskDTO) };
  res.json(payload);
}

function create(req, res) {
  const validation = validateTaskInput(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }
  const task = taskService.create(req.body);
  return res.status(201).json(toTaskDTO(task));
}

function update(req, res) {
  const id = Number(req.params.id);
  const validation = validateStatusField(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }
  const task = taskService.update(id, req.body);
  if (!task) {
    return res.status(404).json({ error: '태스크를 찾을 수 없습니다' });
  }
  return res.json(toTaskDTO(task));
}

function remove(req, res) {
  const id = Number(req.params.id);
  const deleted = taskService.remove(id);
  if (!deleted) {
    return res.status(404).json({ error: '태스크를 찾을 수 없습니다' });
  }
  return res.status(204).send();
}

module.exports = {
  listView,
  listApi,
  create,
  update,
  remove,
  validateTaskInput,
  validateStatusField,
  toTaskDTO
};
