import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { ApiResponse } from '../types';

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    if (res.code !== 0) {
      if (res.code === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        message.error(res.message || '请求失败');
      }
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      message.error('权限不足');
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else {
      message.error('网络错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    request.post<ApiResponse<{ token: string; user: any }>>('/auth/login', { username, password }),
  getCurrentUser: () =>
    request.get<ApiResponse>('/auth/me'),
  getUserList: () =>
    request.get<ApiResponse>('/auth/users'),
};

export const jobApi = {
  create: (data: any) =>
    request.post<ApiResponse>('/jobs', data),
  update: (id: string, data: any) =>
    request.put<ApiResponse>(`/jobs/${id}`, data),
  close: (id: string) =>
    request.patch<ApiResponse>(`/jobs/${id}/close`),
  reopen: (id: string) =>
    request.patch<ApiResponse>(`/jobs/${id}/reopen`),
  pause: (id: string) =>
    request.patch<ApiResponse>(`/jobs/${id}/pause`),
  getById: (id: string) =>
    request.get<ApiResponse>(`/jobs/${id}`),
  getList: (params?: any) =>
    request.get<ApiResponse>('/jobs', { params }),
};

export const candidateApi = {
  create: (data: any) =>
    request.post<ApiResponse>('/candidates', data),
  update: (id: string, data: any) =>
    request.put<ApiResponse>(`/candidates/${id}`, data),
  getById: (id: string) =>
    request.get<ApiResponse>(`/candidates/${id}`),
  getList: (params?: any) =>
    request.get<ApiResponse>('/candidates', { params }),
  changeStage: (id: string, newStage: string, description?: string) =>
    request.post<ApiResponse>(`/candidates/${id}/change-stage`, { newStage, description }),
};

export const interviewApi = {
  create: (data: any) =>
    request.post<ApiResponse>('/interviews', data),
  update: (id: string, data: any) =>
    request.put<ApiResponse>(`/interviews/${id}`, data),
  cancel: (id: string) =>
    request.patch<ApiResponse>(`/interviews/${id}/cancel`),
  getById: (id: string) =>
    request.get<ApiResponse>(`/interviews/${id}`),
  getList: (params?: any) =>
    request.get<ApiResponse>('/interviews', { params }),
};

export const evaluationApi = {
  create: (data: any) =>
    request.post<ApiResponse>('/evaluations', data),
  getByInterviewId: (interviewId: string) =>
    request.get<ApiResponse>(`/evaluations/interview/${interviewId}`),
  getByCandidateId: (candidateId: string) =>
    request.get<ApiResponse>(`/evaluations/candidate/${candidateId}`),
};

export const offerApi = {
  create: (data: any) =>
    request.post<ApiResponse>('/offers', data),
  updateStatus: (id: string, status: string) =>
    request.patch<ApiResponse>(`/offers/${id}/status`, { status }),
  getById: (id: string) =>
    request.get<ApiResponse>(`/offers/${id}`),
  getList: (params?: any) =>
    request.get<ApiResponse>('/offers', { params }),
};

export const dashboardApi = {
  getStats: (params?: any) =>
    request.get<ApiResponse>('/dashboard', { params }),
};

export default request;
