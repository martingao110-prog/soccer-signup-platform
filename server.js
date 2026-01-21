const gameId = window.location.pathname.split('/')[2];
console.log('Game ID:', gameId);

const skillRatings = {
    speed: 3,
    passing: 3,
    shooting: 3,
    defending: 3
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    loadGameDetails();
    setupStarRatings();
    setupForm();
});

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
    
    if (game.current_players >= game.max_players) {
        if (gameFullDiv) gameFullDiv.style.display = 'block';
        return;
    }
    
    gameInfoDiv.style.display = 'block';
    
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
        return dateString;
    }
}

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
        
        updateStarDisplay(stars, 3);
        skillRatings[skill] = 3;
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                skillRatings[skill] = value;
                updateStarDisplay(stars, value);
                console.log('Skill rating updated:', skill, value);
            });
            
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

function updateStarDisplay(stars, rating) {
    stars.forEach((star, index) => {
        star.classList.remove('active', 'hover');
        if (index < rating) {
            star.classList.add('active');
        }
    });
}

function updateStarHover(stars, rating) {
    stars.forEach((star, index) => {
        star.classList.remove('active', 'hover');
        if (index < rating) {
            star.classList.add('hover');
        }
    });
}

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
        
        submitButton.disabled = true;
        submitButton.textContent = '⚽ Signing Up...';
        
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

function showSuccess(message) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.innerHTML = `
            <div class="success-message">
                <h3>🎉 Success!</h3>
                <p>${message}</p>
                <p><strong>What's next?</strong></p>
                <ul style="text-align: left; margin-top: 10px;">
                    <li>You'll receive payment details</li>
                    <li>Mark your calendar for the game</li>
                    <li>Bring your soccer gear and water</li>
                    <li>Have fun and play fair! ⚽</li>
                </ul>
            </div>
        `;
        messageDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

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

console.log('🚀 Signup.js loaded successfully');
