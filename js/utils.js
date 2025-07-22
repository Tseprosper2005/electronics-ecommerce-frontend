// frontend/js/utils.js

// DOM Elements for message box
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const closeMessageBox = document.getElementById('closeMessageBox');

// Exchange Rates and Currency Symbols (mock data for now)
const exchangeRates = {
    'USD': 1.00,
    'EUR': 0.92, // 1 USD = 0.92 EUR (approx)
    'XAF': 610.00, // 1 USD = 610 XAF (approx)
    'XOF': 610.00, // 1 USD = 610 XOF (approx)
    'NGN': 1500.00 // 1 USD = 1500 NGN (approx)
};

const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'XAF': 'FCFA',
    'XOF': 'CFA',
    'NGN': '₦'
};

// Global state for current currency
export let currentCurrency = 'USD';

// Function to show custom message box
export function showMessage(message, type = 'info') {
    messageText.textContent = message;
    messageBox.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-[100] ${type === 'error' ? 'bg-red-600' : 'bg-blue-600'} text-white`;
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000); // Hide after 3 seconds
}

// Event listener for closing the message box
if (closeMessageBox) {
    closeMessageBox.addEventListener('click', () => {
        messageBox.classList.add('hidden');
    });
}

// Utility function to wrap labels for Chart.js
export function wrapLabel(label, maxChars) {
    const words = label.split(' ');
    let lines = [];
    let currentLine = '';
    words.forEach(word => {
        if ((currentLine + word).length <= maxChars) {
            currentLine += (currentLine === '' ? '' : ' ') + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    });
    lines.push(currentLine);
    return lines;
}

// Function to convert price to current currency
export function convertPrice(priceUSD) {
    const rate = exchangeRates[currentCurrency];
    const symbol = currencySymbols[currentCurrency];
    return `${symbol} ${(priceUSD * rate).toFixed(2)}`;
}

// Function to set the current currency
export function setCurrentCurrency(currency) {
    if (exchangeRates[currency]) {
        currentCurrency = currency;
        showMessage(`Currency set to ${currentCurrency}.`);
        return true;
    }
    showMessage(`Invalid currency: ${currency}.`, 'error');
    return false;
}
