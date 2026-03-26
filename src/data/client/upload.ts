import { HttpClient } from './http-client';
import { API_ENDPOINTS } from './api-endpoints';
import { Attachment } from '@/types';

export const uploadClient = {
  upload: async (variables: Attachment[]) => {
    let formData = new FormData();
    variables.forEach((attachment: any) => {
      console.log('Appending:', attachment, attachment instanceof File);
      formData.append('attachment', attachment); // ✅ sans [] // form-data all.
    });
    return HttpClient.post(API_ENDPOINTS.ATTACHMENTS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

