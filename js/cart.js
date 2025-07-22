// frontend/js/cart.js

import { showMessage, convertPrice } from './utils.js';
import { currentUser } from './auth.js'; // Import currentUser from auth.js
import { orderApi } from './api.js'; // Import orderApi for checkout

// DOM Elements
const cartCountSpan = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalSpan = document.getElementById('cart-total');
const emptyCartMessage = document.getElementById('empty-cart-message');
const checkoutBtn = document.getElementById('checkout-btn');
const paymentModal = document.getElementById('paymentModal');
const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');
const payNowBtn = document.getElementById('payNowBtn');
const paymentMessage = document.getElementById('payment-message');
const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
const paymentDetailsForm = document.getElementById('payment-details-form');
const shippingAddressInput = document.getElementById('shippingAddress');

// Global state for the shopping cart
export let cart = [];

// Function to add a product to the cart
export function addToCart(productId) {
    if (!currentUser) {
        showMessage('Please login to add items to your cart.', 'error');
        return;
    }

    // Dynamic import for allProducts to avoid circular dependency
    import('./products.js').then(({ allProducts }) => {
        const product = allProducts.find(p => p.id === productId);
        if (!product) {
            showMessage('Product not found.', 'error');
            return;
        }
        if (product.stock_quantity <= 0) {
            showMessage('Product is out of stock.', 'error');
            return;
        }

        const existingCartItem = cart.find(item => item.productId === productId);
        if (existingCartItem) {
            if (existingCartItem.quantity < product.stock_quantity) {
                existingCartItem.quantity++;
                showMessage(`${product.name} quantity updated in cart.`);
            } else {
                showMessage(`Cannot add more ${product.name}. Max stock reached.`, 'error');
            }
        } else {
            cart.push({
                productId: productId,
                quantity: 1,
                productDetails: { ...product } // Store a copy of product details at time of adding
            });
            showMessage(`${product.name} added to cart.`);
        }
        renderCart();
    });
}

// Function to update the quantity of a product in the cart
export function updateCartItemQuantity(productId, newQuantity) {
    const itemIndex = cart.findIndex(item => item.productId === productId);
    if (itemIndex > -1) {
        // Dynamic import for allProducts to avoid circular dependency
        import('./products.js').then(({ allProducts }) => {
            const product = allProducts.find(p => p.id === productId);
            if (!product) {
                showMessage('Product not found.', 'error');
                return;
            }

            if (newQuantity > product.stock_quantity) {
                showMessage(`Cannot add more. Only ${product.stock_quantity} in stock.`, 'error');
                cart[itemIndex].quantity = product.stock_quantity; // Cap at max stock
            } else if (newQuantity <= 0) {
                cart.splice(itemIndex, 1); // Remove if quantity is 0 or less
                showMessage('Item removed from cart.');
            } else {
                cart[itemIndex].quantity = newQuantity;
            }
            renderCart();
        });
    }
}

// Function to remove a product from the cart
export function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    showMessage('Item removed from cart.');
    renderCart();
}

// Function to clear the entire cart
export function clearCart() {
    cart = [];
    renderCart();
    showMessage('Your cart has been cleared.');
}

// Function to calculate the total amount of items in the cart (in USD)
function calculateCartTotalUSD() {
    return cart.reduce((total, item) => total + (item.productDetails.price * item.quantity), 0);
}

// Render the cart items and total to the UI
export function renderCart() {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        emptyCartMessage.classList.remove('hidden');
        checkoutBtn.disabled = true;
    } else {
        emptyCartMessage.classList.add('hidden');
        checkoutBtn.disabled = false;
        cart.forEach(item => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0';
            cartItemDiv.innerHTML = `
                <div class="flex items-center flex-grow">
                    <img src="${item.productDetails.image_url}" onerror="this.onerror=null;this.src='https://placehold.co/80x80/cccccc/333333?text=No+Image';" alt="${item.productDetails.name}" class="w-20 h-20 object-cover rounded-md mr-4">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">${item.productDetails.name}</h4>
                        <p class="text-gray-600 text-sm">${convertPrice(item.productDetails.price)} each</p>
                    </div>
                </div>
                <div class="flex items-center">
                    <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded-l-md hover:bg-gray-300 quantity-btn" data-product-id="${item.productId}" data-action="decrease">-</button>
                    <span class="px-4 py-1 border-t border-b border-gray-200">${item.quantity}</span>
                    <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded-r-md hover:bg-gray-300 quantity-btn" data-product-id="${item.productId}" data-action="increase">+</button>
                    <button class="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md remove-from-cart-btn" data-product-id="${item.productId}">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });

        // Attach listeners for quantity and remove buttons
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = parseInt(event.target.dataset.productId);
                const action = event.target.dataset.action;
                const currentItem = cart.find(item => item.productId === productId);
                if (currentItem) {
                    let newQuantity = currentItem.quantity;
                    if (action === 'increase') {
                        newQuantity++;
                    } else {
                        newQuantity--;
                    }
                    updateCartItemQuantity(productId, newQuantity);
                }
            });
        });

        document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = parseInt(event.target.dataset.productId);
                removeFromCart(productId);
            });
        });
    }
    cartTotalSpan.textContent = convertPrice(calculateCartTotalUSD());
    cartCountSpan.textContent = cart.length;
}

// Event listener for checkout button
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showMessage('Your cart is empty. Please add items before checking out.', 'error');
            return;
        }
        if (!currentUser) {
            showMessage('Please login to proceed with checkout.', 'error');
            return;
        }
        paymentModal.classList.remove('hidden');
        shippingAddressInput.value = ''; // Clear previous address
        paymentMessage.textContent = ''; // Clear previous payment message
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => radio.checked = false);
        paymentDetailsForm.classList.add('hidden');
        payNowBtn.disabled = true;
    });
}

// Event listeners for payment modal
if (closePaymentModalBtn) {
    closePaymentModalBtn.addEventListener('click', () => {
        paymentModal.classList.add('hidden');
        paymentMessage.textContent = '';
        payNowBtn.disabled = true;
        paymentDetailsForm.classList.add('hidden');
    });
}

if (paymentModal) {
    paymentModal.addEventListener('click', (event) => {
        if (event.target === paymentModal) {
            paymentModal.classList.add('hidden');
            paymentMessage.textContent = '';
            payNowBtn.disabled = true;
            paymentDetailsForm.classList.add('hidden');
        }
    });
}

paymentMethodRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        payNowBtn.disabled = false;
        paymentMessage.textContent = '';
        if (radio.value === 'stripe') {
            paymentDetailsForm.classList.remove('hidden');
        } else {
            paymentDetailsForm.classList.add('hidden');
        }
    });
});

// Handle 'Pay Now' button click (mock payment and order creation)
if (payNowBtn) {
    payNowBtn.addEventListener('click', async () => {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
        const shippingAddress = shippingAddressInput.value.trim();

        if (!shippingAddress) {
            paymentMessage.textContent = 'Please enter a shipping address.';
            paymentMessage.className = 'text-center mt-4 text-sm text-red-600';
            return;
        }

        if (!selectedMethod) {
            paymentMessage.textContent = 'Please select a payment method.';
            paymentMessage.className = 'text-center mt-4 text-sm text-red-600';
            return;
        }

        paymentMessage.textContent = `Processing payment via ${selectedMethod.value}...`;
        paymentMessage.className = 'text-center mt-4 text-sm text-blue-600';
        payNowBtn.disabled = true;

        try {
            // Prepare order items for the API call (send product ID and quantity)
            const orderItems = cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }));

            const orderData = {
                shipping_address: shippingAddress,
                items: orderItems
            };

            // Call the backend API to create the order
            const response = await orderApi.createOrder(orderData);

            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock payment success/failure after backend order creation
            const isPaymentSuccess = Math.random() > 0.1; // 90% success rate for mock

            if (isPaymentSuccess) {
                paymentMessage.textContent = `Payment successful via ${selectedMethod.value}! Order placed.`;
                paymentMessage.className = 'text-center mt-4 text-sm text-green-600';

                // IMPORTANT: Only update payment status via API if the current user is an admin.
                // For regular users, this would typically be handled by a backend webhook from a real payment gateway.
                if (currentUser && currentUser.role === 'admin') {
                    await orderApi.updateOrderPaymentStatus(response.orderId, 'completed');
                } else {
                    // For non-admin users, we just show success message on frontend.
                    // The backend order's payment_status will remain 'pending' until an admin or webhook updates it.
                    console.log(`Order ${response.orderId} created. Payment status on backend remains 'pending' for non-admin user.`);
                }

                clearCart(); // Clear cart after successful order
                // Dynamic import for renderAdminOrders and fetchAndRenderMyOrders to avoid circular dependency
                import('./admin.js').then(({ renderAdminOrders }) => {
                    if (renderAdminOrders) renderAdminOrders();
                });
                import('./myOrders.js').then(({ fetchAndRenderMyOrders }) => {
                    if (fetchAndRenderMyOrders) fetchAndRenderMyOrders();
                });

                setTimeout(() => {
                    paymentModal.classList.add('hidden');
                    showMessage('Order placed successfully!', 'info');
                }, 1000);
            } else {
                paymentMessage.textContent = `Payment failed via ${selectedMethod.value}. Please try again.`;
                paymentMessage.className = 'text-center mt-4 text-sm text-red-600';
                payNowBtn.disabled = false; // Re-enable button for retry

                // If payment fails, update order payment status to 'failed' in backend (only if admin can do it directly)
                if (currentUser && currentUser.role === 'admin') {
                    await orderApi.updateOrderPaymentStatus(response.orderId, 'failed');
                }
            }

        } catch (error) {
            console.error('Order creation or payment processing failed:', error);
            paymentMessage.textContent = `Order failed: ${error.message || 'An unexpected error occurred.'}`;
            paymentMessage.className = 'text-center mt-4 text-sm text-red-600';
            payNowBtn.disabled = false; // Re-enable button
        }
    });
}
