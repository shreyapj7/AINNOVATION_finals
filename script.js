// script.js - all JS from the original file, cleaned up and with persistence + small bug fixes

// Global variables
let currentUser = null;
let userType = null;
let foodDonations = [];
let acceptedDonations = [];
let globalStats = {
    totalDonations: 0,
    peopleFed: 0,
    activeListings: 0
};

// --- Persistence (localStorage) ---
function saveState() {
    localStorage.setItem('foodDonations', JSON.stringify(foodDonations));
    localStorage.setItem('acceptedDonations', JSON.stringify(acceptedDonations));
    localStorage.setItem('globalStats', JSON.stringify(globalStats));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('userType', userType || '');
}

function loadState() {
    try {
        foodDonations = JSON.parse(localStorage.getItem('foodDonations')) || [];
        acceptedDonations = JSON.parse(localStorage.getItem('acceptedDonations')) || [];
        globalStats = JSON.parse(localStorage.getItem('globalStats')) || globalStats;
        currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        userType = localStorage.getItem('userType') || null;
    } catch (e) {
        console.error('Failed to load state', e);
        foodDonations = [];
        acceptedDonations = [];
        currentUser = null;
        userType = null;
    }
}

// Utility Functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.getElementById('notificationContainer').appendChild(notification);
    
    // small delay so CSS transition applies
    setTimeout(() => notification.classList.add('show'), 100);

    // show for 3 seconds then hide
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

function updateHomepageStats() {
    document.getElementById('homepagePeopleFed').textContent = globalStats.peopleFed;
    document.getElementById('homepageActiveListings').textContent = globalStats.activeListings;
}

// Authentication Functions
function handleAuth(type, action, formData) {
    if (action === 'signup') {
        // Simulate user registration (client-side demo)
        const userData = {
            email: formData.email,
            phone: formData.phone || null,
            location: formData.location || null,
            type: type
        };
        
        currentUser = userData;
        userType = type;
        
        saveState();
        showNotification('Account created successfully!');
        
        if (type === 'producer') {
            updateProducerWelcome();
            showPage('producerDashboard');
        } else {
            updateConsumerWelcome();
            showPage('consumerDashboard');
            loadAvailableFoodDonations();
            loadAcceptedDonations();
        }
    } else {
        // Simulate user login
        const userData = {
            email: formData.email,
            type: type
        };
        
        currentUser = userData;
        userType = type;
        saveState();

        showNotification('Logged in successfully!');
        
        if (type === 'producer') {
            updateProducerWelcome();
            showPage('producerDashboard');
            renderProducerFoodListings();
        } else {
            updateConsumerWelcome();
            showPage('consumerDashboard');
            loadAvailableFoodDonations();
            loadAcceptedDonations();
        }
    }
}

function updateProducerWelcome() {
    document.getElementById('producerWelcome').textContent = `Welcome, ${currentUser.email}`;
}

function updateConsumerWelcome() {
    document.getElementById('consumerWelcome').textContent = `Welcome, ${currentUser.email}`;
}

// Food Management Functions
function addFoodDonation(foodData) {
    const donation = {
        id: Date.now(),
        name: foodData.name,
        type: foodData.type,
        quantity: foodData.quantity,
        hoursAgo: foodData.hoursAgo || null,
        producer: currentUser.email,
        producerLocation: currentUser.location || 'Location not set',
        producerPhone: currentUser.phone || 'Phone not set',
        status: 'available',
        originalQuantity: foodData.quantity,
        claimed: 0,
        delivered: 0,
        createdAt: new Date().toISOString()
    };
    
    foodDonations.push(donation);
    globalStats.totalDonations++;
    globalStats.activeListings++;
    saveState();
    updateHomepageStats();
    renderProducerFoodListings();
    loadAvailableFoodDonations();
    
    showNotification('Food donation added successfully!');
}

function renderProducerFoodListings() {
    const container = document.getElementById('foodListings');
    if (!currentUser) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Sign in to see your donations.</p>';
        return;
    }
    const userDonations = foodDonations.filter(donation => donation.producer === currentUser.email);
    
    if (userDonations.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No food donations yet. Add your first donation above!</p>';
        return;
    }
    
    container.innerHTML = userDonations.map(donation => `
        <div class="border rounded-lg p-6 bg-gray-50">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800">${donation.name}</h3>
                    <p class="text-gray-600">${donation.type.charAt(0).toUpperCase() + donation.type.slice(1)}</p>
                </div>
                <div class="text-right">
                    <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        donation.status === 'available' ? 'bg-green-100 text-green-800' :
                        donation.status === 'partially-claimed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }">
                        ${donation.status.replace('-', ' ').toUpperCase()}
                    </span>
                </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <span class="font-semibold text-gray-700">Original:</span>
                    <p class="text-gray-600">${donation.originalQuantity} people</p>
                </div>
                <div>
                    <span class="font-semibold text-gray-700">Available:</span>
                    <p class="text-gray-600">${donation.quantity} people</p>
                </div>
                <div>
                    <span class="font-semibold text-gray-700">Claimed:</span>
                    <p class="text-gray-600">${donation.claimed} people</p>
                </div>
                <div>
                    <span class="font-semibold text-gray-700">Delivered:</span>
                    <p class="text-gray-600">${donation.delivered} people</p>
                </div>
            </div>
            ${donation.hoursAgo ? `<p class="text-sm text-gray-500 mt-2">Prepared ${donation.hoursAgo} hours ago</p>` : ''}
            <p class="text-xs text-gray-400 mt-2">Added on ${new Date(donation.createdAt).toLocaleString()}</p>
        </div>
    `).join('');
}

function loadAvailableFoodDonations() {
    const container = document.getElementById('availableFoodListings');
    const availableDonations = foodDonations.filter(donation =>
        donation.quantity > 0 && donation.producer !== (currentUser?.email || '')
    );
    
    if (availableDonations.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No food donations available at the moment.</p>';
        return;
    }
    
    container.innerHTML = availableDonations.map(donation => `
        <div class="bg-white rounded-xl shadow-md p-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800">${donation.name}</h3>
                    <p class="text-gray-600">${donation.type.charAt(0).toUpperCase() + donation.type.slice(1)}</p>
                    <p class="text-sm text-gray-500">By: ${donation.producer}</p>
                </div>
                <div class="text-right">
                    <p class="text-lg font-semibold text-green-600">${donation.quantity} people</p>
                    ${donation.hoursAgo ? `<p class="text-sm text-gray-500">Prepared ${donation.hoursAgo}h ago</p>` : ''}
                </div>
            </div>
            
            <div class="flex items-center justify-between mt-4">
                <div class="flex items-center space-x-2">
                    <button onclick="adjustQuantity(${donation.id}, -1)" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition duration-300">-</button>
                    <input type="number" id="quantity_${donation.id}" value="1" min="1" max="${donation.quantity}" class="w-16 px-2 py-1 border rounded text-center">
                    <button onclick="adjustQuantity(${donation.id}, 1)" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition duration-300">+</button>
                </div>
                <button onclick="acceptDonation(${donation.id})" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-300">
                    Accept
                </button>
            </div>
        </div>
    `).join('');
}

function adjustQuantity(donationId, change) {
    const input = document.getElementById(`quantity_${donationId}`);
    const donation = foodDonations.find(d => d.id === donationId);
    if (!input || !donation) return;
    const currentValue = parseInt(input.value);
    const newValue = Math.max(1, Math.min(donation.quantity, currentValue + change));
    input.value = newValue;
}

function acceptDonation(donationId) {
    if (!currentUser || userType !== 'consumer') {
        showNotification('Please sign in as a consumer to accept donations.', 'error');
        return;
    }

    const donation = foodDonations.find(d => d.id === donationId);
    const quantityInput = document.getElementById(`quantity_${donationId}`);
    const requestedQuantity = parseInt(quantityInput?.value || '0');
    
    if (!donation || requestedQuantity <= 0 || requestedQuantity > donation.quantity) {
        showNotification('Invalid quantity requested!', 'error');
        return;
    }
    
    // Update the original donation
    donation.quantity -= requestedQuantity;
    donation.claimed += requestedQuantity;
    
    if (donation.quantity === 0) {
        donation.status = 'claimed';
        globalStats.activeListings--;
    } else {
        donation.status = 'partially-claimed';
    }
    
    // Create accepted donation record
    const acceptedDonation = {
        id: Date.now(),
        originalDonationId: donationId,
        name: donation.name,
        type: donation.type,
        quantity: requestedQuantity,
        producer: donation.producer,
        producerLocation: donation.producerLocation,
        producerPhone: donation.producerPhone,
        consumer: currentUser.email,
        status: 'accepted',
        acceptedAt: new Date().toISOString()
    };
    
    acceptedDonations.push(acceptedDonation);
    saveState();
    updateHomepageStats();
    showNotification(`Successfully accepted ${requestedQuantity} portions of ${donation.name}!`);
    loadAvailableFoodDonations();
    loadAcceptedDonations();
    
    // Update producer listings if the producer is logged in
    if (userType === 'producer' && donation.producer === currentUser.email) {
        renderProducerFoodListings();
    }
}

function loadAcceptedDonations() {
    const container = document.getElementById('myAcceptedDonations');
    if (!currentUser) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Sign in to see your accepted donations.</p>';
        return;
    }
    const userAcceptedDonations = acceptedDonations.filter(donation =>
        donation.consumer === currentUser.email
    );
    
    if (userAcceptedDonations.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No accepted donations yet.</p>';
        return;
    }
    
    container.innerHTML = userAcceptedDonations.map(donation => `
        <div class="border rounded-lg p-6 bg-green-50">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800">${donation.name}</h3>
                    <p class="text-gray-600">${donation.type.charAt(0).toUpperCase() + donation.type.slice(1)} • ${donation.quantity} people</p>
                    <p class="text-sm text-gray-500">Producer: ${donation.producer}</p>
                </div>
                <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    donation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    donation.status === 'picked-up' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                }">
                    ${donation.status.replace('-', ' ').toUpperCase()}
                </span>
            </div>
            
            <div class="mb-4">
                <h4 class="font-semibold text-gray-700 mb-2">Producer Contact:</h4>
                <p class="text-sm text-gray-600">📍 ${donation.producerLocation}</p>
                <p class="text-sm text-gray-600">📞 ${donation.producerPhone}</p>
            </div>
            
            ${donation.status === 'accepted' ? `
                <button onclick="markAsPickedUp(${donation.id})" class="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-300">
                    Mark as Picked Up
                </button>
            ` : `
                <p class="text-green-600 font-semibold">✅ Picked up on ${new Date(donation.pickedUpAt).toLocaleString()}</p>
            `}
        </div>
    `).join('');
}

function markAsPickedUp(acceptedDonationId) {
    const acceptedDonation = acceptedDonations.find(d => d.id === acceptedDonationId);
    if (!acceptedDonation) return;
    
    acceptedDonation.status = 'picked-up';
    acceptedDonation.pickedUpAt = new Date().toISOString();
    
    // Update the original donation's delivered count
    const originalDonation = foodDonations.find(d => d.id === acceptedDonation.originalDonationId);
    if (originalDonation) {
        originalDonation.delivered += acceptedDonation.quantity;
    }
    
    // Update global stats - only increment when food is actually picked up
    globalStats.peopleFed += acceptedDonation.quantity;
    saveState();
    updateHomepageStats();
    
    showNotification('Donation marked as picked up successfully!');
    loadAcceptedDonations();
    
    // Update producer dashboard if producer is logged in
    if (userType === 'producer' && originalDonation && originalDonation.producer === currentUser.email) {
        renderProducerFoodListings();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load persisted data
    loadState();
    updateHomepageStats();
    fetch('https://foodconnectsstorage.blob.core.windows.net/publicdata/data.json?sp=r&st=2025-09-23T21:39:00Z&se=2025-09-24T05:54:00Z&spr=https&sv=2024-11-04&sr=b&sig=e%2BE3mbQQAjyqQN%2BQj789d%2BojT%2BEwuJrc8GvYpNh4%2FjM%3D')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP error ${r.status}`);
      return r.json();
    })
    .then(data => {
      console.log('Azure blob data:', data);
      // update your UI here
      // e.g., document.getElementById('someElement').textContent = data.someField;
    })
    .catch(err => console.error('Fetch error:', err));
    // If user is already signed in (persisted), open relevant dashboard
    if (currentUser && userType) {
        if (userType === 'producer') {
            updateProducerWelcome();
            showPage('producerDashboard');
            renderProducerFoodListings();
        } else {
            updateConsumerWelcome();
            showPage('consumerDashboard');
            loadAvailableFoodDonations();
            loadAcceptedDonations();
        }
    } else {
        showPage('homepage');
    }

    // Navigation
    document.getElementById('donateBtn').addEventListener('click', () => {
        document.getElementById('donateModal').classList.remove('hidden');
    });
    
    document.getElementById('closeDonateModal').addEventListener('click', () => {
        document.getElementById('donateModal').classList.add('hidden');
    });
    
    document.getElementById('producerBtn').addEventListener('click', () => {
        showPage('producerAuth');
    });
    
    document.getElementById('consumerBtn').addEventListener('click', () => {
        showPage('consumerAuth');
    });
    
    document.getElementById('backToHomeFromProducer').addEventListener('click', () => {
        showPage('homepage');
    });
    
    document.getElementById('backToHomeFromConsumer').addEventListener('click', () => {
        showPage('homepage');
    });
    
    // Producer Auth Tabs
    document.getElementById('producerSignInTab').addEventListener('click', (e) => {
        e.target.classList.add('border-purple-600', 'text-purple-600');
        e.target.classList.remove('border-gray-200', 'text-gray-500');
        document.getElementById('producerSignUpTab').classList.add('border-gray-200', 'text-gray-500');
        document.getElementById('producerSignUpTab').classList.remove('border-purple-600', 'text-purple-600');
        document.getElementById('producerSignInForm').classList.remove('hidden');
        document.getElementById('producerSignUpForm').classList.add('hidden');
    });
    
    document.getElementById('producerSignUpTab').addEventListener('click', (e) => {
        e.target.classList.add('border-purple-600', 'text-purple-600');
        e.target.classList.remove('border-gray-200', 'text-gray-500');
        document.getElementById('producerSignInTab').classList.add('border-gray-200', 'text-gray-500');
        document.getElementById('producerSignInTab').classList.remove('border-purple-600', 'text-purple-600');
        document.getElementById('producerSignUpForm').classList.remove('hidden');
        document.getElementById('producerSignInForm').classList.add('hidden');
    });
    
    // Consumer Auth Tabs
    document.getElementById('consumerSignInTab').addEventListener('click', (e) => {
        e.target.classList.add('border-blue-600', 'text-blue-600');
        e.target.classList.remove('border-gray-200', 'text-gray-500');
        document.getElementById('consumerSignUpTab').classList.add('border-gray-200', 'text-gray-500');
        document.getElementById('consumerSignUpTab').classList.remove('border-blue-600', 'text-blue-600');
        document.getElementById('consumerSignInForm').classList.remove('hidden');
        document.getElementById('consumerSignUpForm').classList.add('hidden');
    });
    
    document.getElementById('consumerSignUpTab').addEventListener('click', (e) => {
        e.target.classList.add('border-blue-600', 'text-blue-600');
        e.target.classList.remove('border-gray-200', 'text-gray-500');
        document.getElementById('consumerSignInTab').classList.add('border-gray-200', 'text-gray-500');
        document.getElementById('consumerSignInTab').classList.remove('border-blue-600', 'text-blue-600');
        document.getElementById('consumerSignUpForm').classList.remove('hidden');
        document.getElementById('consumerSignInForm').classList.add('hidden');
    });
    
    // Auth Forms
    document.getElementById('producerSignInForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            email: document.getElementById('producerSignInEmail').value,
            password: document.getElementById('producerSignInPassword').value
        };
        handleAuth('producer', 'signin', formData);
    });
    
    document.getElementById('producerSignUpForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const location = document.getElementById('producerSignUpLocation').value;
        if (!location.trim()) {
            showNotification('Please enter your location!', 'error');
            return;
        }
        const formData = {
            email: document.getElementById('producerSignUpEmail').value,
            phone: document.getElementById('producerSignUpPhone').value,
            password: document.getElementById('producerSignUpPassword').value,
            location: location
        };
        handleAuth('producer', 'signup', formData);
    });
    
    document.getElementById('consumerSignInForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {
            email: document.getElementById('consumerSignInEmail').value,
            password: document.getElementById('consumerSignInPassword').value
        };
        handleAuth('consumer', 'signin', formData);
    });
    
    document.getElementById('consumerSignUpForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const location = document.getElementById('consumerSignUpLocation').value;
        if (!location.trim()) {
            showNotification('Please enter your location!', 'error');
            return;
        }
        const formData = {
            email: document.getElementById('consumerSignUpEmail').value,
            phone: document.getElementById('consumerSignUpPhone').value,
            password: document.getElementById('consumerSignUpPassword').value,
            location: location
        };
        handleAuth('consumer', 'signup', formData);
    });
    
    // Add Food Form
    document.getElementById('addFoodForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const hoursAgo = document.getElementById('hoursAgo').value;
        
        if (hoursAgo && parseInt(hoursAgo) >= 10) {
            showNotification('Food prepared 10 or more hours ago cannot be donated for safety reasons.', 'error');
            return;
        }
        
        const foodData = {
            name: document.getElementById('foodName').value,
            type: document.getElementById('foodType').value,
            quantity: parseInt(document.getElementById('foodQuantity').value),
            hoursAgo: hoursAgo ? parseInt(hoursAgo) : null
        };
        
        addFoodDonation(foodData);
        e.target.reset();
    });
    
    // Back to Home buttons
    document.getElementById('producerBackToHome').addEventListener('click', () => {
        currentUser = null;
        userType = null;
        saveState();
        showPage('homepage');
        showNotification('Returned to homepage!');
    });
    
    document.getElementById('consumerBackToHome').addEventListener('click', () => {
        currentUser = null;
        userType = null;
        saveState();
        showPage('homepage');
        showNotification('Returned to homepage!');
    });
    
    // Donation modal buttons
    document.querySelectorAll('#donateModal button').forEach(button => {
        if (button.id !== 'closeDonateModal') {
            button.addEventListener('click', () => {
                showNotification('Thank you for your support! This would redirect to UPI payment in a real app.', 'info');
                document.getElementById('donateModal').classList.add('hidden');
            });
        }
    });
});

async function getAzureAI(text) {
  // Replace these 3 placeholders with your Azure info
  const endpoint = "https://foodconnectai.openai.azure.com/openai/deployments/mygpt/chat/completions?api-version=2025-01-01-preview";
  const apiKey = "9FVvHVYovXegw5eJ86tEabm5PmNHKmAv8cbAcjXlMQ62pNkOlwpnJQQJ99BIAC77bzfXJ3w3AAABACOGoTCs"; // Copy from Azure Portal > Keys

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: text }],
      max_tokens: 100
    })
  });

  const data = await response.json();
  console.log("Azure AI response", data);
  return data.choices[0].message.content;
}

document.getElementById("aiButton").addEventListener("click", async () => {
  const input = document.getElementById("userInput").value;
  document.getElementById("aiOutput").innerText = "⏳ Thinking...";
  try {
    const suggestion = await getAzureAI(input);
    document.getElementById("aiOutput").innerText = suggestion;
  } catch (err) {
    console.error(err);
    document.getElementById("aiOutput").innerText = "❌ Error: check console";
  }
});
