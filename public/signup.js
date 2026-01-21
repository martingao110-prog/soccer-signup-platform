const gameId = window.location.pathname.split('/')[2];

const skillRatings = { speed: 3, passing: 3, shooting: 3, defending: 3 };

document.addEventListener('DOMContentLoaded', function() {
    loadGameDetails();
    setupStarRatings();
    setupForm();
});

async function loadGameDetails() {
    try {
        const response = await fetch('/api/games/' + gameId);
        const data = await response.json();
        
        if (response.ok) {
            displayGameDetails(data);
        } else {
            showError('Game not found');
        }
    } catch (error) {
        showError('Unable to load game details');
    }
}

function displayGameDetails(game) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('game-info').style.display = 'block';
    
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
    document.querySelectorAll('.star-rating').forEach(rating => {
        const skill = rating.dataset.skill;
        const stars = rating.querySelectorAll('.star');
        
        updateStarDisplay(stars, 3);
        skillRatings[skill] = 3;
        
        stars.forEach(star => {
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
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
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
            const response = await fetch('/api/signup/' + gameId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showSuccess(result.message);
                document.getElementById('signup-form').style.display = 'none';
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Network error occurred');
        }
    });
}

function showSuccess(message) {
    document.getElementById('message').innerHTML = 
        '<div class="success-message"><h3>🎉 Success!</h3><p>' + message + '</p></div>';
}

function showError(message) {
    document.getElementById('message').innerHTML = 
        '<div class="error-message"><h3>❌ Error</h3><p>' + message + '</p></div>';
}
