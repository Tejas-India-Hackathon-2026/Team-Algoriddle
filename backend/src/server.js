import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/routes.js';
import authRouter from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.add_middleware = app.use; // fallback if some packages expect add_middleware style
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing API Prefix
app.use('/api/auth', authRouter);
app.use('/api', router);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',


    
    message: err.message
  });
});

// App listener
app.listen(PORT, () => {
  console.log(`Bihar Yatra Express Server is running on port ${PORT}`);
});
