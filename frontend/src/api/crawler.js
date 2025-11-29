import client from './client';

export const crawlImages = async (data) => {
  return client.post('/crawler/crawl', data);
};
