import app from '../src/app';
import { connectDatabase } from '../src/config/database';
import { initCloudinary } from '../src/config/cloudinary';

let isInitialized = false;

const init = async () => {
  if (!isInitialized) {
    await connectDatabase();
    initCloudinary();
    isInitialized = true;
  }
};

export default async (req: any, res: any) => {
  await init();
  return app(req, res);
};
