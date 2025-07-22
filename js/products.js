// frontend/js/products.js

import { productApi } from './api.js';
import { showMessage, convertPrice, currentCurrency } from './utils.js';
import { addToCart } from './cart.js'; // Import addToCart from cart.js

// DOM Elements
const productListDiv = document.getElementById('product-list');
const productDetailModal = document.getElementById('productDetailModal');
const closeModalBtn = document.getElementById('closeModalBtn');

// Global state for products (will be fetched from API)
export let allProducts = [];

// Function to fetch and render products
export async function fetchAndRenderProducts() {
    try {
        const products = await productApi.getAllProducts();
        allProducts = products; // Store fetched products
        renderProducts();
    } catch (error) {
        console.error('Failed to fetch products:', error);
        showMessage('Failed to load products. Please try again later.', 'error');
    }
}

// Render Products to the UI
export function renderProducts() {
    productListDiv.innerHTML = ''; // Clear existing products
    if (allProducts.length === 0) {
        productListDiv.innerHTML = '<p class="text-center text-gray-500 text-lg col-span-full py-8">No products available at the moment.</p>';
        return;
    }

    allProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'bg-gray-100 rounded-lg shadow-md overflow-hidden transform transition-transform duration-200 hover:scale-105 cursor-pointer';
        productCard.innerHTML = `
            <img src="${product.image_url}" onerror="this.onerror=null;this.src='https://placehold.co/400x300/cccccc/333333?text=No+Image';" alt="${product.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-xl font-semibold text-gray-800 mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-2">${product.category}</p>
                <p class="text-lg font-bold text-blue-600">${convertPrice(product.price)}</p>
                <button class="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm w-full view-details-btn" data-product-id="${product.id}">View Details</button>
                <button class="mt-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm w-full add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
            </div>
        `;
        productListDiv.appendChild(productCard);
    });
    attachProductInteractionListeners();
}

// Attach event listeners for product cards (View Details, Add to Cart)
function attachProductInteractionListeners() {
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.target.dataset.productId);
            displayProductDetails(productId);
        });
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.target.dataset.productId);
            addToCart(productId); // Call addToCart from cart.js
        });
    });
}

// Display Product Details in Modal
function displayProductDetails(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        document.getElementById('modalProductName').textContent = product.name;
        document.getElementById('modalProductImage').src = product.image_url;
        document.getElementById('modalProductImage').alt = product.name;
        document.getElementById('modalProductDescription').textContent = product.description;
        document.getElementById('modalProductPrice').textContent = convertPrice(product.price);
        document.getElementById('modalProductStock').textContent = product.stock_quantity;
        document.getElementById('modalProductCategory').textContent = product.category;
        document.querySelector('#productDetailModal .add-to-cart-btn').dataset.productId = product.id;
        productDetailModal.classList.remove('hidden');
    } else {
        showMessage('Product details not found.', 'error');
    }
}

// Close Product Detail Modal
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        productDetailModal.classList.add('hidden');
    });
}

if (productDetailModal) {
    productDetailModal.addEventListener('click', (event) => {
        if (event.target === productDetailModal) {
            productDetailModal.classList.add('hidden');
        }
    });
}
