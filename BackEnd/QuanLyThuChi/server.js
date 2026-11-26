// Ứng dụng Quản lý thu chi - Backend Node.js thuần (http) + SQLite (node:sqlite, có sẵn từ Node 22)
// Chạy: node server.js  ->  mở http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'thuchi.db');
const PUBLIC_DIR = path.join(__dirname, 'public');

// ===== 1. DATABASE =====
const db = new DatabaseSync(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE,
    type  TEXT NOT NULL CHECK (type IN ('thu','chi'))
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    amount      INTEGER NOT NULL CHECK (amount > 0),
    type        TEXT    NOT NULL CHECK (type IN ('thu','chi')),
    category_id INTEGER REFERENCES categories(id),
    date        TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'cho_xu_ly' CHECK (status IN ('cho_xu_ly','hoan_thanh')),
    note        TEXT,
    created_at  TEXT    DEFAULT (datetime('now','localtime'))
  );
`);

// Dữ liệu mẫu cho lần chạy đầu tiên
if (db.prepare('SELECT COUNT(*) AS c FROM categories').get().c === 0) {
  const addCat = db.prepare('INSERT INTO categories (name, type) VALUES (?, ?)');
  [['Lương', 'thu'], ['Làm thêm', 'thu'], ['Học bổng', 'thu'],
   ['Ăn uống', 'chi'], ['Nhà trọ', 'chi'], ['Đi lại', 'chi'], ['Học tập', 'chi'], ['Giải trí', 'chi']]
    .forEach(([n, t]) => addCat.run(n, t));

  const catId = (n) => db.prepare('SELECT id FROM categories WHERE name = ?').get(n).id;
  const addTx = db.prepare(`INSERT INTO transactions (title, amount, type, category_id, date, status, note)
                            VALUES (?, ?, ?, ?, ?, ?, ?)`);
  [
    ['Lương part-time tháng 9', 3500000, 'thu', 'Làm thêm', '2026-09-30', 'hoan_thanh', 'Quán cà phê'],
    ['Tiền nhà tháng 10', 2000000, 'chi', 'Nhà trọ', '2026-10-01', 'hoan_thanh', ''],
    ['Học bổng KKHT', 5000000, 'thu', 'Học bổng', '2026-10-05', 'hoan_thanh', 'UEH'],
    ['Đi chợ tuần 1', 450000, 'chi', 'Ăn uống', '2026-10-07', 'hoan_thanh', ''],
    ['Mua giáo trình', 320000, 'chi', 'Học tập', '2026-10-12', 'hoan_thanh', 'Giáo trình Backend'],
    ['Lương part-time tháng 10', 3800000, 'thu', 'Làm thêm', '2026-10-31', 'hoan_thanh', ''],
    ['Tiền nhà tháng 11', 2000000, 'chi', 'Nhà trọ', '2026-11-01', 'hoan_thanh', ''],
    ['Xăng xe tháng 11', 250000, 'chi', 'Đi lại', '2026-11-05', 'hoan_thanh', ''],
    ['Xem phim cuối tuần', 180000, 'chi', 'Giải trí', '2026-11-15', 'hoan_thanh', ''],
    ['Ăn uống tuần 3', 520000, 'chi', 'Ăn uống', '2026-11-20', 'cho_xu_ly', ''],
    ['Lương part-time tháng 11', 3800000, 'thu', 'Làm thêm', '2026-11-30', 'cho_xu_ly', 'Chưa nhận'],
    ['Đóng học phí khoá học online', 600000, 'chi', 'Học tập', '2026-11-28', 'cho_xu_ly', ''],
  ].forEach(([ti, a, ty, c, d, s, n]) => addTx.run(ti, a, ty, catId(c), d, s, n));
}

// ===== 2. HÀM HỖ TRỢ =====
function sendJSON(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
  });
}

// Kiểm tra dữ liệu đầu vào cho giao dịch
function validateTx(b) {
  const errors = [];
  if (!b.title || !String(b.title).trim()) errors.push('Tên giao dịch không được để trống');
  if (!Number.isInteger(Number(b.amount)) || Number(b.amount) <= 0) errors.push('Số tiền phải là số nguyên dương');
  if (!['thu', 'chi'].includes(b.type)) errors.push('Loại phải là "thu" hoặc "chi"');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) errors.push('Ngày không hợp lệ (YYYY-MM-DD)');
  if (b.status && !['cho_xu_ly', 'hoan_thanh'].includes(b.status)) errors.push('Trạng thái không hợp lệ');
  return errors;
}

const TX_SELECT = `SELECT t.*, c.name AS category_name
                   FROM transactions t LEFT JOIN categories c ON c.id = t.category_id`;

// ===== 3. API ROUTES =====
async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api', 'transactions', ':id', 'status']
  const id = parts[2] ? Number(parts[2]) : null;

  // GET /api/categories
  if (parts[1] === 'categories' && req.method === 'GET') {
    return sendJSON(res, 200, db.prepare('SELECT * FROM categories ORDER BY type, name').all());
  }

  if (parts[1] === 'transactions') {
    // GET /api/transactions?type=&status=&q=&month=YYYY-MM  -> danh sách (có lọc)
    if (req.method === 'GET' && !id) {
      const where = [], params = [];
      const q = url.searchParams;
      if (q.get('type')) { where.push('t.type = ?'); params.push(q.get('type')); }
      if (q.get('status')) { where.push('t.status = ?'); params.push(q.get('status')); }
      if (q.get('month')) { where.push("substr(t.date,1,7) = ?"); params.push(q.get('month')); }
      if (q.get('q')) { where.push('t.title LIKE ?'); params.push('%' + q.get('q') + '%'); }
      const sql = TX_SELECT + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY t.date DESC, t.id DESC';
      return sendJSON(res, 200, db.prepare(sql).all(...params));
    }

    // GET /api/transactions/:id
    if (req.method === 'GET' && id) {
      const row = db.prepare(TX_SELECT + ' WHERE t.id = ?').get(id);
      return row ? sendJSON(res, 200, row) : sendJSON(res, 404, { error: 'Không tìm thấy giao dịch' });
    }

    // POST /api/transactions  -> THÊM
    if (req.method === 'POST' && !id) {
      const b = await readBody(req);
      const errors = validateTx(b);
      if (errors.length) return sendJSON(res, 400, { errors });
      const r = db.prepare(`INSERT INTO transactions (title, amount, type, category_id, date, status, note)
                            VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(b.title.trim(), Number(b.amount), b.type, b.category_id || null, b.date, b.status || 'cho_xu_ly', b.note || '');
      return sendJSON(res, 201, db.prepare(TX_SELECT + ' WHERE t.id = ?').get(r.lastInsertRowid));
    }

    // PATCH /api/transactions/:id/status  -> CẬP NHẬT TRẠNG THÁI
    if (req.method === 'PATCH' && id && parts[3] === 'status') {
      const b = await readBody(req);
      if (!['cho_xu_ly', 'hoan_thanh'].includes(b.status)) return sendJSON(res, 400, { errors: ['Trạng thái không hợp lệ'] });
      const r = db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run(b.status, id);
      if (!r.changes) return sendJSON(res, 404, { error: 'Không tìm thấy giao dịch' });
      return sendJSON(res, 200, db.prepare(TX_SELECT + ' WHERE t.id = ?').get(id));
    }

    // PUT /api/transactions/:id  -> SỬA
    if (req.method === 'PUT' && id) {
      const b = await readBody(req);
      const errors = validateTx(b);
      if (errors.length) return sendJSON(res, 400, { errors });
      const r = db.prepare(`UPDATE transactions SET title=?, amount=?, type=?, category_id=?, date=?, status=?, note=?
                            WHERE id=?`)
        .run(b.title.trim(), Number(b.amount), b.type, b.category_id || null, b.date, b.status || 'cho_xu_ly', b.note || '', id);
      if (!r.changes) return sendJSON(res, 404, { error: 'Không tìm thấy giao dịch' });
      return sendJSON(res, 200, db.prepare(TX_SELECT + ' WHERE t.id = ?').get(id));
    }

    // DELETE /api/transactions/:id  -> XOÁ
    if (req.method === 'DELETE' && id) {
      const r = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
      return r.changes ? sendJSON(res, 200, { deleted: id }) : sendJSON(res, 404, { error: 'Không tìm thấy giao dịch' });
    }
  }

  // GET /api/stats?month=YYYY-MM  -> THỐNG KÊ
  if (parts[1] === 'stats' && req.method === 'GET') {
    const month = url.searchParams.get('month');
    const cond = month ? "WHERE substr(date,1,7) = ?" : '';
    const p = month ? [month] : [];
    const totals = db.prepare(`SELECT
        COALESCE(SUM(CASE WHEN type='thu' THEN amount END),0) AS tong_thu,
        COALESCE(SUM(CASE WHEN type='chi' THEN amount END),0) AS tong_chi,
        COUNT(*) AS so_giao_dich,
        SUM(CASE WHEN status='cho_xu_ly' THEN 1 ELSE 0 END) AS cho_xu_ly,
        SUM(CASE WHEN status='hoan_thanh' THEN 1 ELSE 0 END) AS hoan_thanh
      FROM transactions ${cond}`).get(...p);
    totals.so_du = totals.tong_thu - totals.tong_chi;

    const byCategory = db.prepare(`SELECT c.name, t.type, SUM(t.amount) AS total, COUNT(*) AS count
      FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
      ${month ? "WHERE substr(t.date,1,7) = ?" : ''}
      GROUP BY c.name, t.type ORDER BY total DESC`).all(...p);

    const byMonth = db.prepare(`SELECT substr(date,1,7) AS month,
        SUM(CASE WHEN type='thu' THEN amount ELSE 0 END) AS thu,
        SUM(CASE WHEN type='chi' THEN amount ELSE 0 END) AS chi
      FROM transactions GROUP BY month ORDER BY month`).all();

    return sendJSON(res, 200, { totals, byCategory, byMonth });
  }

  sendJSON(res, 404, { error: 'API không tồn tại' });
}

// ===== 4. PHỤC VỤ FILE GIAO DIỆN (public/) =====
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };
function serveStatic(req, res, url) {
  const file = path.normalize(path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

// ===== 5. KHỞI ĐỘNG SERVER =====
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(new Date().toLocaleTimeString(), req.method, url.pathname);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    serveStatic(req, res, url);
  } catch (e) {
    sendJSON(res, 500, { error: 'Lỗi server: ' + e.message });
  }
});

server.listen(PORT, () => console.log(`Server Quản lý thu chi đang chạy tại http://localhost:${PORT}`));
