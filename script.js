// --- Global Variables (Pengganti config.js) ---
const GAME_UNIT_SIZE = 32;
const CANVAS_WIDTH = 128;
const CANVAS_HEIGHT = 96; 

// --- DOM Elements (Pengganti inisialisasi di main.js) ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const healthDisplay = document.getElementById('health'); 

const container = document.querySelector('.container'); 
const shrinkBtn = document.getElementById('shrinkBtn'); 
const closeBtn = document.getElementById('closeBtn');   
const startGameOverlay = document.getElementById('startGameOverlay'); 
const startButton = document.getElementById('startButton');           

// --- Audio Assets ---
const collectSound = new Audio('sound/collect_sound.mp3'); 
const moveSound = new Audio('sound/move_sound.mp3');       
const sleepSound = new Audio('sound/sleep_sound.mp3');     
const backgroundMusic = new Audio('sound/background_sound.mp3'); 

// Sesuaikan volume jika terlalu keras (nilai antara 0.0 - 1.0)
collectSound.volume = 0.5;
moveSound.volume = 0.3;
sleepSound.volume = 0.6;
backgroundMusic.volume = 0.4; 
backgroundMusic.loop = true; 

// --- Assets (Pengganti assets.js) ---
const totoroActiveAnimationFrames = []; 
const totoroSleepAnimationFrames = []; 
const sootSpriteAnimationFrames = [];
const gameSprites = {}; 

function loadImage(name, src, isAnimationFrame = false, targetArray = null) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            if (isAnimationFrame && targetArray) {
                targetArray.push(img); 
            } else {
                gameSprites[name] = img; 
            }
            console.log(`[LOAD SUCCESS] Gambar '${name}' berhasil dimuat dari: ${src}`);
            resolve();
        };
        img.onerror = () => {
            console.error(`[LOAD ERROR] Gagal memuat gambar '${name}' dari: ${src}`);
            reject(new Error(`Gagal memuat gambar: ${src}`));
        };
        img.src = src; 
    });
}

// --- Player (Pengganti player.js) ---
const player = {
    x: 0, 
    y: 0, 
    width: 2,  
    height: 2, 
    speed: 1, 
    animationFrameIndex: 0, 
    animationTimer: 0,      
    animationDelay: 10,      
    isMoving: false, // Status untuk melacak apakah Totoro sedang bergerak
    idleTimer: 0,    // Timer untuk animasi idle/tidur
    idleDelay: 180,  // Delay sebelum masuk ke mode tidur (sekitar 3 detik pada 60fps)
    sleepAnimationFrameIndex: 0, 
    sleepAnimationTimer: 0,      
    sleepAnimationDelay: 15      
};

function updatePlayerAnimation() { 
    if (player.isMoving) {
        player.animationTimer++;
        if (player.animationTimer >= player.animationDelay) {
            player.animationTimer = 0;
            player.animationFrameIndex = (player.animationFrameIndex + 1) % totoroActiveAnimationFrames.length; 
        }
        player.idleTimer = 0; // Reset idle timer jika bergerak
        player.sleepAnimationFrameIndex = 0; // Reset animasi tidur saat kembali bergerak
        player.sleepAnimationTimer = 0;
    } else { 
        player.idleTimer++;
        if (player.idleTimer === player.idleDelay && totoroSleepAnimationFrames.length > 0) { 
            sleepSound.currentTime = 0; 
            sleepSound.play().catch(e => console.error("Gagal memutar suara tidur:", e)); 
        }
        if (player.idleTimer >= player.idleDelay) {
            if (totoroSleepAnimationFrames.length > 0) { 
                player.sleepAnimationTimer++;
                if (player.sleepAnimationTimer >= player.sleepAnimationDelay) {
                    player.sleepAnimationTimer = 0;
                    player.sleepAnimationFrameIndex = (player.sleepAnimationFrameIndex + 1) % totoroSleepAnimationFrames.length; 
                }
            }
        }
    }
}

// --- Soot Sprite (Pengganti sootSprite.js) ---
const sootSprite = {
    x: 0,
    y: 0,
    width: 0.5, 
    height: 0.5, 
    collected: false, 
    animationFrameIndex: 0, 
    animationTimer: 0,      
    animationDelay: 5       
};

function respawnSootSprite() {
    sootSprite.x = Math.floor(Math.random() * (CANVAS_WIDTH / GAME_UNIT_SIZE - sootSprite.width));
    sootSprite.y = Math.floor(Math.random() * (CANVAS_HEIGHT / GAME_UNIT_SIZE - sootSprite.height));
    sootSprite.collected = false; 
    sootSprite.animationFrameIndex = 0; 
    sootSprite.animationTimer = 0;
}

function updateSootSpriteAnimation() {
    if (!sootSprite.collected) { 
        sootSprite.animationTimer++;
        if (sootSprite.animationTimer >= sootSprite.animationDelay) {
            sootSprite.animationTimer = 0;
            sootSprite.animationFrameIndex = (sootSprite.animationFrameIndex + 1) % sootSpriteAnimationFrames.length;
        }
    }
}

// --- Input (Pengganti input.js) ---
const keysHeld = {}; // Objek untuk melacak tombol mana yang sedang ditekan

function setupInput() {
    document.addEventListener('keydown', (e) => {
        // Mencegah perilaku default browser untuk tombol arah dan spasi
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
            e.preventDefault();
        }

        // Catat tombol yang ditekan
        keysHeld[e.key] = true;

        let movedThisFrame = false;
        // Periksa apakah ada tombol gerak yang sedang ditekan
        if (keysHeld['ArrowUp'] || keysHeld['w'] ||
            keysHeld['ArrowDown'] || keysHeld['s'] ||
            keysHeld['ArrowLeft'] || keysHeld['a'] ||
            keysHeld['ArrowRight'] || keysHeld['d']) {
            movedThisFrame = true;
        }

        // Mainkan suara gerak hanya jika Totoro baru mulai bergerak
        if (movedThisFrame && !player.isMoving) { 
            moveSound.currentTime = 0; 
            moveSound.play().catch(err => console.error("Gagal memutar suara bergerak:", err));
        }
        player.isMoving = movedThisFrame; // Perbarui status bergerak Totoro

        // Pergerakan pemain berdasarkan tombol yang ditekan
        if (keysHeld['ArrowUp'] || keysHeld['w']) {
            player.y = Math.max(0, player.y - player.speed);
        }
        if (keysHeld['ArrowDown'] || keysHeld['s']) {
            player.y = Math.min(CANVAS_HEIGHT / GAME_UNIT_SIZE - player.height, player.y + player.speed);
        }
        if (keysHeld['ArrowLeft'] || keysHeld['a']) {
            player.x = Math.max(0, player.x - player.speed);
        }
        if (keysHeld['ArrowRight'] || keysHeld['d']) {
            player.x = Math.min(CANVAS_WIDTH / GAME_UNIT_SIZE - player.width, player.x + player.speed);
        }
    });

    document.addEventListener('keyup', (e) => {
        // Tandai tombol dilepas
        keysHeld[e.key] = false;

        let stillMoving = false;
        // Periksa apakah masih ada tombol gerak yang ditekan setelah keyup ini
        if (keysHeld['ArrowUp'] || keysHeld['w'] ||
            keysHeld['ArrowDown'] || keysHeld['s'] ||
            keysHeld['ArrowLeft'] || keysHeld['a'] ||
            keysHeld['ArrowRight'] || keysHeld['d']) {
            stillMoving = true;
        }
        player.isMoving = stillMoving; // Perbarui status bergerak Totoro
    });
}

// --- Game Logic (Pengganti game.js dan main.js) ---
const gameData = {
    score: 0
};

let gameLoopInterval = null; // Variabel untuk menyimpan referensi game loop

function gameLoop() {
    update(); 
    draw();   
    gameLoopInterval = requestAnimationFrame(gameLoop); 
}

function stopGameLoop() {
    if (gameLoopInterval) {
        cancelAnimationFrame(gameLoopInterval);
        gameLoopInterval = null;
        console.log("Game loop dihentikan.");
    }
}

function update() { 
    scoreDisplay.textContent = gameData.score; 

    updatePlayerAnimation(); 
    updateSootSpriteAnimation(); 

    if (!sootSprite.collected &&
        player.x < sootSprite.x + sootSprite.width &&
        player.x + player.width > sootSprite.x &&
        player.y < sootSprite.y + sootSprite.height &&
        player.y + player.height > sootSprite.y) {
        
        gameData.score += 10; 
        sootSprite.collected = true; 
        
        collectSound.currentTime = 0; 
        collectSound.play().catch(e => console.error("Gagal memutar suara koin:", e)); 
        
        respawnSootSprite(); 
    }
}

function draw() { 
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameSprites.gameBackgroundTile && gameSprites.gameBackgroundTile.complete) {
        const tileWidth = gameSprites.gameBackgroundTile.naturalWidth;
        const tileHeight = gameSprites.gameBackgroundTile.naturalHeight;

        if (tileWidth > 0 && tileHeight > 0) {
            for (let y = 0; y < canvas.height; y += tileHeight) {
                for (let x = 0; x < canvas.width; x += tileWidth) {
                    ctx.drawImage(gameSprites.gameBackgroundTile, x, y, tileWidth, tileHeight);
                }
            }
        } else {
            console.warn("Ukuran background tile nol atau tidak valid. Menggunakan warna solid.");
            ctx.fillStyle = '#2D3A2F'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else {
        ctx.fillStyle = '#2D3A2F'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    let currentTotoroFrame;
    if (player.idleTimer >= player.idleDelay && totoroSleepAnimationFrames.length > 0 && totoroSleepAnimationFrames[player.sleepAnimationFrameIndex].complete) {
        currentTotoroFrame = totoroSleepAnimationFrames[player.sleepAnimationFrameIndex];
    } else if (totoroActiveAnimationFrames.length > 0 && totoroActiveAnimationFrames[player.animationFrameIndex].complete) {
        currentTotoroFrame = totoroActiveAnimationFrames[player.animationFrameIndex];
    } 

    if (currentTotoroFrame) { 
        ctx.drawImage(
            currentTotoroFrame, 
            player.x * GAME_UNIT_SIZE, 
            player.y * GAME_UNIT_SIZE, 
            player.width * GAME_UNIT_SIZE, 
            player.height * GAME_UNIT_SIZE
        );
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x * GAME_UNIT_SIZE, player.y * GAME_UNIT_SIZE, player.width * GAME_UNIT_SIZE, player.height * GAME_UNIT_SIZE);
    }

    if (sootSpriteAnimationFrames.length > 0 && !sootSprite.collected && sootSpriteAnimationFrames[sootSprite.animationFrameIndex].complete) {
        ctx.drawImage(
            sootSpriteAnimationFrames[sootSprite.animationFrameIndex], 
            sootSprite.x * GAME_UNIT_SIZE, 
            sootSprite.y * GAME_UNIT_SIZE, 
            sootSprite.width * GAME_UNIT_SIZE, 
            sootSprite.height * GAME_UNIT_SIZE
        );
    } else if (!sootSprite.collected) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(sootSprite.x * GAME_UNIT_SIZE, sootSprite.y * GAME_UNIT_SIZE, sootSprite.width * GAME_UNIT_SIZE, sootSprite.height * GAME_UNIT_SIZE);
    }
}

// --- Game Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Fungsionalitas Tombol Shrink
    let isShrunk = false; 
    shrinkBtn.addEventListener('click', () => {
        isShrunk = !isShrunk; 

        if (isShrunk) {
            container.style.width = '100px'; 
            container.style.height = '50px';
            container.style.overflow = 'hidden'; 
            container.style.flexDirection = 'row'; 
            document.querySelector('.header').style.padding = '5px'; 
            container.style.alignItems = 'center'; 
            document.querySelector('.header h1').style.display = 'none'; 
            document.querySelector('.header .header-icon').style.display = 'none'; 
            document.querySelector('.header .window-controls').style.marginLeft = '0'; 

            document.querySelector('.game-container').style.display = 'none';
            document.querySelector('footer').style.display = 'none';
            document.querySelector('.window-controls').style.gap = '2px';
            stopGameLoop(); // Hentikan game loop saat menyusut
            backgroundMusic.pause(); // Jeda musik saat menyusut
        } else {
            container.style.width = '320px'; 
            container.style.height = 'auto'; 
            container.style.overflow = 'hidden'; 
            container.style.flexDirection = 'column'; 
            document.querySelector('.header').style.padding = '10px'; 
            container.style.alignItems = 'stretch'; 
            document.querySelector('.header h1').style.display = 'block'; 
            document.querySelector('.header .header-icon').style.display = 'block'; 
            document.querySelector('.header .window-controls').style.marginLeft = 'auto'; 

            document.querySelector('.game-container').style.display = 'flex';
            document.querySelector('footer').style.display = 'block';
            document.querySelector('.window-controls').style.gap = '5px';
            gameLoop(); // Lanjutkan game loop saat diperluas
            backgroundMusic.play().catch(e => console.error("Gagal melanjutkan musik latar:", e)); // Lanjutkan musik
        }
    });

    // Fungsionalitas Tombol Close
    closeBtn.addEventListener('click', () => {
        container.style.display = 'none'; 
        console.log("Aplikasi closed (hidden).");
        stopGameLoop(); // Hentikan game loop saat ditutup
        backgroundMusic.pause(); // Jeda musik saat ditutup
    });

    // Event Listener untuk memulai musik latar setelah interaksi pengguna (klik tombol START)
    startButton.addEventListener('click', () => {
        startGameOverlay.style.display = 'none'; // Sembunyikan overlay
        backgroundMusic.play().catch(e => console.error("Gagal memutar musik latar:", e)); 
        console.log("Musik latar mulai diputar setelah interaksi pengguna.");
        // Game loop sudah dimulai di luar event listener ini, jadi tidak perlu panggil lagi di sini
    });

    try {
        // Muat gambar background tile untuk kanvas game

        // Muat semua frame animasi Totoro aktif (berjalan/idle normal)
        const totoroFrameNames = [ 
            'Tororo/Tororo 1.png', 
            'Tororo/Tororo 2.png', 
            'Tororo/Tororo 3.png', 
            'Tororo/Tororo 4.png'  
        ];
        for (let i = 0; i < totoroFrameNames.length; i++) {
            await loadImage(`totoro_frame_${i}`, `images/${totoroFrameNames[i]}`, true, totoroActiveAnimationFrames); 
        }

        // Muat semua frame animasi Totoro tidur
        const totoroSleepFrameNames = [
            'Tororo Sleep/Tororo Sleep 1.png', 
            'Tororo Sleep/Tororo Sleep 2.png', 
            'Tororo Sleep/Tororo Sleep 3.png'  
        ];
        for (let i = 0; i < totoroSleepFrameNames.length; i++) {
            await loadImage(`totoro_sleep_frame_${i}`, `images/${totoroSleepFrameNames[i]}`, true, totoroSleepAnimationFrames); 
        }

        // Muat semua frame animasi Soot Sprite
        const sootSpriteFrameNames = [
            'Soot Sprites/Soot sprites 1.png', 
            'Soot Sprites/Soot sprites 2.png', 
            'Soot Sprites/Soot sprites 3.png', 
            'Soot Sprites/Soot sprites 4.png' 
        ];
        for (let i = 0; i < sootSpriteFrameNames.length; i++) {
            await loadImage(`soot_sprite_frame_${i}`, `images/${sootSpriteFrameNames[i]}`, true, sootSpriteAnimationFrames);
        }
        
        setupInput();

        player.x = Math.floor(canvas.width / GAME_UNIT_SIZE / 2 - player.width / 2);
        player.y = Math.floor(canvas.height / GAME_UNIT_SIZE / 2 - player.height / 2); // Menempatkan Totoro di tengah vertikal

        respawnSootSprite();

        gameLoop(); 

    } catch (error) {
        console.error('Gagal memuat aset game:', error);
        ctx.fillStyle = 'grey'; 
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '8px "Press Start 2P"'; 
        ctx.textAlign = 'center';
        ctx.fillText('ERROR', canvas.width / 2, canvas.height / 2);
    }
});
