// frontend/js/api.js

// IMPORTANT: Replace this with your deployed backend API URL when hosting!
// For local development, it's http://localhost:3001
const BASE_URL = 'https://ecommerce-backend-api-omvv.onrender.com/api'; // Your deployed Render backend API base URL

// Utility to make authenticated API requests
async function fetchApi(endpoint, method = 'GET', data = null, authRequired = false) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (authRequired) {
        const token = localStorage.getItem('jwtToken'); // Ensure this matches auth.js
        if (!token) {
            // showMessage('Authentication required. Please log in.', 'error'); // Moved to auth.js
            throw new Error('No authentication token found.');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: method,
        headers: headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        const result = await response.json(); // Always try to parse JSON, even for errors

        if (!response.ok) {
            // Handle API errors (e.g., 401, 403, 400, 500)
            const errorMessage = result.message || `API Error: ${response.status} ${response.statusText}`;
            // showMessage(errorMessage, 'error'); // Moved to calling functions if needed
            throw new Error(errorMessage);
        }

        return result;
    } catch (error) {
        console.error(`API call to ${BASE_URL}${endpoint} failed:`, error);
        // If it's a network error or something not caught by response.ok
        // showMessage(`Network or server error: ${error.message}`, 'error'); // Moved to calling functions if needed
        throw error; // Re-throw to allow calling functions to handle
    }
}

// --- API Endpoints ---

// Authentication API
export const authApi = {
    register: (username, email, password) => fetchApi('/api/auth/register', 'POST', { username, email, password }),
    login: (email, password) => fetchApi('/api/auth/login', 'POST', { email, password }),
};

// Product API
export const productApi = {
    getAllProducts: () => fetchApi('/api/products'),
    getProductById: (id) => fetchApi(`/api/products/${id}`),
    createProduct: (productData) => fetchApi('/api/products', 'POST', productData, true), // Admin only
    updateProduct: (id, productData) => fetchApi(`/api/products/${id}`, 'PUT', productData, true), // Admin only
    deleteProduct: (id) => fetchApi(`/api/products/${id}`, 'DELETE', null, true), // Admin only
};

// Order API
export const orderApi = {
    createOrder: (orderData) => fetchApi('/api/orders', 'POST', orderData, true), // Authenticated user
    getOrders: () => fetchApi('/api/orders', 'GET', null, true), // Authenticated user/admin
    getOrderDetails: (id) => fetchApi(`/api/orders/${id}`, 'GET', null, true), // Authenticated user/admin
    updateOrderStatus: (id, status) => fetchApi(`/api/orders/${id}/status`, 'PATCH', { status }, true), // Admin only
    updateOrderPaymentStatus: (id, payment_status) => fetchApi(`/api/orders/${id}/payment-status`, 'PATCH', { payment_status }, true), // Admin only
    deleteOrder: (id) => fetchApi(`/api/orders/${id}`, 'DELETE', null, true), // Requires user/admin token (logic handled on backend)
};

// User API
export const userApi = {
    getAllUsers: () => fetchApi('/api/users', 'GET', null, true), // Admin only
    getUserById: (id) => fetchApi(`/api/users/${id}`, 'GET', null, true), // Admin or self
    updateUser: (id, userData) => fetchApi(`/api/users/${id}`, 'PUT', userData, true), // Admin or self
    deleteUser: (id) => fetchApi(`/api/users/${id}`, 'DELETE', null, true), // Admin only
};

// Message API (for user-admin communication)
export const messageApi = {
    sendMessage: (receiverId, subject, messageText) => fetchApi('/api/messages', 'POST', { receiverId, subject, messageText }, true), // Requires auth token
    getMessages: () => fetchApi('/api/messages', 'GET', null, true), // Requires auth token
    getMessageById: (id) => fetchApi(`/api/messages/${id}`, 'GET', null, true), // Requires auth token
    markMessageAsRead: (id) => fetchApi(`/api/messages/${id}/read`, 'PATCH', null, true), // Requires auth token
    deleteMessage: (id) => fetchApi(`/api/messages/${id}`, 'DELETE', null, true), // Requires auth token
};

// Stripe Payment Intent API
export const paymentApi = {
    createPaymentIntent: (amount, orderId) => fetchApi('/api/create-payment-intent', 'POST', { amount, orderId }, true),
};
