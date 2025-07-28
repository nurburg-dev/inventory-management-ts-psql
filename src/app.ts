import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/connection';
import itemRoutes from './routes/itemRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      timestamp: result.rows[0].now,
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Inventory Management API',
    version: '1.0.0'
  });
});

app.use('/api/items', itemRoutes);

export default app;