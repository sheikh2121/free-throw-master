document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const shootButton = document.getElementById('shoot-btn');
    const powerBar = document.querySelector('.power-bar');
    const targetZone = document.querySelector('.target-zone');
    const ball = document.querySelector('.ball');
    const shotResult = document.querySelector('.shot-result');
    const perfectText = document.querySelector('.perfect-text');
    
    // Shot type selectors
    const shotTypeBtns = document.querySelectorAll('.shot-type-btn');
    
    // Difficulty selectors
    const easyBtn = document.getElementById('easy-btn');
    const normalBtn = document.getElementById('normal-btn');
    const hardBtn = document.getElementById('hard-btn');
    
    // Stats elements
    const shotsMade = document.getElementById('shots-made');
    const totalShots = document.getElementById('total-shots');
    const pointsDisplay = document.getElementById('points');
    const shootingPercentage = document.getElementById('shooting-percentage');
    
    // Shot type definitions
    const shotTypes = {
        'free-throw': {
            pointValue: 1,
            perfectRange: { min: 45, max: 55 },
            goodRange: { min: 40, max: 60 },
            acceptableRange: { min: 30, max: 70 },
            targetZonePosition: { left: '25%', right: '25%' }
        },
        'three-point': {
            pointValue: 3,
            perfectRange: { min: 47, max: 53 }, // Narrower perfect range
            goodRange: { min: 43, max: 57 },    // Narrower good range
            acceptableRange: { min: 38, max: 62 }, // Narrower acceptable range
            targetZonePosition: { left: '35%', right: '35%' }
        },
        'layup': {
            pointValue: 2,
            perfectRange: { min: 60, max: 70 }, // Different perfect range
            goodRange: { min: 55, max: 75 },    // Different good range
            acceptableRange: { min: 50, max: 80 }, // Different acceptable range
            targetZonePosition: { left: '15%', right: '65%' } // Asymmetrical
        }
    };
    
    // Difficulty settings
    const difficultySettings = {
        'easy': {
            targetZoneMultiplier: 1.3, // 30% wider target zones
            successProbabilityBonus: 0.1 // +10% success probability
        },
        'normal': {
            targetZoneMultiplier: 1.0, // Default
            successProbabilityBonus: 0
        },
        'hard': {
            targetZoneMultiplier: 0.7, // 30% narrower target zones
            successProbabilityBonus: -0.1 // -10% success probability
        }
    };
    
    // Game state
    let powerLevel = 0;
    let isPowerIncreasing = false;
    let powerInterval;
    let currentShotType = 'free-throw';
    let difficulty = 'normal';
    let stats = {
        made: 0,
        total: 0,
        points: 0
    };
    
    // Load saved stats from localStorage if available
    loadStats();
    
    // Update target zone based on current shot type and difficulty
    updateTargetZone();
    
    // Starting the shot (holding button down)
    shootButton.addEventListener('mousedown', startShooting);
    shootButton.addEventListener('touchstart', startShooting);
    
    // Releasing the shot (releasing button)
    shootButton.addEventListener('mouseup', releaseShooting);
    shootButton.addEventListener('touchend', releaseShooting);
    
    // Shot type selection
    shotTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            shotTypeBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update current shot type
            currentShotType = btn.dataset.type;
            
            // Update target zone
            updateTargetZone();
        });
    });
    
    // Difficulty selection
    easyBtn.addEventListener('click', () => setDifficulty('easy'));
    normalBtn.addEventListener('click', () => setDifficulty('normal'));
    hardBtn.addEventListener('click', () => setDifficulty('hard'));
    
    function setDifficulty(level) {
        // Remove active class from all difficulty buttons
        easyBtn.classList.remove('active');
        normalBtn.classList.remove('active');
        hardBtn.classList.remove('active');
        
        // Set active class based on selected difficulty
        if (level === 'easy') easyBtn.classList.add('active');
        else if (level === 'normal') normalBtn.classList.add('active');
        else if (level === 'hard') hardBtn.classList.add('active');
        
        // Update current difficulty
        difficulty = level;
        
        // Update target zone to reflect difficulty
        updateTargetZone();
    }
    
    function updateTargetZone() {
        const shotTypeConfig = shotTypes[currentShotType];
        const difficultyConfig = difficultySettings[difficulty];
        
        // Calculate target zone width based on shot type and difficulty
        const leftPosition = shotTypeConfig.targetZonePosition.left;
        const rightPosition = shotTypeConfig.targetZonePosition.right;
        
        // Apply difficulty multiplier to target zone width
        // Convert percentage string to number, apply multiplier, convert back to string
        const leftPercentage = parseInt(leftPosition) / difficultyConfig.targetZoneMultiplier;
        const rightPercentage = parseInt(rightPosition) / difficultyConfig.targetZoneMultiplier;
        
        // Update target zone position
        targetZone.style.left = `${leftPercentage}%`;
        targetZone.style.right = `${rightPercentage}%`;
    }
    
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
        // Get the current shot type configuration
        const shotTypeConfig = shotTypes[currentShotType];
        const difficultyConfig = difficultySettings[difficulty];
        
        // Increment total shots
        stats.total++;
        updateStats();
        
        // Determine if shot is successful based on power level and shot type ranges
        const isPerfect = power >= shotTypeConfig.perfectRange.min && power <= shotTypeConfig.perfectRange.max;
        const isGood = power >= shotTypeConfig.goodRange.min && power <= shotTypeConfig.goodRange.max;
        const isAcceptable = power >= shotTypeConfig.acceptableRange.min && power <= shotTypeConfig.acceptableRange.max;
        
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
        
        // Apply difficulty modifier
        successProbability += difficultyConfig.successProbabilityBonus;
        
        // Ensure probability stays in range 0-1
        successProbability = Math.max(0, Math.min(1, successProbability));
        
        // Determine if shot is made
        const isMade = Math.random() < successProbability;
        
        // Animate ball
        if (isMade) {
            // Shot is made
            stats.made++;
            stats.points += shotTypeConfig.pointValue;
            updateStats();
            
            ball.style.animation = 'success 1s forwards';
            shotResult.textContent = `SCORE! +${shotTypeConfig.pointValue} points`;
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
        pointsDisplay.textContent = stats.points;
        
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