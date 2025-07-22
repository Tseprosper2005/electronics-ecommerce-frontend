// frontend/js/myOrders.js

import { orderApi } from './api.js';
import { showMessage, convertPrice } from './utils.js';

// DOM Elements
const myOrdersListBody = document.getElementById('my-orders-list');
const noOrdersMessage = document.getElementById('no-orders-message');
const orderDetailsModal = document.getElementById('orderDetailsModal');
const closeOrderDetailsModalBtn = document.getElementById('closeOrderDetailsModalBtn');

// Order Details Modal Elements
const modalOrderId = document.getElementById('modalOrderId');
const modalOrderDate = document.getElementById('modalOrderDate');
const modalOrderTotal = document.getElementById('modalOrderTotal');
const modalOrderStatus = document.getElementById('modalOrderStatus');
const modalOrderPaymentStatus = document.getElementById('modalOrderPaymentStatus');
const modalOrderShippingAddress = document.getElementById('modalOrderShippingAddress');
const modalOrderItems = document.getElementById('modalOrderItems');

// Function to fetch and render a user's orders
export async function fetchAndRenderMyOrders() {
    try {
        const orders = await orderApi.getOrders(); // This fetches orders for the current user
        myOrdersListBody.innerHTML = ''; // Clear existing orders

        if (orders.length === 0) {
            noOrdersMessage.classList.remove('hidden');
        } else {
            noOrdersMessage.classList.add('hidden');
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-200 hover:bg-gray-100';
                row.innerHTML = `
                    <td class="py-3 px-6 text-left whitespace-nowrap">${order.id}</td>
                    <td class="py-3 px-6 text-left">${new Date(order.order_date).toLocaleDateString()}</td>
                    <td class="py-3 px-6 text-left">${convertPrice(order.total_amount)}</td>
                    <td class="py-3 px-6 text-left capitalize">${order.status}</td>
                    <td class="py-3 px-6 text-center">
                        <button class="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-xs mr-2 view-my-order-details-btn" data-order-id="${order.id}">View Details</button>
                        ${order.status === 'cancelled' ? `<button class="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs delete-my-order-btn ml-2" data-order-id="${order.id}">Delete</button>` : ''}
                    </td>
                `;
                myOrdersListBody.appendChild(row);
            });
            attachMyOrderListeners();
        }
    } catch (error) {
        console.error('Failed to fetch and render my orders:', error);
        showMessage('Failed to load your orders. Please try again later.', 'error');
        noOrdersMessage.classList.remove('hidden'); // Ensure message is visible on error
        noOrdersMessage.textContent = 'Failed to load your orders.';
    }
}

// Attach event listeners for "View Details" and "Delete" buttons in My Orders list
function attachMyOrderListeners() {
    document.querySelectorAll('.view-my-order-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const orderId = parseInt(event.target.dataset.orderId);
            displayOrderDetails(orderId);
        });
    });

    document.querySelectorAll('.delete-my-order-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const orderId = parseInt(event.target.dataset.orderId);
            if (confirm(`Are you sure you want to delete order ID ${orderId}? This action cannot be undone.`)) {
                try {
                    await orderApi.deleteOrder(orderId); // Call the backend delete API
                    showMessage(`Order ID ${orderId} deleted successfully.`);
                    fetchAndRenderMyOrders(); // Re-render user's order list
                    // Also refresh admin orders if admin is logged in (dynamic import)
                    import('./admin.js').then(({ renderAdminOrders }) => {
                        if (renderAdminOrders) renderAdminOrders();
                    });
                } catch (error) {
                    console.error('Failed to delete order:', error);
                    // showMessage is already called by api.js
                }
            }
        });
    });
}

// Display Order Details in a Modal
async function displayOrderDetails(orderId) {
    try {
        const order = await orderApi.getOrderDetails(orderId);
        if (order) {
            modalOrderId.textContent = order.id;
            modalOrderDate.textContent = new Date(order.order_date).toLocaleString();
            modalOrderTotal.textContent = convertPrice(order.total_amount);
            modalOrderStatus.textContent = order.status;
            modalOrderPaymentStatus.textContent = order.payment_status;
            modalOrderShippingAddress.textContent = order.shipping_address;

            modalOrderItems.innerHTML = ''; // Clear previous items
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'flex items-center space-x-4 p-2 border-b border-gray-200 last:border-b-0';
                    itemDiv.innerHTML = `
                        <img src="${item.image_url}" onerror="this.onerror=null;this.src='https://placehold.co/60x60/cccccc/333333?text=No+Image';" alt="${item.name}" class="w-16 h-16 object-cover rounded-md">
                        <div>
                            <p class="font-semibold text-gray-800">${item.name}</p>
                            <p class="text-sm text-gray-600">Quantity: ${item.quantity}</p>
                            <p class="text-sm text-gray-600">Price at purchase: ${convertPrice(item.price_at_purchase)}</p>
                        </div>
                    `;
                    modalOrderItems.appendChild(itemDiv);
                });
            } else {
                modalOrderItems.innerHTML = '<p class="text-gray-500 text-center">No items found for this order.</p>';
            }

            orderDetailsModal.classList.remove('hidden');
        } else {
            showMessage('Order details not found.', 'error');
        }
    } catch (error) {
        console.error('Failed to fetch order details:', error);
        showMessage('Failed to load order details. Please try again later.', 'error');
    }
}

// Close Order Details Modal
if (closeOrderDetailsModalBtn) {
    closeOrderDetailsModalBtn.addEventListener('click', () => {
        orderDetailsModal.classList.add('hidden');
    });
}

if (orderDetailsModal) {
    orderDetailsModal.addEventListener('click', (event) => {
        if (event.target === orderDetailsModal) {
            orderDetailsModal.classList.add('hidden');
        }
    });
}
