import axios from 'axios';

const API_BASE_url = 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_url,
  timeout: 60000, // Increased timeout to 60s for LLM operations
});

export const workflowApi = {
  // Save workflow
  save: (data: any) => api.post('/workflow', data),
  
  // Get workflow list
  list: () => api.get('/workflow'),
  
  // Get workflow detail
  get: (id: number) => api.get(`/workflow/${id}`),
};

export const executionApi = {
  execute: (data: any) => api.post('/execute', data),
};

export const saveWorkflow = async (workflowData: any) => {
    try {
        const response = await workflowApi.save(workflowData);
        return response.data;
    } catch (error) {
        console.error('Error saving workflow:', error);
        throw error;
    }
};
