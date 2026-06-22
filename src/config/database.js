const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const dbConfig = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER}\\${process.env.DB_INSTANCE};Database=${process.env.DB_NAME};Trusted_Connection=yes;`,
  driver: 'msnodesqlv8',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

const connectDB = async () => {
  if (pool) return pool;
  pool = await sql.connect(dbConfig);
  console.log('Conectado a SQL Server Express correctamente');
  return pool;
};

const getPool = async () => {
  return await connectDB();
};

module.exports = { connectDB, getPool, sql };