// Jest setup file - mock better-sqlite3 with in-memory implementation

class MockDb {
  constructor(path) {
    this.rows = {};
    this.nextId = {};
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        if (sql.includes('CREATE TABLE')) return { changes: 0 };
        if (sql.includes('INSERT INTO')) {
          const table = 'tasks';
          if (!self.rows[table]) {
            self.rows[table] = [];
            self.nextId[table] = 0;
          }
          const id = ++self.nextId[table];
          const row = {
            id,
            title: params[0],
            description: params[1],
            assignee: params[2],
            status: params[3] || 'todo',
            created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
          };
          self.rows[table].push(row);
          return { changes: 1, lastInsertRowid: id };
        }
        if (sql.includes('DELETE')) {
          const table = 'tasks';
          const before = self.rows[table] ? self.rows[table].length : 0;
          if (self.rows[table]) {
            self.rows[table] = self.rows[table].filter(r => r.id !== params[0]);
          }
          return { changes: before - (self.rows[table] ? self.rows[table].length : 0) };
        }
        if (sql.includes('UPDATE')) {
          const table = 'tasks';
          const row = self.rows[table]?.find(r => r.id === params[params.length - 1]);
          if (row) {
            row.title = params[0] !== null ? params[0] : row.title;
            row.description = params[1] !== null ? params[1] : row.description;
            row.status = params[2] !== null ? params[2] : row.status;
            row.assignee = params[3] !== null ? params[3] : row.assignee;
            return { changes: 1 };
          }
          return { changes: 0 };
        }
        return { changes: 0 };
      },

      all(...params) {
        const table = 'tasks';
        let results = self.rows[table] ? [...self.rows[table]] : [];

        // Parse WHERE clauses
        let whereIdx = 0;
        if (sql.includes('WHERE')) {
          if (sql.includes('status = ?')) {
            results = results.filter(r => r.status === params[whereIdx]);
            whereIdx++;
          }
          if (sql.includes('title LIKE ? ESCAPE')) {
            const pattern = params[whereIdx];
            // Pattern is like "%e50\%%"
            // First remove leading/trailing wildcards %, then unescape backslashes
            const core = pattern.slice(1, -1); // Remove % prefix/suffix
            const unescaped = core.replace(/\\(.)/g, '$1'); // Unescape \% -> %, \_ -> _, \\ -> \
            results = results.filter(r => r.title.includes(unescaped));
            whereIdx++;
          }
        }

        // Parse ORDER BY (must come before LIMIT/OFFSET)
        if (sql.includes('ORDER BY id DESC')) {
          results.reverse();
        }

        // Parse LIMIT OFFSET (must come after ORDER BY)
        if (sql.includes('LIMIT')) {
          const limit = params[whereIdx];
          const offset = params[whereIdx + 1];
          results = results.slice(offset, offset + limit);
        }

        return results;
      },

      get(...params) {
        const table = 'tasks';

        if (sql.includes('SELECT COUNT(*)')) {
          let results = self.rows[table] ? [...self.rows[table]] : [];

          if (sql.includes('WHERE')) {
            let whereIdx = 0;
            if (sql.includes('status = ?')) {
              results = results.filter(r => r.status === params[whereIdx]);
              whereIdx++;
            }
            if (sql.includes('title LIKE ? ESCAPE')) {
              const pattern = params[whereIdx];
              // Pattern is like "%e50\%%"
              const core = pattern.slice(1, -1); // Remove % prefix/suffix
              const unescaped = core.replace(/\\(.)/g, '$1'); // Unescape \% -> %, \_ -> _, \\ -> \
              results = results.filter(r => r.title.includes(unescaped));
            }
          }
          return { c: results.length };
        }

        if (sql.includes('SELECT * FROM') && sql.includes('WHERE')) {
          return self.rows[table]?.find(r => r.id === params[0]);
        }

        return undefined;
      }
    };
  }
}

jest.mock('better-sqlite3', () => jest.fn(() => new MockDb()));
