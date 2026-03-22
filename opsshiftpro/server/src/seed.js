const bcrypt = require('bcryptjs');
const { getDb } = require('./db');

function seed(db) {
  const password = bcrypt.hashSync('Shift@2024', 10);

  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)'
  );

  insertUser.run('operator1', password, 'operator', 'Alex Johnson');
  insertUser.run('operator2', password, 'operator', 'Sam Rivera');
  insertUser.run('supervisor', password, 'supervisor', 'Morgan Chen');

  console.log('Seeded users: operator1, operator2, supervisor (password: Shift@2024)');
}

// Run directly
if (require.main === module) {
  const db = getDb();
  seed(db);
  db.close();
  console.log('Seed complete.');
}

module.exports = { seed };
