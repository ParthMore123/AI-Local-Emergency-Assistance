const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'ailea-data')
  : path.join(__dirname, '../../data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function fileFor(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readAll(name) {
  ensureDir();
  const file = fileFor(name);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeAll(name, rows) {
  ensureDir();
  fs.writeFileSync(fileFor(name), JSON.stringify(rows, null, 2));
}

function matches(doc, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      if (value.$in) return value.$in.map(String).includes(String(doc[key]));
      if (value.$gte || value.$lte) {
        const t = new Date(doc[key]).getTime();
        if (value.$gte && t < new Date(value.$gte).getTime()) return false;
        if (value.$lte && t > new Date(value.$lte).getTime()) return false;
        return true;
      }
    }
    return String(doc[key]) === String(value);
  });
}

function attachSave(name, doc) {
  const wrapped = {
    ...structuredClone(doc),
    toObject() {
      const { save, toObject, ...rest } = wrapped;
      return JSON.parse(JSON.stringify(rest));
    },
    async save() {
      wrapped.updatedAt = new Date().toISOString();
      const rows = readAll(name);
      const idx = rows.findIndex((r) => String(r._id) === String(wrapped._id));
      const { save, toObject, ...plain } = wrapped;
      const stored = JSON.parse(JSON.stringify(plain));
      if (idx >= 0) {
        if (!stored.passwordHash && rows[idx].passwordHash) {
          stored.passwordHash = rows[idx].passwordHash;
        }
        rows[idx] = stored;
      } else {
        rows.push(stored);
      }
      writeAll(name, rows);
      return wrapped;
    },
  };
  return wrapped;
}

function sortRows(rows, spec = {}) {
  const entries = Object.entries(spec);
  if (!entries.length) return rows;
  return [...rows].sort((a, b) => {
    for (const [key, dir] of entries) {
      const av = a[key];
      const bv = b[key];
      if (av === bv) continue;
      if (av > bv) return dir === -1 ? -1 : 1;
      return dir === -1 ? 1 : -1;
    }
    return 0;
  });
}

function collection(name) {
  return {
    async countDocuments() {
      return readAll(name).length;
    },
    async deleteMany(query = {}) {
      if (!Object.keys(query).length) {
        writeAll(name, []);
        return;
      }
      writeAll(name, readAll(name).filter((row) => !matches(row, query)));
    },
    async insertMany(docs) {
      const rows = readAll(name);
      const created = docs.map((doc) => ({
        _id: doc._id || crypto.randomUUID(),
        ...doc,
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      writeAll(name, rows.concat(created));
      return created;
    },
    async create(doc) {
      const created = {
        _id: crypto.randomUUID(),
        ...JSON.parse(JSON.stringify(doc)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const rows = readAll(name);
      rows.push(created);
      writeAll(name, rows);
      return attachSave(name, created);
    },
    find(query = {}) {
      let spec = {};
      let limitCount = Infinity;
      const chain = {
        sort(nextSpec) {
          spec = nextSpec || {};
          return chain;
        },
        limit(n) {
          limitCount = n;
          return chain;
        },
        then(resolve, reject) {
          try {
            const rows = sortRows(readAll(name).filter((row) => matches(row, query)), spec)
              .slice(0, Number.isFinite(limitCount) ? limitCount : undefined)
              .map((row) => attachSave(name, row));
            resolve(rows);
          } catch (error) {
            reject(error);
          }
        },
      };
      return chain;
    },
    async findOne(query) {
      const row = readAll(name).find((item) => matches(item, query));
      return row ? attachSave(name, row) : null;
    },
    async findById(id) {
      const row = readAll(name).find((item) => String(item._id) === String(id));
      return row ? attachSave(name, row) : null;
    },
    async findOneAndDelete(query) {
      const rows = readAll(name);
      const idx = rows.findIndex((item) => matches(item, query));
      if (idx < 0) return null;
      const [removed] = rows.splice(idx, 1);
      writeAll(name, rows);
      return attachSave(name, removed);
    },
  };
}

module.exports = { collection, DATA_DIR };
