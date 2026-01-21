// Get game ID from URL
const gameId = window.location.pathname.split('/')[2];
console.log('Game ID:', gameId);

// Skill ratings storage
const skillRatings = {
    speed: 3,
    passing: 3,
    shooting: 3,
    defending: 3
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    loadGameDetails();
    setupStarRatings();
    setupForm();
});

// Load game details from API
async function loadGameDetails() {
    console.log('Loading game details for ID:', gameId);
    
    try {
        const response = await fetch(`/api/games/${gameId}`);
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Game data received:', data);
        
        displayGameDetails(data);
        
    } catch (error) {
        console.error('Error loading game:', error);
        document.getElementById('loading').innerHTML = `
            <h3>❌ Error Loading Game</h3>
            <p>Could not load game details. Please try again.</p>
            <p><small>Error: ${error.message}</small></p>
        `;
    }
}

// Display game information
function displayGameDetails(game) {
    console.log('Displaying game details:', game);
    
    const loadingDiv = document.getElementById('loading');
    const gameInfoDiv = document.getElementById('game-info');
    const gameFullDiv = document.getElementById('game-full');
    
    if (!loadingDiv || !gameInfoDiv) {
        console.error('Required elements not found in HTML');
        return;
    }
    
    loadingDiv.style.display = 'none';
    
    // Check if game is full
    if (game.current_players >= game.max_players) {
        if (gameFullDiv) gameFullDiv.style.display = 'block';
        return;
    }
    
    // Show game info
    gameInfoDiv.style.display = 'block';
    
    // Populate game details
    const elements = {
        'game-title': game.title,
        'game-date': formatDate(game.date),
        'game-time': game.time,
        'game-location': game.location,
        'game-cost': game.cost.toFixed(2),
        'current-players': game.current_players || 0,
        'max-players': game.max_players
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Element not found: ${id}`);
        }
    }
}

// Format date for display
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString; // Return original if formatting fails
    }
}

// Setup star rating functionality
function setupStarRatings() {
    console.log('Setting up star ratings...');
    
    const starRatings = document.querySelectorAll('.star-rating');
    
    starRatings.forEach(rating => {
        const skill = rating.dataset.skill;
        const stars = rating.querySelectorAll('.star');
        
        if (!skill || stars.length === 0) {
            console.warn('Star rating setup issue:', skill, stars.length);
            return;
        }
        
        // Set initial rating (3 stars)
        updateStarDisplay(stars, 3);
        skillRatings[skill] = 3;
        
        stars.forEach((star, index) => {
            // Click event
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                skillRatings[skill] = value;
                updateStarDisplay(stars, value);
                console.log('Skill rating updated:', skill, value);
            });
            
            // Hover effects
            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.dataset.value);
                updateStarHover(stars, value);
            });
            
            star.addEventListener('mouseleave', () => {
                updateStarDisplay(stars, skillRatings[skill]);
            });
        });
    });
}

// Update star display
function updateStarDisplay(stars, rating) {
    stars.forEach((star, index) => {
        star.classList.remove('active', 'hover');
        if (index < rating) {
            star.classList.add('active');
        }
    });
}

// Update star hover effect
function updateStarHover(stars, rating) {
    stars.forEach((star, index) => {
        star.classList.remove('active', 'hover');
        if (index < rating) {
            star.classList.add('hover');
        }
    });
}

// Setup form submission
function setupForm() {
    console.log('Setting up form...');
    
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) {
        console.error('Signup form not found');
        return;
    }
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        
        const submitButton = signupForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        // Disable button and show loading
        submitButton.disabled = true;
        submitButton.textContent = '⚽ Signing Up...';
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value.trim(),
            position: document.getElementById('position').value,
            age: parseInt(document.getElementById('age').value),
            speed: skillRatings.speed,
            passing: skillRatings.passing,
            shooting: skillRatings.shooting,
            defending: skillRatings.defending
        };
        
        console.log('Form data:', formData);
        
        try {
            const response = await fetch(`/api/signup/${gameId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            console.log('Signup response:', result);
            
            if (response.ok) {
                showSuccess(result.message);
                signupForm.style.display = 'none';
            } else {
                showError(result.error || 'Signup failed. Please try again.');
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
            
                } catch (error) {
            console.error('Signup error:', error);
            showError('Network error. Please check your connection and try again.');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

// Show success message
function showSuccess(message) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.innerHTML = `
            <div class="success-message">
                <h3>🎉 Success!</h3>
                <p>${message}</p>
                <p><strong>What's next?</strong></p>
                <ul style="text-align: left; margin-top: 10px;">
                    <li>You'll receive payment details via email/text</li>
                    <li>Mark your calendar for the game</li>
                    <li>Bring your soccer gear and water</li>
                    <li>Have fun and play fair! ⚽</li>
                </ul>
            </div>
        `;
        messageDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

// Show error message
function showError(message) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.innerHTML = `
            <div class="error-message">
                <h3>❌ Error</h3>
                <p>${message}</p>
            </div>
        `;
        messageDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

// Add form validation and enhancements
function addFormEnhancements() {
    // Add real-time validation
    const nameInput = document.getElementById('name');
    const ageInput = document.getElementById('age');
    
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            if (this.value.length >= 2) {
                this.style.borderColor = '#28a745';
            } else {
                this.style.borderColor = '#ddd';
            }
        });
    }
    
    if (ageInput) {
        ageInput.addEventListener('input', function() {
            const age = parseInt(this.value);
            if (age >= 16 && age <= 60) {
                this.style.borderColor = '#28a745';
            } else {
                this.style.borderColor = '#dc3545';
            }
        });
    }
}

// Initialize form enhancements when page loads
document.addEventListener('DOMContentLoaded', function() {
    addFormEnhancements();
});

// Add keyboard navigation for stars
document.addEventListener('keydown', function(e) {
    if (e.target.classList.contains('star')) {
        const starRating = e.target.closest('.star-rating');
        const stars = starRating.querySelectorAll('.star');
        const currentIndex = Array.from(stars).indexOf(e.target);
        
        let newIndex = currentIndex;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                newIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                newIndex = Math.min(stars.length - 1, currentIndex + 1);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                e.target.click();
                return;
        }
        
        if (newIndex !== currentIndex) {
            stars[newIndex].focus();
        }
    }
});

// Make stars focusable for accessibility
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.star').forEach((star, index) => {
        star.setAttribute('tabindex', '0');
        star.setAttribute('role', 'button');
        star.setAttribute('aria-label', `Rate ${star.dataset.value} stars`);
    });
});

// Debug function to check if all elements exist
function debugElements() {
    const requiredElements = [
        'loading', 'game-info', 'game-full', 'signup-form', 'message',
        'game-title', 'game-date', 'game-time', 'game-location', 
        'game-cost', 'current-players', 'max-players',
        'name', 'position', 'age'
    ];
    
    console.log('=== Element Debug Check ===');
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? '✅ Found' : '❌ Missing');
    });
    
    const starRatings = document.querySelectorAll('.star-rating');
    console.log(`Star ratings found: ${starRatings.length}`);
    
    starRatings.forEach((rating, index) => {
        const skill = rating.dataset.skill;
        const stars = rating.querySelectorAll('.star');
        console.log(`Star rating ${index + 1}: skill="${skill}", stars=${stars.length}`);
    });
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatDate,
        skillRatings,
        debugElements
    };
}

// Add debug info to console
console.log('🚀 Signup.js loaded successfully');
console.log('Game ID from URL:', gameId);

// Run debug check after page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        debugElements();
    }, 1000);
});
