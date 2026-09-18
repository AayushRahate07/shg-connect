import { app } from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[SHGConnect Sync Backend] Running on http://localhost:${PORT}`);
});
