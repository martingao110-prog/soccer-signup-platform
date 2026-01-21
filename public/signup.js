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
        `;
    }
}

function displayGameDetails(game) {
    const loadingDiv = document.getElementById('loading');
    const gameInfoDiv = document.getElementById('game-info');
    
    loadingDiv.style.display = 'none';
    gameInfoDiv.style.display = 'block';
    
    document.getElementById('game-title').textContent = game.title;
    document.getElementById('game-date').textContent = formatDate(game.date);
    document.getElementById('game-time').textContent = game.time;
    document.getElementById('game-location').textContent = game.location;
    document.getElementById('game-cost').textContent = game.cost.toFixed(2);
    document.getElementById('current-players').textContent = game.current_players || 0;
    document.getElementById('max-players').textContent = game.max_players;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function setupStarRatings() {
    const starRatings = document.querySelectorAll('.star-rating');
    
    starRatings.forEach(rating => {
        const skill = rating.dataset.skill;
        const stars = rating.querySelectorAll('.star');
        
        updateStarDisplay(stars, 3);
        skillRatings[skill] = 3;
        
        stars.forEach((star) => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                skillRatings[skill] = value;
                updateStarDisplay(stars, value);
            });
        });
    });
}

function updateStarDisplay(stars, rating) {
    stars.forEach((star, index) => {
        star.classList.remove('active');
        if (index < rating) {
            star.classList.add('active');
        }
    });
}

function setupForm() {
    const signupForm = document.getElementById('signup-form');
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            position: document.getElementById('position').value,
            age: parseInt(document.getElementById('age').value),
            speed: skillRatings.speed,
            passing: skillRatings.passing,
            shooting: skillRatings.shooting,
            defending: skillRatings.defending
        };
        
        try {
            const response = await fetch(`/api/signup/${gameId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                document.getElementById('message').innerHTML = `
                    <div class="success-message">
                        <h3>🎉 Success!</h3>
                        <p>${result.message}</p>
                    </div>
                `;
                signupForm.style.display = 'none';
            } else {
                document.getElementById('message').innerHTML = `
                    <div class="error-message">
                        <h3>❌ Error</h3>
                        <p>${result.error}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Signup error:', error);
        }
    });
}

console.log('🚀 Signup.js loaded successfully');
