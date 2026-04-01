import express from "express";
import cors from "cors";
import ordersRouter from "./routes/orders";
import parseRouter from "./routes/parse";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/parse', parseRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  if (err instanceof Error && err.message.includes('LIMIT_FILE_SIZE')) {
    return res.status(413).json({ success: false, error: '文件大小超过限制（最大 50MB）' });
  }
  res.status(500).json({ success: false, error: err.message || '服务器错误' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
