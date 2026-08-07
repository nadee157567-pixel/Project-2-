require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const pool = require('./src/config/database');

const port = Number(process.env.PORT || 3000);

// สร้าง HTTP server จาก Express app
const server = http.createServer(app);

// ตั้งค่า Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // เมื่อผู้ใช้เข้าสู่ห้องแชท
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // เมื่อมีการส่งข้อความ
  socket.on('send_message', async (data) => {
    const { roomId, senderId, messageText } = data;

    try {
      // 1. บันทึกข้อความลง Database
      const [result] = await pool.query(
        'INSERT INTO messages (room_id, sender_id, message_text) VALUES (?, ?, ?)',
        [roomId, senderId, messageText]
      );
      
      const newMessage = {
        message_id: result.insertId,
        room_id: roomId,
        sender_id: senderId,
        message_text: messageText,
        is_read: 0,
        sent_at: new Date()
      };

      // 2. กระจายข้อความให้ทุกคนในห้อง (รวมถึงคนส่งด้วย) ให้หน้าจออัปเดตตรงกัน
      io.to(roomId).emit('receive_message', newMessage);
      
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('เชื่อมต่อ MySQL สำเร็จ');
    connection.release();

    // เปลี่ยนจาก app.listen เป็น server.listen
    server.listen(port, () => {
      console.log(`Backend running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('ไม่สามารถเชื่อมต่อ MySQL ได้');
    console.error(error.message);
    process.exit(1);
  }
}

startServer();