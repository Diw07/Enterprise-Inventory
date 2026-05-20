const app  = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await pool.query('SELECT 1'); // verify DB connection
    console.log('✅  Database connected');
    app.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌  Failed to connect to DB:', err.message);
    process.exit(1);
  }
};

start();
