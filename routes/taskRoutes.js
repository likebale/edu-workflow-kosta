// REST routes for task management — see API.md for detailed specifications
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// GET / — Task list (HTML view)
router.get('/', taskController.listView);

// GET /api/tasks — Task list (JSON) with optional filters: ?status=X&search=Y&page=Z&pageSize=N
router.get('/api/tasks', taskController.listApi);

// POST /api/tasks — Create task (201 success, 400 validation error)
router.post('/api/tasks', taskController.create);

// PUT /api/tasks/:id — Partial update (200 success, 404 not found)
router.put('/api/tasks/:id', taskController.update);

// DELETE /api/tasks/:id — Delete task (204 success, 404 not found)
router.delete('/api/tasks/:id', taskController.remove);

module.exports = router;
