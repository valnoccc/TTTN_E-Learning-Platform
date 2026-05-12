import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const axiosClient = axios.create({
    // Nếu không dùng biến môi trường, hãy để tạm string nhưng phải chính xác
    baseURL: 'https://tttn-e-learning-platform.onrender.com',
});

axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Với FormData, để axios tự set Content-Type phù hợp (multipart/form-data).
        if (config.data instanceof FormData && config.headers) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;