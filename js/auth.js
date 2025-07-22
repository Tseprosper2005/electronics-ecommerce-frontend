// frontend/js/auth.js

import { authApi, setToken, removeToken } from './api.js';
import { showMessage } from './utils.js';
// We will import updateUIForAuth from main.js, but it's a circular dependency.
// A common pattern is to pass it as a callback or use a global event system.
// For simplicity, we'll use a dynamic import or ensure main.js calls this.

// Global state for the current authenticated user
export let currentUser = null;

// Function to load user from local storage (if token exists)
export function loadUserFromToken() {
    const token = localStorage.getItem('jwtToken');
    if (token) {
        try {
            // In a real app, you'd decode the token on the client-side
            // or send it to the backend to validate and get user details.
            // For this mock, we'll assume the token implies a logged-in state
            // and we'll get user details from the backend on successful login/register.
            // We need to decode the token to get user info if we're just loading from storage
            const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload (base64)
            currentUser = {
                id: payload.userId,
                username: payload.username,
                role: payload.role
            };
            console.log("User loaded from token:", currentUser);
        } catch (error) {
            console.error("Error decoding token or loading user:", error);
            removeToken(); // Clear invalid token
            currentUser = null;
        }
    }
}

// Handle user login
export async function loginUser(email, password) {
    try {
        const response = await authApi.login(email, password);
        setToken(response.token);
        currentUser = response.user; // Set global currentUser state
        showMessage(`Welcome back, ${currentUser.username}!`, 'info');
        // Dynamically import updateUIForAuth to avoid circular dependency
        const { updateUIForAuth } = await import('./main.js');
        updateUIForAuth(); // Update UI elements based on login status and role
        return true;
    } catch (error) {
        console.error('Login failed:', error);
        // showMessage is already called by api.js
        return false;
    }
}

// Handle user registration
export async function registerUser(username, email, password) {
    try {
        const response = await authApi.register(username, email, password);
        showMessage(`Registration successful for ${response.username}! Please log in.`, 'info');
        return true;
    } catch (error) {
        console.error('Registration failed:', error);
        // showMessage is already called by api.js
        return false;
    }
}

// Handle user logout
export function logoutUser() {
    removeToken();
    currentUser = null; // Clear global currentUser state
    showMessage('You have been logged out.', 'info');
    // Dynamically import updateUIForAuth and clearCart to avoid circular dependency
    // The 'require' statement here was causing the error. We are removing it.
    import('./main.js').then(({ updateUIForAuth }) => {
        updateUIForAuth(); // Update UI elements
    });
    import('./cart.js').then(({ clearCart }) => {
        if (clearCart) clearCart(); // Also clear cart when logging out
    });
}
