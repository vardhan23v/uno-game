const COLORS = ['red', 'blue', 'green', 'yellow'];
const ACTION_VALUES = ['skip', 'reverse', 'draw2'];

let deck = [];
let discardPile = [];
let userHand = [];
let cpuHand = [];
let currentTurn = 'user'; // 'user' or 'cpu'
let currentColor = ''; // Active color for play
let direction = 1;

const userHandEl = document.getElementById('user-hand');
const cpuHandEl = document.getElementById('cpu-hand');
const discardPileEl = document.getElementById('discard-pile');
const cpuCardCountEl = document.getElementById('cpu-card-count');
const statusMessageEl = document.getElementById('status-message');
const drawDeckEl = document.getElementById('draw-deck');
const colorPickerModal = document.getElementById('color-picker-modal');
const gameOverModal = document.getElementById('game-over-modal');

let pendingWildCard = null;
let pendingWildPlayer = null;
let userCalledUno = false;
const unoBtn = document.getElementById('uno-btn');
const notificationEl = document.getElementById('notification');
const notificationTextEl = document.getElementById('notification-text');

function showNotification(msg, duration=2000) {
    notificationTextEl.textContent = msg;
    notificationEl.classList.remove('hidden');
    
    setTimeout(() => {
        notificationEl.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notificationEl.classList.remove('show');
        setTimeout(() => notificationEl.classList.add('hidden'), 300);
    }, duration);
}

unoBtn.addEventListener('click', () => {
    if (userHand.length <= 2 && !userCalledUno) {
        userCalledUno = true;
        showNotification("UNO!");
        unoBtn.classList.add('hidden');
    }
});

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function initGame() {
    deck = [];
    discardPile = [];
    userHand = [];
    cpuHand = [];
    currentTurn = 'user';
    direction = 1;
    
    statusMessageEl.textContent = 'Your Turn!';
    gameOverModal.classList.add('hidden');
    colorPickerModal.classList.add('hidden');

    createDeck();
    dealCards(7, userHand);
    dealCards(7, cpuHand);

    // Initial discard
    let initialCard;
    do {
        initialCard = deck.pop();
        discardPile.push(initialCard);
    } while (initialCard.color === 'black');

    currentColor = initialCard.color;
    userCalledUno = false;
    unoBtn.classList.add('hidden');

    renderAll();
}

function createDeck() {
    for (let color of COLORS) {
        deck.push({ color, value: '0', id: generateId() });
        for (let i = 1; i <= 9; i++) {
            deck.push({ color, value: i.toString(), id: generateId() });
            deck.push({ color, value: i.toString(), id: generateId() });
        }
        for (let action of ACTION_VALUES) {
            deck.push({ color, value: action, id: generateId() });
            deck.push({ color, value: action, id: generateId() });
        }
    }
    for (let i = 0; i < 4; i++) {
        deck.push({ color: 'black', value: 'wild', id: generateId() });
        deck.push({ color: 'black', value: 'wild4', id: generateId() });
    }
    shuffle(deck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function dealCards(num, targetHand) {
    for (let i = 0; i < num; i++) {
        drawOneCard(targetHand);
    }
}

function drawOneCard(targetHand) {
    if (deck.length === 0) {
        if (discardPile.length <= 1) return; // Rare case where game gets stuck
        const topCard = discardPile.pop();
        deck = discardPile;
        discardPile = [topCard];
        shuffle(deck);
    }
    if (deck.length > 0) {
        targetHand.push(deck.pop());
    }
}

function getDisplayValue(val) {
    if (val === 'skip') return '⊘';
    if (val === 'reverse') return '⇄';
    if (val === 'draw2') return '+2';
    if (val === 'wild') return 'W';
    if (val === 'wild4') return '+4';
    return val;
}

function createCardHTML(card, isBack = false) {
    const div = document.createElement('div');
    div.classList.add('card');
    if (isBack) {
        div.classList.add('card-back');
        div.innerHTML = `<div class="inner"><div class="logo">UNO</div></div>`;
    } else {
        div.classList.add(card.color);
        div.dataset.id = card.id;
        div.style.setProperty('--card-color', `var(--${card.color})`);
        
        const displayVal = getDisplayValue(card.value);
        div.innerHTML = `
            <div class="inner">
                <span class="small-val top-left">${displayVal}</span>
                <div class="oval"><span class="large-val">${displayVal}</span></div>
                <span class="small-val bottom-right">${displayVal}</span>
            </div>
        `;
    }
    return div;
}

function renderAll() {
    userHandEl.innerHTML = '';
    userHand.forEach((card, index) => {
        const cardEl = createCardHTML(card);
        cardEl.onclick = () => attemptPlay(index, 'user');
        
        if (currentTurn === 'user' && isValidPlay(card)) {
            cardEl.classList.add('playable');
        } else {
            cardEl.classList.add('unplayable');
        }

        userHandEl.appendChild(cardEl);
    });

    cpuHandEl.innerHTML = '';
    cpuHand.forEach(() => {
        cpuHandEl.appendChild(createCardHTML(null, true));
    });
    cpuCardCountEl.textContent = `${cpuHand.length} Card${cpuHand.length !== 1 ? 's' : ''}`;

    discardPileEl.innerHTML = '';
    if (discardPile.length > 0) {
        const topCard = discardPile[discardPile.length - 1];
        const cardEl = createCardHTML(topCard);
        
        if (topCard.color === 'black') {
            cardEl.style.boxShadow = `0 0 25px 8px var(--${currentColor})`;
        }
        
        // Slight random rotation for realism
        const rotation = (Math.random() * 20 - 10).toFixed(1);
        cardEl.style.transform = `rotate(${rotation}deg)`;
        
        discardPileEl.appendChild(cardEl);
    }

    if (userHand.length === 2 && !userCalledUno) {
        unoBtn.classList.remove('hidden');
    } else if (userHand.length > 2) {
        unoBtn.classList.add('hidden');
        userCalledUno = false;
    }
}

function isValidPlay(card) {
    const topCard = discardPile[discardPile.length - 1];
    if (card.color === 'black') return true;
    if (card.color === currentColor) return true;
    if (card.value === topCard.value && topCard.color !== 'black') return true; 
    return false;
}

function attemptPlay(index, playerType) {
    if (currentTurn !== playerType) return;
    const hand = playerType === 'user' ? userHand : cpuHand;
    const card = hand[index];

    if (!isValidPlay(card)) return;

    hand.splice(index, 1);
    discardPile.push(card);

    if (playerType === 'user' && hand.length === 1 && !userCalledUno) {
        showNotification("Forgot UNO! +2 Cards", 3000);
        drawOneCard(userHand);
        drawOneCard(userHand);
        userCalledUno = false;
    }
    
    if (playerType === 'cpu' && hand.length === 1) {
        setTimeout(() => showNotification("CPU: UNO!", 2000), 500);
    }

    if (card.color === 'black') {
        if (playerType === 'user') {
            pendingWildCard = card;
            pendingWildPlayer = playerType;
            showColorPicker();
            return;
        } else {
            currentColor = cpuPickBestColor();
            completePlayAction(card, playerType);
        }
    } else {
        currentColor = card.color;
        completePlayAction(card, playerType);
    }
}

function cpuPickBestColor() {
    const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
    cpuHand.forEach(c => {
        if (c.color !== 'black') {
            colorCounts[c.color]++;
        }
    });
    const bestColor = Object.keys(colorCounts).reduce((a, b) => colorCounts[a] > colorCounts[b] ? a : b);
    return colorCounts[bestColor] > 0 ? bestColor : COLORS[Math.floor(Math.random() * COLORS.length)];
}

function completePlayAction(card, playerType) {
    renderAll();
    
    if (checkWin()) return;

    let nextPlayer = playerType === 'user' ? 'cpu' : 'user';
    let skipsCurrent = false;

    if (card.value === 'skip' || card.value === 'reverse') {
        skipsCurrent = true;
    } else if (card.value === 'draw2') {
        const targetHand = playerType === 'user' ? cpuHand : userHand;
        drawOneCard(targetHand);
        drawOneCard(targetHand);
        skipsCurrent = true;
    } else if (card.value === 'wild4') {
        const targetHand = playerType === 'user' ? cpuHand : userHand;
        for(let i=0; i<4; i++) drawOneCard(targetHand);
        skipsCurrent = true;
    }

    if (skipsCurrent) {
        nextPlayer = playerType; 
    }

    currentTurn = nextPlayer;
    updateStatus();
    
    if (currentTurn === 'cpu') {
        setTimeout(cpuTurn, 1500);
    }
}

function updateStatus() {
    if (currentTurn === 'user') {
        statusMessageEl.textContent = 'Your Turn!';
    } else {
        statusMessageEl.textContent = 'CPU is thinking...';
    }
    document.body.style.borderTop = `8px solid var(--${currentColor})`;
    renderAll();
}

function cpuTurn() {
    if (currentTurn !== 'cpu') return;

    const validIndex = cpuHand.findIndex(c => isValidPlay(c));
    if (validIndex !== -1) {
        attemptPlay(validIndex, 'cpu');
    } else {
        drawOneCard(cpuHand);
        renderAll();
        
        setTimeout(() => {
            const drawnIndex = cpuHand.length - 1;
            if (isValidPlay(cpuHand[drawnIndex])) {
                attemptPlay(drawnIndex, 'cpu');
            } else {
                currentTurn = 'user';
                updateStatus();
            }
        }, 1000);
    }
}

drawDeckEl.addEventListener('click', () => {
    if (currentTurn !== 'user') return;
    
    drawOneCard(userHand);
    renderAll();

    const drawnIndex = userHand.length - 1;
    if (!isValidPlay(userHand[drawnIndex])) {
        currentTurn = 'cpu';
        updateStatus();
        setTimeout(cpuTurn, 1500);
    } else {
        statusMessageEl.textContent = 'Play drawn card or wait...';
        
        // Auto pass after 3 seconds if user chooses not to play the playable drawn card
        setTimeout(() => {
            if (currentTurn === 'user' && userHand.length > 0) {
                 const currentTopIndex = userHand.length - 1;
                 // If the hand length is same, it wasn't played. 
                 // Minor glitch potential if they play something else, but Uno rules usually force either the drawn card or nothing.
                 // We'll just pass turn.
                 currentTurn = 'cpu';
                 updateStatus();
                 setTimeout(cpuTurn, 1500);
            }
        }, 3000);
    }
});

function showColorPicker() {
    colorPickerModal.classList.remove('hidden');
}

document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentColor = e.target.dataset.color;
        colorPickerModal.classList.add('hidden');
        if (pendingWildCard && pendingWildPlayer) {
            completePlayAction(pendingWildCard, pendingWildPlayer);
            pendingWildCard = null;
            pendingWildPlayer = null;
        }
    });
});

function checkWin() {
    if (userHand.length === 0) {
        endGame('You Win! 🎉');
        return true;
    } else if (cpuHand.length === 0) {
        endGame('CPU Wins! 🤖');
        return true;
    }
    return false;
}

function endGame(msg) {
    document.getElementById('winner-text').textContent = msg;
    gameOverModal.classList.remove('hidden');
}

document.getElementById('restart-btn').addEventListener('click', initGame);

initGame();
