Absolutely! Here's the complete JavaScript code for the signup functionality:

### Create public/signup.js
1. **Click "Add file" → "Create new file"**
2. **Filename:** `public/signup.js`
3. **Complete Content:**

```javascript
// Get game ID from URL
const gameId = window.location.pathname.split('/')[2];

// Skill ratings storage
const skillRatings = {
    speed: 3,
    passing: 3,
    shooting: 3,
    defending: 3
};

// DOM elements
const loadingDiv = document.getElementById('loading');
const gameInfoDiv = document.getElementById('game-info');
const gameFullDiv = document.getElementById('game-full');
const signupForm = document.getElementById('signup-form');
const messageDiv = document.getElementById('message');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadGameDetails();
    setupStarRatings();
    setupForm();
});

// Load game details from API
async function loadGameDetails() {
    try {
        const response = await fetch(`/api/games/${gameId}`);
        const data = await response.json();
        
        if (response.ok) {
            displayGameDetails(data);
        } else {
            showError('Game not found or no longer available');
        }
    } catch (error) {
        console.error('Error loading game:', error);
        showError('Unable to load game details. Please try again.');
    }
}

// Display game information
function displayGameDetails(game) {
    loadingDiv.style.display = 'none';
    
    // Check if game is full
    if (game.current_players >= game.max_players) {
        gameFullDiv.style.display = 'block';
        return;
    }
    
    // Show game info
    gameInfoDiv.style.display = 'block';
    
    // Populate game details
    document.getElementById('game-title').textContent = game.title;
    document.getElementById('game-date').textContent = formatDate(game.date);
    document.getElementById('game-time').textContent = game.time;
    document.getElementById('game-location').textContent = game.location;
    document.getElementById('game-cost').textContent = game.cost.toFixed(2);
    document.getElementById('current-players').textContent = game.current_players || 0;
    document.getElementById('max-players').textContent = game.max_players;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Setup star rating functionality
function setupStarRatings() {
    const starRatings = document.querySelectorAll('.star-rating');
    
    starRatings.forEach(rating => {
        const skill = rating.dataset.skill;
        const stars = rating.querySelectorAll('.star');
        
        // Set initial rating (3 stars)
        updateStarDisplay(stars, 3);
        skillRatings[skill] = 3;
        
        stars.forEach((star, index) => {
            // Click event
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                skillRatings[skill] = value;
                updateStarDisplay(stars, value);
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
        } else if (index < skillRatings[stars[0].closest('.star-rating').dataset.skill]) {
            star.classList.add('active');
        }
    });
}

// Setup form submission
function setupForm() {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = signupForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        // Disable button and show loading
        submitButton.disabled = true;
        submitButton.textContent = '⚽ Signing Up...';
        
        // Clear previous messages
        messageDiv.innerHTML = '';
        
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
        
        // Validate form
        if (!validateForm(formData)) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            return;
        }
        
        try {
            const response = await fetch(`/api/signup/${gameId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showSuccess(result.message);
                signupForm.style.display = 'none';
                
                // Update player count
                const currentPlayersSpan = document.getElementById('current-players');
                const currentCount = parseInt(currentPlayersSpan.textContent);
                currentPlayersSpan.textContent = currentCount + 1;
                
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

// Validate form data
function validateForm(data) {
    // Check required fields
    if (!data.name) {
        showError('Please enter your name');
        document.getElementById('name').focus();
        return false;
    }
    
    if (data.name.length < 2) {
        showError('Name must be at least 2 characters long');
        document.getElementById('name').focus();
        return false;
    }
    
    if (!data.position) {
        showError('Please select your preferred position');
        document.getElementById('position').focus();
        return false;
    }
    
    if (!data.age || data.age < 16 || data.age > 60) {
        showError('Please enter a valid age between 16 and 60');
        document.getElementById('age').focus();
        return false;
    }
    
    // Validate skill ratings
    const skills = ['speed', 'passing', 'shooting', 'defending'];
    for (let skill of skills) {
        if (!data[skill] || data[skill] < 1 || data[skill] > 5) {
            showError(`Please rate your ${skill} skills (1-5 stars)`);
            return false;
        }
    }
    
    return true;
}

// Show success message
function showSuccess(message) {
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

// Show error message
function showError(message) {
    messageDiv.innerHTML = `
        <div class="error-message">
            <h3>❌ Error</h3>
            <p>${message}</p>
        </div>
    `;
    messageDiv.scrollIntoView({ behavior: 'smooth' });
}

// Utility function to get skill rating summary
function getSkillSummary() {
    const total = skillRatings.speed + skillRatings.passing + skillRatings.shooting + skillRatings.defending;
    const average = (total / 4).toFixed(1);
    
    let level = 'Beginner';
    if (average >= 4) level = 'Advanced';
    else if (average >= 3) level = 'Intermediate';
    
    return { average, level };
}

// Add some visual feedback for form interactions
function addFormEnhancements() {
    // Add floating labels effect
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
    
    // Add real-time validation
    document.getElementById('name').addEventListener('input', function() {
        if (this.value.length >= 2) {
            this.style.borderColor = '#28a745';
        } else {
            this.style.borderColor = '#ddd';
        }
    });
    
    document.getElementById('age').addEventListener('input', function() {
        const age = parseInt(this.value);
        if (age >= 16 && age <= 60) {
            this.style.borderColor = '#28a745';
        } else {
            this.style.borderColor = '#dc3545';
        }
    });
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
document.querySelectorAll('.star').forEach(star => {
    star.setAttribute('tabindex', '0');
    star.setAttribute('role', 'button');
    star.setAttribute('aria-label', `Rate ${star.dataset.value} stars`);
});

// Add loading animation
function showLoadingAnimation() {
    const loadingDiv = document.getElementById('loading');
    let dots = 0;
    const baseText = '⚽ Loading game details';
    
    const interval = setInterval(() => {
        dots = (dots + 1) % 4;
        loadingDiv.textContent = baseText + '.'.repeat(dots);
    }, 500);
    
    // Clear interval when loading is done
    const observer = new MutationObserver(() => {
        if (loadingDiv.style.display === 'none') {
            clearInterval(interval);
            observer.disconnect();
        }
    });
    
    observer.observe(loadingDiv, { attributes: true });
}

// Start loading animation when page loads
if (document.getElementById('loading').style.display !== 'none') {
    showLoadingAnimation();
}

// Add smooth scroll to top after successful signup
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateForm,
        formatDate,
        getSkillSummary
    };
}
