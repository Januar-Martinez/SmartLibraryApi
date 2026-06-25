const express = require('express');
const { connectDB } = require('./config/database');
const cors = require('cors');
require('dotenv').config();

const memberRoutes = require('./routes/memberRoutes');
const bookRoutes = require('./routes/bookRoutes');
const loanRoutes = require('./routes/loanRoutes');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/members', memberRoutes);
app.use('/books', bookRoutes);
app.use('/loan', loanRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🚀 API SmartLibrary funcionando correctamente' });
});

const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('❌ Error al iniciar el servidor:', error.message);
  process.exit(1);
});