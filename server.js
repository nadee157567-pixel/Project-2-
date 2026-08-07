require('dotenv').config();

const app = require('./src/app');
const pool = require('./src/config/database');

const port = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    const connection = await pool.getConnection();

    console.log('เชื่อมต่อ MySQL สำเร็จ');
    connection.release();

    app.listen(port, () => {
      console.log(`Backend running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('ไม่สามารถเชื่อมต่อ MySQL ได้');
    console.error(error.message);
    process.exit(1);
  }
}

startServer();