// TaskFlow 엔트리. Express 설정과 라우트 마운트를 담당한다.
require('dotenv').config();
const express = require('express');
const path = require('path');
const { initDb } = require('./db/database');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 요청 로깅 미들웨어 — 모든 요청의 메서드, 경로, 응답 시간을 기록한다.
app.use((req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${statusCode} (${duration}ms)`);
    return originalSend.call(this, data);
  };

  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', taskRoutes);

// 404 핸들러 — 매칭되는 라우트가 없을 때 404 반환 (CLAUDE.md 규약)
app.use((req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다' });
});

// 전역 에러 핸들러 — 미처리 예외를 500으로 처리한다 (CLAUDE.md 규약)
// 반드시 4개 파라미터 (err, req, res, next) 모두 필요함 (Express 규약)
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: '서버 에러' });
});

function start() {
  initDb();
  app.listen(PORT, () => {
    console.log('TaskFlow 서버가 http://localhost:' + PORT + ' 에서 실행 중입니다');
  });
}

// 직접 실행할 때만 서버를 띄운다. 테스트에서는 app 만 임포트한다.
if (require.main === module) {
  start();
}

module.exports = { app, initDb };
