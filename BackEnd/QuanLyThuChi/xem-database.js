// Xuất cấu trúc + dữ liệu của file thuchi.db ra trang HTML (database-view.html) để xem nhanh database.
// Chạy: node xem-database.js
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(path.join(__dirname, 'thuchi.db'), { readOnly: true });
const esc = (s) => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
let html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Database thuchi.db</title>
<style>body{font-family:Segoe UI,Arial;margin:24px;background:#f7f9f8;color:#1f2d24}h1{color:#146d37}
h2{margin-top:28px}pre{background:#1e2a22;color:#c8f0d2;padding:14px;border-radius:8px;font-size:13px}
table{border-collapse:collapse;background:#fff;font-size:13px}th,td{border:1px solid #cfd9d2;padding:5px 9px}
th{background:#e3efe7}</style></head><body><h1>🗄️ Database: thuchi.db (SQLite)</h1>`;
for (const t of tables) {
  const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
  const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
  html += `<h2>Bảng <code>${t.name}</code> — ${rows.length} dòng</h2><pre>${esc(t.sql)}</pre><table><tr>`
    + cols.map(c => `<th>${c.name}<br><small>${c.type}${c.pk ? ' · PK' : ''}</small></th>`).join('') + '</tr>'
    + rows.map(r => '<tr>' + cols.map(c => `<td>${esc(r[c.name])}</td>`).join('') + '</tr>').join('') + '</table>';
}
html += '</body></html>';
fs.writeFileSync(path.join(__dirname, 'database-view.html'), html);
console.log('Đã tạo database-view.html');
