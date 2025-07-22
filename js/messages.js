// frontend/js/messages.js

import { messageApi } from './api.js';
import { showMessage } from './utils.js';
import { currentUser } from './auth.js'; // Import currentUser to check role

// DOM Elements for Message Portal
const messagePortalModal = document.getElementById('messagePortalModal');
const messageTabButtons = document.querySelectorAll('.message-tab-btn');
const inboxTabContent = document.getElementById('inbox');
const sendMessageTabContent = document.getElementById('send-message');
const messageListContainer = document.getElementById('message-list');
const noMessagesMessage = document.getElementById('no-messages-message');
const sendMessageForm = document.getElementById('send-message-form');
const messageSubjectInput = document.getElementById('message-subject');
const messageTextInput = document.getElementById('message-text');

// DOM Elements for Message Detail Modal
const messageDetailModal = document.getElementById('messageDetailModal');
const closeMessageDetailModalBtn = document.getElementById('closeMessageDetailModalBtn');
const detailMessageSender = document.getElementById('detailMessageSender');
const detailMessageReceiver = document.getElementById('detailMessageReceiver');
const detailMessageSubject = document.getElementById('detailMessageSubject');
const detailMessageSentAt = document.getElementById('detailMessageSentAt');
const detailMessageStatus = document.getElementById('detailMessageStatus');
const detailMessageText = document.getElementById('detailMessageText');
const adminReplySection = document.getElementById('admin-reply-section');
const adminReplyForm = document.getElementById('admin-reply-form');
const replyReceiverIdInput = document.getElementById('reply-receiver-id');
const replySubjectInput = document.getElementById('reply-subject');
const replyMessageTextInput = document.getElementById('reply-message-text');

// Admin Panel Message List
const adminMessageListBody = document.getElementById('admin-message-list');

// --- Message Portal Initialization & Tab Switching ---
export function initializeMessagePortal() {
    // Set default tab to Inbox and fetch messages
    const defaultTab = document.querySelector('.message-tab-btn[data-tab="inbox"]');
    if (defaultTab) {
        defaultTab.click(); // Simulate click to activate tab and render content
    }
}

// Attach event listeners for message tab switching
messageTabButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        // Remove active class from all tab buttons and content
        messageTabButtons.forEach(btn => btn.classList.remove('active-tab'));
        document.querySelectorAll('#messagePortalModal .tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to clicked button and corresponding content
        event.target.classList.add('active-tab');
        const targetTabId = event.target.dataset.tab;
        document.getElementById(targetTabId).classList.add('active');

        // Fetch messages when switching to inbox
        if (targetTabId === 'inbox') {
            fetchAndRenderMessages();
        }
        // Clear send message form when switching to it
        if (targetTabId === 'send-message') {
            sendMessageForm.reset();
        }
    });
});


// --- User Message Functions (Inbox and Sending) ---

// Fetch and render messages for the current user (or all for admin)
export async function fetchAndRenderMessages() {
    try {
        const messages = await messageApi.getMessages();
        messageListContainer.innerHTML = ''; // Clear existing messages

        if (messages.length === 0) {
            noMessagesMessage.classList.remove('hidden');
        } else {
            noMessagesMessage.classList.add('hidden');
            messages.forEach(msg => {
                const messageCard = document.createElement('div');
                messageCard.className = `p-4 rounded-lg shadow-md cursor-pointer transition-all duration-200 ${msg.is_read ? 'bg-gray-100 hover:bg-gray-200' : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'}`;
                messageCard.dataset.messageId = msg.id;

                const senderDisplay = msg.sender_id === currentUser.id ? 'You' : (msg.sender_username || 'Admin');
                const receiverDisplay = msg.receiver_id === currentUser.id ? 'You' : (msg.receiver_username || 'Admin'); // If receiver_id is null, it's a general message to admin

                messageCard.innerHTML = `
                    <p class="text-sm text-gray-500 mb-1">From: <span class="font-semibold">${senderDisplay}</span> | To: <span class="font-semibold">${receiverDisplay}</span> | ${new Date(msg.sent_at).toLocaleString()}</p>
                    <h4 class="text-lg font-semibold text-gray-800">${msg.subject || '(No Subject)'}</h4>
                    <p class="text-gray-700 truncate">${msg.message_text}</p>
                    <span class="text-xs font-medium ${msg.is_read ? 'text-gray-500' : 'text-blue-600'}">${msg.is_read ? 'Read' : 'Unread'}</span>
                `;
                messageListContainer.appendChild(messageCard);
            });
            attachMessageListeners();
        }
    } catch (error) {
        console.error('Failed to fetch messages:', error);
        showMessage('Failed to load messages. Please try again later.', 'error');
        noMessagesMessage.classList.remove('hidden');
        noMessagesMessage.textContent = 'Failed to load messages.';
    }
}

// Attach listeners for individual message cards
function attachMessageListeners() {
    document.querySelectorAll('#message-list .shadow-md').forEach(card => {
        card.addEventListener('click', (event) => {
            const messageId = parseInt(event.currentTarget.dataset.messageId);
            displayMessageDetails(messageId);
        });
    });
}

// Send Message Form Submission
if (sendMessageForm) {
    sendMessageForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const subject = messageSubjectInput.value.trim();
        const messageText = messageTextInput.value.trim();

        if (!messageText) {
            showMessage('Message cannot be empty.', 'error');
            return;
        }

        try {
            // For users, receiverId will be null (message to admin group).
            // For admin, receiverId must be specified in the detail modal's reply form.
            const receiverId = currentUser.role === 'user' ? null : replyReceiverIdInput.value; // This form is for user sending to admin
            await messageApi.sendMessage(receiverId, subject, messageText);
            showMessage('Message sent successfully!', 'success');
            sendMessageForm.reset();
            // Switch back to inbox and refresh
            document.querySelector('.message-tab-btn[data-tab="inbox"]').click();
        } catch (error) {
            console.error('Failed to send message:', error);
            showMessage(`Failed to send message: ${error.message || 'An error occurred.'}`, 'error');
        }
    });
}

// --- Message Detail Modal ---

// Display single message details
async function displayMessageDetails(messageId) {
    try {
        const message = await messageApi.getMessageById(messageId);
        if (message) {
            detailMessageSender.textContent = message.sender_username;
            detailMessageReceiver.textContent = message.receiver_username || 'Admin'; // If receiver is null, display 'Admin'
            detailMessageSubject.textContent = message.subject || '(No Subject)';
            detailMessageSentAt.textContent = new Date(message.sent_at).toLocaleString();
            detailMessageStatus.textContent = message.is_read ? 'Read' : 'Unread';
            detailMessageStatus.className = `font-semibold ${message.is_read ? 'text-gray-500' : 'text-blue-600'}`;
            detailMessageText.textContent = message.message_text;

            // Show/hide admin reply section
            if (currentUser && currentUser.role === 'admin' && message.sender_id !== currentUser.id) {
                adminReplySection.classList.remove('hidden');
                replyReceiverIdInput.value = message.sender_id; // Set the user to reply to
                replySubjectInput.value = `Re: ${message.subject || 'Your Inquiry'}`; // Pre-fill subject
            } else {
                adminReplySection.classList.add('hidden');
            }

            messageDetailModal.classList.remove('hidden');

            // Mark as read if it's an unread message for the current user (or admin viewing any message)
            if (!message.is_read && (message.receiver_id === currentUser.id || currentUser.role === 'admin')) {
                await messageApi.markMessageAsRead(messageId);
                // Re-render relevant lists to update read status
                fetchAndRenderMessages(); // For user's inbox
                renderAdminMessages(); // For admin's message list
            }
        } else {
            showMessage('Message details not found.', 'error');
        }
    } catch (error) {
        console.error('Failed to fetch message details:', error);
        showMessage('Failed to load message details. Please try again later.', 'error');
    }
}

// Close Message Detail Modal
if (closeMessageDetailModalBtn) {
    closeMessageDetailModalBtn.addEventListener('click', () => {
        messageDetailModal.classList.add('hidden');
        adminReplyForm.reset(); // Clear reply form
    });
}

if (messageDetailModal) {
    messageDetailModal.addEventListener('click', (event) => {
        if (event.target === messageDetailModal) {
            messageDetailModal.classList.add('hidden');
            adminReplyForm.reset(); // Clear reply form
        }
    });
}

// Admin Reply Form Submission
if (adminReplyForm) {
    adminReplyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const receiverId = parseInt(replyReceiverIdInput.value);
        const subject = replySubjectInput.value.trim();
        const messageText = replyMessageTextInput.value.trim();

        if (!messageText) {
            showMessage('Reply message cannot be empty.', 'error');
            return;
        }

        try {
            await messageApi.sendMessage(receiverId, subject, messageText);
            showMessage('Reply sent successfully!', 'success');
            adminReplyForm.reset();
            messageDetailModal.classList.add('hidden'); // Close detail modal
            renderAdminMessages(); // Refresh admin message list
            fetchAndRenderMessages(); // Refresh user's inbox (if admin is also a user)
        } catch (error) {
            console.error('Failed to send reply:', error);
            showMessage(`Failed to send reply: ${error.message || 'An error occurred.'}`, 'error');
        }
    });
}


// --- Admin Message Management Functions ---

// Render Messages in Admin Table
export async function renderAdminMessages() {
    if (!currentUser || currentUser.role !== 'admin') {
        // Only render if admin is logged in
        adminMessageListBody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-gray-500">Admin privileges required to view messages.</td></tr>';
        return;
    }

    try {
        const messages = await messageApi.getMessages(); // Admin gets all messages
        adminMessageListBody.innerHTML = '';
        if (messages.length === 0) {
            adminMessageListBody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-gray-500">No messages found.</td></tr>';
            return;
        }
        messages.forEach(msg => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-100';
            const senderDisplay = msg.sender_username || 'N/A';
            const receiverDisplay = msg.receiver_username || 'Admin'; // If receiver_id is null, it's a general message to admin

            row.innerHTML = `
                <td class="py-3 px-6 text-left whitespace-nowrap">${msg.id}</td>
                <td class="py-3 px-6 text-left">${senderDisplay} (ID: ${msg.sender_id})</td>
                <td class="py-3 px-6 text-left">${receiverDisplay} ${msg.receiver_id ? `(ID: ${msg.receiver_id})` : ''}</td>
                <td class="py-3 px-6 text-left">${msg.subject || '(No Subject)'}</td>
                <td class="py-3 px-6 text-left">
                    <span class="font-semibold ${msg.is_read ? 'text-gray-500' : 'text-blue-600'}">${msg.is_read ? 'Read' : 'Unread'}</span>
                </td>
                <td class="py-3 px-6 text-center">
                    <button class="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-xs mr-2 view-admin-message-btn" data-message-id="${msg.id}">View</button>
                    <button class="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs delete-admin-message-btn" data-message-id="${msg.id}">Delete</button>
                </td>
            `;
            adminMessageListBody.appendChild(row);
        });
        attachAdminMessageListeners();
    } catch (error) {
        console.error('Error rendering admin messages:', error);
        showMessage('Failed to load messages for admin panel.', 'error');
    }
}

// Attach listeners for Admin Message Table buttons
function attachAdminMessageListeners() {
    document.querySelectorAll('.view-admin-message-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const messageId = parseInt(event.target.dataset.messageId);
            displayMessageDetails(messageId); // Use the same detail modal
        });
    });

    document.querySelectorAll('.delete-admin-message-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const messageId = parseInt(event.target.dataset.messageId);
            if (confirm(`Are you sure you want to delete message ID ${messageId}? This cannot be undone.`)) {
                try {
                    await messageApi.deleteMessage(messageId);
                    showMessage(`Message ID ${messageId} deleted successfully.`);
                    renderAdminMessages(); // Re-render admin messages
                    fetchAndRenderMessages(); // Re-render user messages (if current user is the sender/receiver)
                } catch (error) {
                    console.error('Failed to delete message:', error);
                    showMessage(`Failed to delete message: ${error.message || 'An error occurred.'}`, 'error');
                }
            }
        });
    });
}
