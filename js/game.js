document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const shootButton = document.getElementById('shoot-btn');
    const powerBar = document.querySelector('.power-bar');
    const ball = document.querySelector('.ball');
    const shotResult = document.querySelector('.shot-result');
    const perfectText = document.querySelector('.perfect-text');
    
    // Stats elements
    const shotsMade = document.getElementById('shots-made');
    const totalShots = document.getElementById('total-shots');
    const shootingPercentage = document.getElementById('shooting-percentage');
    
    // Game state
    let powerLevel = 0;
    let isPowerIncreasing = false;
    let powerInterval;
    let stats = {
        made: 0,
        total: 0
    };
    
    // Load saved stats from localStorage if available
    loadStats();
    
    // Starting the shot (holding button down)
    shootButton.addEventListener('mousedown', startShooting);
    shootButton.addEventListener('touchstart', startShooting);
    
    // Releasing the shot (releasing button)
    shootButton.addEventListener('mouseup', releaseShooting);
    shootButton.addEventListener('touchend', releaseShooting);
    
    function startShooting(e) {
        e.preventDefault(); // Prevent default behavior for touch events
        
        // Reset for new shot
        resetShot();
        
        // Start increasing power
        isPowerIncreasing = true;
        powerInterval = setInterval(() => {
            if (isPowerIncreasing) {
                powerLevel += 2;
                if (powerLevel >= 100) {
                    powerLevel = 100;
                    isPowerIncreasing = false;
                }
                powerBar.style.width = `${powerLevel}%`;
            } else {
                powerLevel -= 2;
                if (powerLevel <= 0) {
                    powerLevel = 0;
                    isPowerIncreasing = true;
                }
                powerBar.style.width = `${powerLevel}%`;
            }
        }, 30);
    }
    
    function releaseShooting() {
        // Clear the power interval
        clearInterval(powerInterval);
        
        // Disable button during animation
        shootButton.disabled = true;
        
        // Process the shot
        processShot(powerLevel);
        
        // Enable button after animation
        setTimeout(() => {
            shootButton.disabled = false;
        }, 1500);
    }
    
    function processShot(power) {
        // Increment total shots
        stats.total++;
        updateStats();
        
        // Determine if shot is successful based on power level
        // Perfect shot is between 45-55% power
        const isPerfect = power >= 45 && power <= 55;
        // Good shot is between 40-60% power
        const isGood = power >= 40 && power <= 60;
        // Acceptable shot is between 30-70% power
        const isAcceptable = power >= 30 && power <= 70;
        
        // Success probability
        let successProbability;
        if (isPerfect) {
            successProbability = 0.95; // 95% chance of success for perfect shots
            perfectText.style.display = 'block';
            setTimeout(() => {
                perfectText.style.display = 'none';
            }, 1000);
        } else if (isGood) {
            successProbability = 0.8; // 80% chance for good shots
        } else if (isAcceptable) {
            successProbability = 0.6; // 60% chance for acceptable shots
        } else {
            successProbability = 0.2; // 20% chance for bad shots
        }
        
        // Determine if shot is made
        const isMade = Math.random() < successProbability;
        
        // Animate ball
        if (isMade) {
            // Shot is made
            stats.made++;
            updateStats();
            
            ball.style.animation = 'success 1s forwards';
            shotResult.textContent = 'SCORE!';
            shotResult.style.color = '#4CAF50';
        } else {
            // Shot is missed
            ball.style.animation = 'miss 1s forwards';
            shotResult.textContent = 'MISS!';
            shotResult.style.color = '#FF5722';
        }
        
        // Save stats to localStorage
        saveStats();
        
        // Reset animation after it completes
        setTimeout(resetBall, 1000);
    }
    
    function resetBall() {
        ball.style.animation = 'none';
        // Force reflow to reset animation
        void ball.offsetWidth;
    }
    
    function resetShot() {
        powerLevel = 0;
        powerBar.style.width = '0%';
        shotResult.textContent = '';
        perfectText.style.display = 'none';
    }
    
    function updateStats() {
        shotsMade.textContent = stats.made;
        totalShots.textContent = stats.total;
        
        // Calculate percentage with one decimal place
        const percentage = stats.total === 0 ? 0 : (stats.made / stats.total * 100).toFixed(1);
        shootingPercentage.textContent = `${percentage}%`;
    }
    
    function saveStats() {
        localStorage.setItem('freeThrowStats', JSON.stringify(stats));
    }
    
    function loadStats() {
        const savedStats = localStorage.getItem('freeThrowStats');
        if (savedStats) {
            stats = JSON.parse(savedStats);
            updateStats();
        }
    }
});