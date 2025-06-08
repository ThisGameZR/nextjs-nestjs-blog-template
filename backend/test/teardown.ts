import { getApp, getDataSource } from './setup';

export default async () => {
  const app = getApp();
  const dataSource = getDataSource();
  
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
  
  if (app) {
    await app.close();
  }
}; 