import { api } from '@/lib/axios';

export const uploadsService = {
  async uploadImages(files: File[]): Promise<{ urls: string[]; count: number }> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const { data } = await api.post('/uploads/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
