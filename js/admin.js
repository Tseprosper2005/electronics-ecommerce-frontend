// frontend/js/admin.js

import { productApi, orderApi, userApi } from './api.js';
import { showMessage, convertPrice } from './utils.js';
import { allProducts, renderProducts, fetchAndRenderProducts } from './products.js'; // Import product functions
import { fetchAndRenderMyOrders } from './myOrders.js'; // Import for refreshing user orders

// DOM Elements for Admin Panel
const adminProductListBody = document.getElementById('admin-product-list');
const adminOrderListBody = document.getElementById('admin-order-list');
const adminUserListBody = document.getElementById('admin-user-list');
const productForm = document.getElementById('product-form');
const clearProductFormBtn = document.getElementById('clear-product-form');

// Admin Product Form Fields
const productIdInput = document.getElementById('product-id');
const productNameInput = document.getElementById('product-name');
const productCategoryInput = document.getElementById('product-category');
const productPriceInput = document.getElementById('product-price');
const productStockInput = document.getElementById('product-stock');
const productImageUrlInput = document.getElementById('product-image-url');
const productDescriptionInput = document.getElementById('product-description');

// Admin Tab Switching
document.querySelectorAll('.admin-tab-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active-tab'));
        event.target.classList.add('active-tab');

        document.querySelectorAll('.admin-panel .tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(event.target.dataset.tab).classList.add('active');

        // Re-render content when switching tabs
        if (event.target.dataset.tab === 'manage-products') {
            renderAdminProducts();
        } else if (event.target.dataset.tab === 'manage-orders') {
            renderAdminOrders();
        } else if (event.target.dataset.tab === 'manage-users') {
            renderAdminUsers();
        }
    });
});

// --- Admin Product Management ---

// Render Products in Admin Table
export async function renderAdminProducts() {
    try {
        const products = await productApi.getAllProducts(); // Fetch fresh data
        adminProductListBody.innerHTML = '';
        if (products.length === 0) {
            adminProductListBody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-gray-500">No products found.</td></tr>';
            return;
        }
        products.forEach(product => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
            row.innerHTML = `
                <td class="py-3 px-6 text-left whitespace-nowrap">${product.id}</td>
                <td class="py-3 px-6 text-left">${product.name}</td>
                <td class="py-3 px-6 text-left">${product.category}</td>
                <td class="py-3 px-6 text-left">$${product.price.toFixed(2)}</td>
                <td class="py-3 px-6 text-left">${product.stock_quantity}</td>
                <td class="py-3 px-6 text-center">
                    <button class="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md text-xs mr-2 edit-product-btn" data-product-id="${product.id}">Edit</button>
                    <button class="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs delete-product-btn" data-product-id="${product.id}">Delete</button>
                </td>
            `;
            adminProductListBody.appendChild(row);
        });
        attachAdminProductListeners();
    } catch (error) {
        console.error('Error rendering admin products:', error);
        showMessage('Failed to load products for admin panel.', 'error');
    }
}

// Attach listeners for Edit/Delete buttons in Admin Product Table
function attachAdminProductListeners() {
    document.querySelectorAll('.edit-product-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const productId = parseInt(event.target.dataset.productId);
            try {
                const product = await productApi.getProductById(productId);
                if (product) {
                    productIdInput.value = product.id;
                    productNameInput.value = product.name;
                    productCategoryInput.value = product.category;
                    productPriceInput.value = product.price;
                    productStockInput.value = product.stock_quantity;
                    productImageUrlInput.value = product.image_url;
                    productDescriptionInput.value = product.description;
                    showMessage(`Editing product: ${product.name}`);
                }
            } catch (error) {
                console.error('Failed to fetch product for editing:', error);
            }
        });
    });

    document.querySelectorAll('.delete-product-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const productId = parseInt(event.target.dataset.productId);
            if (confirm(`Are you sure you want to delete product ID ${productId}?`)) {
                try {
                    await productApi.deleteProduct(productId);
                    showMessage(`Product ID ${productId} deleted successfully.`);
                    fetchAndRenderProducts(); // Update public product list
                    renderAdminProducts(); // Update admin product list
                } catch (error) {
                    console.error('Failed to delete product:', error);
                    // showMessage is already called by api.js
                }
            }
        });
    });
}

// Handle Product Form Submission (Add/Edit)
if (productForm) {
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = productIdInput.value;
        const name = productNameInput.value;
        const category = productCategoryInput.value;
        const price = parseFloat(productPriceInput.value);
        const stock_quantity = parseInt(productStockInput.value);
        const image_url = productImageUrlInput.value;
        const description = productDescriptionInput.value;

        const productData = { name, description, price, category, stock_quantity, image_url };

        try {
            if (id) {
                // Edit existing product
                await productApi.updateProduct(id, productData);
                showMessage(`Product "${name}" updated successfully.`);
            } else {
                // Add new product
                await productApi.createProduct(productData);
                showMessage(`Product "${name}" added successfully.`);
            }
            productForm.reset();
            productIdInput.value = ''; // Clear hidden ID
            fetchAndRenderProducts(); // Update public product list
            renderAdminProducts(); // Update admin product list
        } catch (error) {
            console.error('Failed to save product:', error);
            // showMessage is already called by api.js
        }
    });
}

// Clear Product Form
if (clearProductFormBtn) {
    clearProductFormBtn.addEventListener('click', () => {
        productForm.reset();
        productIdInput.value = '';
        showMessage('Product form cleared.');
    });
}

// --- Admin Order Management ---

// Render Orders in Admin Table
export async function renderAdminOrders() {
    try {
        const orders = await orderApi.getOrders(); // Fetch fresh data
        adminOrderListBody.innerHTML = '';
        if (orders.length === 0) {
            adminOrderListBody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-gray-500">No orders found.</td></tr>';
            return;
        }
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
            row.innerHTML = `
                <td class="py-3 px-6 text-left whitespace-nowrap">${order.id}</td>
                <td class="py-3 px-6 text-left">${order.username || 'N/A'} (ID: ${order.user_id})</td>
                <td class="py-3 px-6 text-left">${convertPrice(order.total_amount)}</td>
                <td class="py-3 px-6 text-left">
                    <select class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 order-status-select" data-order-id="${order.id}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td class="py-3 px-6 text-left capitalize">${order.payment_status}</td>
                <td class="py-3 px-6 text-center">
                    <button class="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-xs mr-2 view-order-details-btn" data-order-id="${order.id}">View Details</button>
                    <button class="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs delete-order-btn" data-order-id="${order.id}">Delete</button>
                </td>
            `;
            adminOrderListBody.appendChild(row);
        });
        attachAdminOrderListeners();
    } catch (error) {
        console.error('Error rendering admin orders:', error);
        showMessage('Failed to load orders for admin panel.', 'error');
    }
}

// Attach listeners for Order Status Select and View/Delete Details buttons
function attachAdminOrderListeners() {
    document.querySelectorAll('.order-status-select').forEach(select => {
        select.addEventListener('change', async (event) => {
            const orderId = parseInt(event.target.dataset.orderId);
            const newStatus = event.target.value;
            try {
                await orderApi.updateOrderStatus(orderId, newStatus);
                showMessage(`Order ID ${orderId} status updated to "${newStatus}".`);
                renderAdminOrders(); // Re-render to show updated status
                fetchAndRenderMyOrders(); // Also refresh user's order list
            } catch (error) {
                console.error('Failed to update order status:', error);
                // showMessage is already called by api.js
            }
        });
    });

    document.querySelectorAll('.view-order-details-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const orderId = parseInt(event.target.dataset.orderId);
            try {
                const order = await orderApi.getOrderDetails(orderId);
                if (order) {
                    let details = `Order ID: ${order.id}\nUser: ${order.username || 'N/A'} (ID: ${order.user_id})\nTotal: ${convertPrice(order.total_amount)}\nStatus: ${order.status}\nPayment: ${order.payment_status}\nShipping: ${order.shipping_address}\nOrder Date: ${new Date(order.order_date).toLocaleString()}\n\nItems:\n`;
                    order.items.forEach(item => {
                        details += `- ${item.name} (x${item.quantity}) @ ${convertPrice(item.price_at_purchase)}\n`;
                    });
                    showMessage(details, 'info');
                }
            } catch (error) {
                console.error('Failed to fetch order details:', error);
                // showMessage is already called by api.js
            }
        });
    });

    document.querySelectorAll('.delete-order-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const orderId = parseInt(event.target.dataset.orderId);
            if (confirm(`Are you sure you want to delete order ID ${orderId}? This action cannot be undone.`)) {
                try {
                    await orderApi.deleteOrder(orderId); // Call the new deleteOrder API
                    showMessage(`Order ID ${orderId} deleted successfully.`);
                    renderAdminOrders(); // Re-render admin orders list
                    fetchAndRenderMyOrders(); // Also refresh user's order list
                } catch (error) {
                    console.error('Failed to delete order:', error);
                    // showMessage is already called by api.js
                }
            }
        });
    });
}

// --- Admin User Management ---

// Render Users in Admin Table
export async function renderAdminUsers() {
    try {
        const users = await userApi.getAllUsers(); // Fetch fresh data
        adminUserListBody.innerHTML = '';
        if (users.length === 0) {
            adminUserListBody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-gray-500">No users found.</td></tr>';
            return;
        }
        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
            row.innerHTML = `
                <td class="py-3 px-6 text-left whitespace-nowrap">${user.id}</td>
                <td class="py-3 px-6 text-left">${user.username}</td>
                <td class="py-3 px-6 text-left">${user.email}</td>
                <td class="py-3 px-6 text-left">${user.role}</td>
                <td class="py-3 px-6 text-center">
                    ${user.role !== 'admin' ? `<button class="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs delete-user-btn" data-user-id="${user.id}">Delete</button>` : '<span class="text-gray-400">N/A</span>'}
                </td>
            `;
            adminUserListBody.appendChild(row);
        });
        attachAdminUserListeners();
    } catch (error) {
        console.error('Error rendering admin users:', error);
        showMessage('Failed to load users for admin panel.', 'error');
    }
}

// Attach listeners for Delete User buttons
function attachAdminUserListeners() {
    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const userId = parseInt(event.target.dataset.userId);
            if (confirm(`Are you sure you want to delete user ID ${userId}? This cannot be undone.`)) {
                try {
                    await userApi.deleteUser(userId);
                    showMessage(`User ID ${userId} and associated data deleted successfully.`);
                    renderAdminUsers(); // Re-render user list
                    renderAdminOrders(); // Re-render orders in case user's orders were deleted
                    fetchAndRenderMyOrders(); // Also refresh user's order list
                } catch (error) {
                    console.error('Failed to delete user:', error);
                    // showMessage is already called by api.js
                }
            }
        });
    });
}
