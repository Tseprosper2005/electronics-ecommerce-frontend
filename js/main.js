// frontend/js/main.js

import { fetchAndRenderProducts, renderProducts } from './products.js';
import { renderCart } from './cart.js';
import { loginUser, registerUser, loadUserFromToken, currentUser, logoutUser } from './auth.js';
import { initializeCharts } from './charts.js';
import { showMessage, setCurrentCurrency, currentCurrency } from './utils.js';
import { renderAdminProducts, renderAdminOrders, renderAdminUsers } from './admin.js';
import { fetchAndRenderMyOrders } from './myOrders.js';
import { initializeMessagePortal, fetchAndRenderMessages, renderAdminMessages } from './messages.js'; // NEW: Import message functions

// DOM Elements
const authButton = document.getElementById('auth-button');
const adminNavLink = document.getElementById('admin-nav-link');
const salesTrendsNavLink = document.getElementById('sales-trends-nav-link');
const myOrdersNavLink = document.getElementById('my-orders-nav-link'); // NEW
const salesTrendsSection = document.getElementById('sales-trends');
const adminPanelSection = document.getElementById('admin-panel');
const myOrdersSection = document.getElementById('my-orders'); // NEW
const currencySelector = document.getElementById('currency-selector');
const authModal = document.getElementById('authModal');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authMessage = document.getElementById('auth-message');
const navLinks = document.querySelectorAll('.nav-link');

// NEW: Message Portal DOM Elements
const chatIcon = document.getElementById('chat-icon');
const messagePortalModal = document.getElementById('messagePortalModal');
const closeMessagePortalModalBtn = document.getElementById('closeMessagePortalModalBtn');


// --- Section Navigation Logic ---
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.remove('active');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        // Scroll to top of the section
        targetSection.scrollIntoView({ behavior: 'smooth' });

        // Trigger specific renders for sections that need it
        if (sectionId === 'products-overview') {
            fetchAndRenderProducts();
        } else if (sectionId === 'cart') {
            renderCart();
        } else if (sectionId === 'admin-panel') {
            // Ensure the default admin tab is active and its content rendered
            const defaultAdminTabBtn = document.querySelector('.admin-tab-btn[data-tab="manage-products"]');
            if (defaultAdminTabBtn) {
                defaultAdminTabBtn.click(); // Simulate click to activate tab and render content
            }
        } else if (sectionId === 'my-orders') { // NEW: Fetch and render my orders
            fetchAndRenderMyOrders();
        }
    } else {
        console.warn(`Section with ID '${sectionId}' not found.`);
    }
}

// Attach event listeners for main navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const sectionId = event.target.dataset.section;
        showSection(sectionId);
    });
});


// --- Authentication UI Update Logic ---
export function updateUIForAuth() {
    if (currentUser) {
        authButton.textContent = `Logout (${currentUser.username})`;
        myOrdersNavLink.classList.remove('hidden'); // Show My Orders for all logged-in users
        chatIcon.classList.remove('hidden'); // Show chat icon for all logged-in users

        if (currentUser.role === 'admin') {
            adminNavLink.classList.remove('hidden');
            salesTrendsNavLink.classList.remove('hidden');
        } else {
            adminNavLink.classList.add('hidden');
            salesTrendsNavLink.classList.add('hidden');
            // Ensure admin panel and sales trends are hidden if user is not admin
            adminPanelSection.classList.remove('active'); // Hide if active
            salesTrendsSection.classList.remove('active'); // Hide if active
        }
    } else {
        authButton.textContent = 'Login';
        adminNavLink.classList.add('hidden');
        salesTrendsNavLink.classList.add('hidden');
        myOrdersNavLink.classList.add('hidden'); // Hide My Orders when logged out
        chatIcon.classList.add('hidden'); // Hide chat icon when logged out
        adminPanelSection.classList.remove('active');
        salesTrendsSection.classList.remove('active');
        myOrdersSection.classList.remove('active'); // Hide My Orders section if active
    }
    // Re-render data that depends on user role/login status
    renderProducts(); // Prices might change if currency changes
    renderCart(); // Cart content depends on user
    // For admin panel, ensure correct data is shown if admin logs in/out
    if (currentUser && currentUser.role === 'admin') {
        renderAdminProducts();
        renderAdminOrders();
        renderAdminUsers();
        renderAdminMessages(); // NEW: Render admin messages
    } else {
        // Clear admin panel tables if not admin
        document.getElementById('admin-product-list').innerHTML = '';
        document.getElementById('admin-order-list').innerHTML = '';
        document.getElementById('admin-user-list').innerHTML = '';
        document.getElementById('admin-message-list').innerHTML = ''; // NEW: Clear admin messages
    }
    if (currentUser) { // Only fetch user-specific orders if logged in
        fetchAndRenderMyOrders();
        fetchAndRenderMessages(); // NEW: Fetch and render user messages
    } else {
        document.getElementById('my-orders-list').innerHTML = '<tr><td colspan="5" class="py-4 text-center text-gray-500" id="no-orders-message">You have no orders yet.</td></tr>';
        document.getElementById('message-list').innerHTML = '<p id="no-messages-message" class="text-center text-gray-500 py-8">No messages found.</p>'; // NEW: Clear user messages
    }
}

// Auth button click handler
authButton.addEventListener('click', async () => {
    if (currentUser) {
        logoutUser(); // Calls logoutUser from auth.js
    } else {
        authModal.classList.remove('hidden');
        authMessage.textContent = ''; // Clear previous messages
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        document.querySelector('.auth-tab-btn[data-tab="login-form"]').classList.add('active-tab');
        document.querySelector('.auth-tab-btn[data-tab="register-form"]').classList.remove('active-tab');
    }
});

// Close Auth Modal
if (closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener('click', () => {
        authModal.classList.add('hidden');
        loginForm.reset();
        registerForm.reset();
        authMessage.textContent = '';
    });
}

if (authModal) {
    authModal.addEventListener('click', (event) => {
        if (event.target === authModal) {
            authModal.classList.add('hidden');
            loginForm.reset();
            registerForm.reset();
            authMessage.textContent = '';
        }
    });
}

// Auth tab switching
document.querySelectorAll('.auth-tab-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active-tab'));
        event.target.classList.add('active-tab');

        document.querySelectorAll('#authModal .tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(event.target.dataset.tab).classList.add('active');
        authMessage.textContent = ''; // Clear message on tab switch
    });
});

// Login form submission
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const success = await loginUser(email, password);
    if (success) {
        authModal.classList.add('hidden');
        // updateUIForAuth is called by loginUser now
    } else {
        authMessage.textContent = 'Invalid email or password.';
        authMessage.className = 'text-center mt-4 text-sm text-red-600';
    }
});

// Register form submission
registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const success = await registerUser(username, email, password);
    if (success) {
        registerForm.reset();
        // Optionally switch to login tab
        document.querySelector('.auth-tab-btn[data-tab="login-form"]').click();
        // updateUIForAuth is called by registerUser now
    } else {
        authMessage.textContent = 'Registration failed. Please try again.';
        authMessage.className = 'text-center mt-4 text-sm text-red-600';
    }
});


// --- Currency Selector Logic ---
currencySelector.addEventListener('change', (event) => {
    setCurrentCurrency(event.target.value);
    renderProducts(); // Re-render products with new currency
    renderCart(); // Re-render cart with new currency
    // Note: Charts are mock, so they don't dynamically update currency in this version.
});


// --- NEW: Message Portal UI Logic ---

// Open message portal modal
if (chatIcon) {
    chatIcon.addEventListener('click', () => {
        if (currentUser) {
            messagePortalModal.classList.remove('hidden');
            initializeMessagePortal(); // Initialize tabs and fetch messages
        } else {
            showMessage('Please log in to access the message portal.', 'error');
        }
    });
}

// Close message portal modal
if (closeMessagePortalModalBtn) {
    closeMessagePortalModalBtn.addEventListener('click', () => {
        messagePortalModal.classList.add('hidden');
    });
}

if (messagePortalModal) {
    messagePortalModal.addEventListener('click', (event) => {
        if (event.target === messagePortalModal) {
            messagePortalModal.classList.add('hidden');
        }
    });
}


// Initial load logic
document.addEventListener('DOMContentLoaded', () => {
    loadUserFromToken(); // Try to load user from local storage
    updateUIForAuth(); // Update UI based on initial auth status
    showSection('home'); // Show home section by default
    initializeCharts(); // Initialize Chart.js charts
    // Initial fetch/render for products, cart, my orders, admin data happens in updateUIForAuth
});
