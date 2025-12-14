// dolphin-jsx-core/systems/database.js
'use strict';

export default async function _initDatabase() {
  const system = {
    drivers: new Map(),
    currentDriver: null,
    connections: new Map(),
    
    ready: () => Promise.resolve(true),
    destroy: async () => {
      // Close all connections
      for (const [name, conn] of this.connections) {
        try {
          await conn.close();
        } catch (error) {
          this.logger.error(`Failed to close connection ${name}:`, error);
        }
      }
      this.connections.clear();
      this.drivers.clear();
    },
    
    // Register driver
    registerDriver(name, driver) {
      this.drivers.set(name, driver);
      this.logger.info(`Registered database driver: ${name}`);
      return this;
    },
    
    // Connect to database
    async connect(options = {}) {
      const {
        driver = this.currentDriver || 'indexeddb',
        name = 'default',
        version = 1,
        ...driverOptions
      } = options;
      
      const driverImpl = this.drivers.get(driver);
      if (!driverImpl) {
        throw new Error(`Database driver not found: ${driver}`);
      }
      
      try {
        const connection = await driverImpl.connect({
          name,
          version,
          ...driverOptions
        });
        
        this.connections.set(name, connection);
        this.currentDriver = driver;
        
        this.logger.info(`Connected to database: ${name} (${driver})`);
        return connection;
        
      } catch (error) {
        this.logger.error(`Database connection failed:`, error);
        throw error;
      }
    },
    
    // Get connection
    getConnection(name = 'default') {
      return this.connections.get(name);
    },
    
    // Execute query
    async query(sql, params = [], connectionName = 'default') {
      const connection = this.getConnection(connectionName);
      if (!connection) {
        throw new Error(`Database connection not found: ${connectionName}`);
      }
      
      try {
        const result = await connection.query(sql, params);
        return result;
      } catch (error) {
        this.logger.error(`Query failed: ${sql}`, error);
        throw error;
      }
    },
    
    // CRUD operations
    async create(table, data) {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
      return this.query(sql, values);
    },
    
    async read(table, where = {}, options = {}) {
      let sql = `SELECT * FROM ${table}`;
      const params = [];
      
      if (Object.keys(where).length > 0) {
        const conditions = Object.keys(where).map(key => {
          params.push(where[key]);
          return `${key} = ?`;
        }).join(' AND ');
        
        sql += ` WHERE ${conditions}`;
      }
      
      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
        if (options.orderDirection) {
          sql += ` ${options.orderDirection}`;
        }
      }
      
      if (options.limit) {
        sql += ` LIMIT ${options.limit}`;
        if (options.offset) {
          sql += ` OFFSET ${options.offset}`;
        }
      }
      
      return this.query(sql, params);
    },
    
    async update(table, data, where) {
      const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const whereClause = Object.keys(where)
        .map(key => `${key} = ?`)
        .join(' AND ');
      
      const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
      const params = [...Object.values(data), ...Object.values(where)];
      
      return this.query(sql, params);
    },
    
    async delete(table, where) {
      const whereClause = Object.keys(where)
        .map(key => `${key} = ?`)
        .join(' AND ');
      
      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
      const params = Object.values(where);
      
      return this.query(sql, params);
    },
    
    // Transaction support
    async transaction(callback, connectionName = 'default') {
      const connection = this.getConnection(connectionName);
      if (!connection) {
        throw new Error(`Database connection not found: ${connectionName}`);
      }
      
      if (!connection.transaction) {
        throw new Error('Transactions not supported by this driver');
      }
      
      try {
        await connection.beginTransaction();
        const result = await callback(this);
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    },
    
    // Migration support
    async migrate(migrations, connectionName = 'default') {
      const connection = this.getConnection(connectionName);
      
      // Create migrations table if not exists
      await this.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, [], connectionName);
      
      // Get applied migrations
      const applied = await this.query(
        'SELECT name FROM migrations ORDER BY id',
        [],
        connectionName
      );
      
      const appliedNames = new Set(applied.map(m => m.name));
      
      // Apply pending migrations
      for (const migration of migrations) {
        if (!appliedNames.has(migration.name)) {
          this.logger.info(`Applying migration: ${migration.name}`);
          
          try {
            await this.transaction(async (db) => {
              if (typeof migration.up === 'function') {
                await migration.up(db);
              } else if (typeof migration.up === 'string') {
                await db.query(migration.up);
              }
              
              await db.query(
                'INSERT INTO migrations (name) VALUES (?)',
                [migration.name]
              );
            }, connectionName);
            
            this.logger.info(`Migration applied: ${migration.name}`);
          } catch (error) {
            this.logger.error(`Migration failed: ${migration.name}`, error);
            throw error;
          }
        }
      }
    },
    
    // Initialize with default drivers
    async _initDrivers() {
      // IndexedDB driver (web)
      this.registerDriver('indexeddb', {
        async connect(options) {
          return new Promise((resolve, reject) => {
            const request = indexedDB.open(options.name, options.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result;
              resolve({
                db,
                query: async (sql, params) => {
                  // Simplified query for IndexedDB
                  return new Promise((resolve, reject) => {
                    const transaction = db.transaction(['data'], 'readwrite');
                    const store = transaction.objectStore('data');
                    const request = store.put({ sql, params, timestamp: Date.now() });
                    
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve({ rows: [] });
                  });
                },
                close: () => db.close()
              });
            };
            
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains('data')) {
                db.createObjectStore('data', { keyPath: 'id', autoIncrement: true });
              }
            };
          });
        }
      });
      
      // SQLite driver (Node.js, mobile)
      if (typeof require !== 'undefined') {
        try {
          const sqlite3 = require('sqlite3');
          
          this.registerDriver('sqlite', {
            async connect(options) {
              return new Promise((resolve, reject) => {
                const db = new sqlite3.Database(options.path || ':memory:', (err) => {
                  if (err) reject(err);
                  else {
                    resolve({
                      db,
                      query: (sql, params) => {
                        return new Promise((resolve, reject) => {
                          if (sql.trim().toUpperCase().startsWith('SELECT')) {
                            db.all(sql, params, (err, rows) => {
                              if (err) reject(err);
                              else resolve({ rows });
                            });
                          } else {
                            db.run(sql, params, function(err) {
                              if (err) reject(err);
                              else resolve({ 
                                rows: [],
                                lastID: this.lastID,
                                changes: this.changes 
                              });
                            });
                          }
                        });
                      },
                      beginTransaction: () => {
                        return new Promise((resolve, reject) => {
                          db.run('BEGIN TRANSACTION', (err) => {
                            if (err) reject(err);
                            else resolve();
                          });
                        });
                      },
                      commit: () => {
                        return new Promise((resolve, reject) => {
                          db.run('COMMIT', (err) => {
                            if (err) reject(err);
                            else resolve();
                          });
                        });
                      },
                      rollback: () => {
                        return new Promise((resolve, reject) => {
                          db.run('ROLLBACK', (err) => {
                            if (err) reject(err);
                            else resolve();
                          });
                        });
                      },
                      close: () => {
                        return new Promise((resolve, reject) => {
                          db.close((err) => {
                            if (err) reject(err);
                            else resolve();
                          });
                        });
                      }
                    });
                  }
                });
              });
            }
          });
        } catch (error) {
          this.logger.warn('SQLite driver not available:', error.message);
        }
      }
      
      // LocalStorage driver (fallback for web)
      this.registerDriver('localstorage', {
        async connect(options) {
          const storage = {
            data: JSON.parse(localStorage.getItem(options.name) || '{}'),
            
            async query(sql, params) {
              // Very simplified - just store key-value pairs
              if (sql.includes('INSERT INTO') || sql.includes('UPDATE')) {
                const key = params[0];
                const value = params[1];
                storage.data[key] = value;
                localStorage.setItem(options.name, JSON.stringify(storage.data));
                return { rows: [], lastID: key };
              } else if (sql.includes('SELECT')) {
                const key = params[0];
                const value = storage.data[key];
                return { rows: value ? [{ key, value }] : [] };
              }
              return { rows: [] };
            },
            
            close: () => {
              // Nothing to close for LocalStorage
              return Promise.resolve();
            }
          };
          
          return storage;
        }
      });
    }
  };
  
  // Initialize drivers
  await system._initDrivers();
  
  // Auto-connect based on platform
  if (this.state.platform === 'web') {
    try {
      await system.connect({ driver: 'indexeddb', name: 'dolphin-db' });
    } catch {
      // Fallback to localStorage
      await system.connect({ driver: 'localstorage', name: 'dolphin-db' });
    }
  } else if (this.state.platform === 'node') {
    try {
      await system.connect({ driver: 'sqlite', name: 'dolphin-db', path: './data.db' });
    } catch {
      this.logger.warn('No database connection available');
    }
  }
  
  this.logger.info('Database system initialized');
  
  return system;
}