// frontend/js/api.js

import { showMessage } from './utils.js';

// Base URL for your deployed backend API
// IMPORTANT: Ensure this matches your live Render backend URL
const BASE_URL = 'https://ecommerce-backend-api-omvv.onrender.com/api';

// --- Token Management ---
let jwtToken = localStorage.getItem('jwtToken'); // Initialize from local storage

export function setToken(token) {
    jwtToken = token;
    localStorage.setItem('jwtToken', token);
    console.log('JWT Token set:', token);
}

export function removeToken() {
    jwtToken = null;
    localStorage.removeItem('jwtToken');
    console.log('JWT Token removed.');
}

// --- Generic API Request Helper ---
async function apiRequest(endpoint, method = 'GET', data = null, authRequired = false) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };

    if (authRequired) {
        if (!jwtToken) {
            showMessage('Authentication required. Please log in.', 'error');
            throw new Error('No authentication token found.');
        }
        headers['Authorization'] = `Bearer ${jwtToken}`;
    }

    const config = {
        method: method,
        headers: headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json();
            showMessage(errorData.message || `API Error: ${response.statusText}`, 'error');
            throw new Error(errorData.message || `API Error: ${response.statusText}`);
        }

        // Handle cases where response might be empty (e.g., DELETE requests)
        const text = await response.text();
        return text ? JSON.parse(text) : {};

    } catch (error) {
        console.error(`Request to ${url} failed:`, error);
        // showMessage is already called above for HTTP errors
        throw error; // Re-throw to be caught by specific API functions
    }
}

// --- API Service Objects ---

export const authApi = {
    register: (username, email, password) => apiRequest('/auth/register', 'POST', { username, email, password }),
    login: (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
};

export const productApi = {
    createProduct: (productData) => apiRequest('/products', 'POST', productData, true),
    getAllProducts: () => apiRequest('/products'), // Publicly accessible
    getProductById: (id) => apiRequest(`/products/${id}`), // Publicly accessible
    updateProduct: (id, productData) => apiRequest(`/products/${id}`, 'PUT', productData, true),
    deleteProduct: (id) => apiRequest(`/products/${id}`, 'DELETE', null, true),
};

export const orderApi = {
    createOrder: (orderData) => apiRequest('/orders', 'POST', orderData, true),
    getOrders: () => apiRequest('/orders', 'GET', null, true), // Can be user's or all for admin
    getOrderDetails: (id) => apiRequest(`/orders/${id}`, 'GET', null, true),
    updateOrderStatus: (id, status) => apiRequest(`/orders/${id}/status`, 'PATCH', { status }, true),
    updateOrderPaymentStatus: (id, payment_status) => apiRequest(`/orders/${id}/payment-status`, 'PATCH', { payment_status }, true),
    deleteOrder: (id) => apiRequest(`/orders/${id}`, 'DELETE', null, true), // User can delete own 'cancelled' orders, Admin any
};

export const userApi = {
    getAllUsers: () => apiRequest('/users', 'GET', null, true), // Admin only
    getUserById: (id) => apiRequest(`/users/${id}`, 'GET', null, true), // Admin or user themselves
    updateUser: (id, userData) => apiRequest(`/users/${id}`, 'PUT', userData, true), // Admin or user themselves
    deleteUser: (id) => apiRequest(`/users/${id}`, 'DELETE', null, true), // Admin only
};

export const messageApi = {
    sendMessage: (receiverId, subject, messageText) => apiRequest('/messages', 'POST', { receiverId, subject, messageText }, true),
    getMessages: () => apiRequest('/messages', 'GET', null, true), // User's or all for admin
    getMessageById: (id) => apiRequest(`/messages/${id}`, 'GET', null, true),
    markMessageAsRead: (id) => apiRequest(`/messages/${id}/read`, 'PATCH', null, true),
    deleteMessage: (id) => apiRequest(`/messages/${id}`, 'DELETE', null, true), // Admin or user's own sent
};
