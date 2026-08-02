import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  const apiKey = localStorage.getItem('kf_api_key')
  if (apiKey && !apiKey.includes('sk-dummy')) config.headers['X-OpenAI-Api-Key'] = apiKey
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kf_token')
      localStorage.removeItem('kf_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

export const documentApi = {
  upload:   (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list:     (page = 0, size = 12) => api.get(`/documents?page=${page}&size=${size}`),
  getAll:   () => api.get('/documents/all'),
  delete:   (id) => api.delete(`/documents/${id}`),
  rename:   (id, data) => api.patch(`/documents/${id}/rename`, data),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  search:   (keyword) => api.get(`/documents/search?keyword=${encodeURIComponent(keyword)}`),
  stats:    () => api.get('/documents/stats'),
}

export const chatApi = {
  send:                 (data) => api.post('/chat', data),
  history:              ()     => api.get('/chat/history'),
  conversationHistory:  (id)   => api.get(`/chat/history/${id}`),
}

export const userApi = {
  getApiKey:    () => api.get('/user/api-key'),
  updateApiKey: (apiKey) => api.post('/user/api-key', { apiKey }),
}

export const ragApi = {
  ask:    (question) => api.get(`/rag?question=${encodeURIComponent(question)}`),
  search: (data)     => api.post('/rag/search', data),
}

export default api
