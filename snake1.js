
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");

const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const subMessage = document.getElementById("subMessage");
const startBtn = document.getElementById("startBtn");

const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");

const cellSize = 20;

let columns = 0;
let rows = 0;

let snake = [];
let food = null;

let direction = "RIGHT";
let nextDirection = "RIGHT";

let score = 0;
let highScore = Number(localStorage.getItem("snakeHighScore")) || 0;

let gameRunning = false;
let gameOver = false;
let paused = false;

let gameInterval = null;
let speed = 140;

// High Score
highScoreElement.innerText = String(highScore).padStart(3, "0");

// Canvas Resize
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    columns = Math.floor(rect.width / cellSize);
    rows = Math.floor(rect.height / cellSize);

    if (snake.length > 0) {
        snake = snake.map(part => ({
            x: Math.min(part.x, columns - 1),
            y: Math.min(part.y, rows - 1)
        }));

        if (food) {
            food.x = Math.min(food.x, columns - 1);
            food.y = Math.min(food.y, rows - 1);
        }
    }

    draw();
}

window.addEventListener("resize", resizeCanvas);

// Start Game
function startGame() {
    clearInterval(gameInterval);

    if (columns < 5 || rows < 5) return;

    const centerX = Math.floor(columns / 2);
    const centerY = Math.floor(rows / 2);

    snake = [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY }
    ];

    direction = "RIGHT";
    nextDirection = "RIGHT";

    score = 0;
    speed = 140;

    gameOver = false;
    paused = false;
    gameRunning = true;

    scoreElement.innerText = "000";

    overlay.classList.add("hidden");
    pauseBtn.innerText = "Ⅱ PAUSE";

    createFood();
    draw();

    runGame();
}

// Create Food
function createFood() {
    if (snake.length >= columns * rows) {
        endGame(true);
        return;
    }

    let validPosition = false;

    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * columns),
            y: Math.floor(Math.random() * rows)
        };

        validPosition = !snake.some(part =>
            part.x === food.x && part.y === food.y
        );
    }
}

// Game Loop
function runGame() {
    clearInterval(gameInterval);

    if (!gameRunning || paused) return;

    gameInterval = setInterval(() => {
        update();
        draw();
    }, speed);
}

// Update Snake
function update() {
    direction = nextDirection;

    const head = { ...snake[0] };

    // Movement
    if (direction === "UP") head.y--;
    if (direction === "DOWN") head.y++;
    if (direction === "LEFT") head.x--;
    if (direction === "RIGHT") head.x++;

    // Wall Crossing / Wrap Around

    if (head.x < 0) {
        head.x = columns - 1;
    }

    if (head.x >= columns) {
        head.x = 0;
    }

    if (head.y < 0) {
        head.y = rows - 1;
    }

    if (head.y >= rows) {
        head.y = 0;
    }

    // Food Collision
    const ateFood = head.x === food.x && head.y === food.y;

    // Self Collision
    // Tail moves away if food is not eaten
    const bodyToCheck = ateFood
        ? snake
        : snake.slice(0, -1);

    const hitBody = bodyToCheck.some(part =>
        part.x === head.x && part.y === head.y
    );

    if (hitBody) {
        endGame();
        return;
    }

    // Move Snake
    snake.unshift(head);

    // Eat Food
    if (ateFood) {
        score += 10;

        scoreElement.innerText =
            String(score).padStart(3, "0");

        // Save High Score
        if (score > highScore) {
            highScore = score;

            localStorage.setItem(
                "snakeHighScore",
                highScore
            );

            highScoreElement.innerText =
                String(highScore).padStart(3, "0");
        }

        createFood();

        // Increase Speed
        if (speed > 65 && gameRunning) {
            speed -= 5;
            runGame();
        }

    } else {
        // Remove Tail
        snake.pop();
    }
}

// Draw Game
function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#b6ca91";
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = "rgba(40, 75, 35, 0.12)";
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= columns; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, height);
        ctx.stroke();
    }

    for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(width, y * cellSize);
        ctx.stroke();
    }

    // Food
    if (food) {
        ctx.fillStyle = "#e34b32";

        ctx.beginPath();

        ctx.arc(
            food.x * cellSize + cellSize / 2,
            food.y * cellSize + cellSize / 2,
            cellSize / 2 - 3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    // Snake
    snake.forEach((part, index) => {
        ctx.fillStyle =
            index === 0 ? "#173f20" : "#356b35";

        ctx.fillRect(
            part.x * cellSize + 2,
            part.y * cellSize + 2,
            cellSize - 4,
            cellSize - 4
        );

        // Snake Eyes
        if (index === 0) {
            ctx.fillStyle = "#e5efbd";

            const eyeSize = 3;

            let eye1;
            let eye2;

            if (direction === "RIGHT" || direction === "LEFT") {
                const eyeX = direction === "RIGHT"
                    ? part.x * cellSize + 14
                    : part.x * cellSize + 4;

                eye1 = {
                    x: eyeX,
                    y: part.y * cellSize + 5
                };

                eye2 = {
                    x: eyeX,
                    y: part.y * cellSize + 12
                };

            } else {
                const eyeY = direction === "DOWN"
                    ? part.y * cellSize + 14
                    : part.y * cellSize + 4;

                eye1 = {
                    x: part.x * cellSize + 5,
                    y: eyeY
                };

                eye2 = {
                    x: part.x * cellSize + 12,
                    y: eyeY
                };
            }

            ctx.fillRect(eye1.x, eye1.y, eyeSize, eyeSize);
            ctx.fillRect(eye2.x, eye2.y, eyeSize, eyeSize);
        }
    });
}

// Game Over
function endGame(won = false) {
    clearInterval(gameInterval);

    gameRunning = false;
    gameOver = true;
    paused = false;

    if (won) {
        message.innerText = "YOU WIN!";
        subMessage.innerText = "Amazing! Board completed.";
    } else {
        message.innerText = "GAME OVER!";
        subMessage.innerText = "Your Score: " + score;
    }

    startBtn.innerText = "PLAY AGAIN";

    pauseBtn.innerText = "Ⅱ PAUSE";

    overlay.classList.remove("hidden");
}

// Pause / Resume
function togglePause() {
    if (!gameRunning || gameOver) return;

    paused = !paused;

    if (paused) {
        clearInterval(gameInterval);

        message.innerText = "PAUSED";
        subMessage.innerText = "Take a short break!";

        startBtn.innerText = "RESUME";

        overlay.classList.remove("hidden");

        pauseBtn.innerText = "▶ RESUME";

    } else {
        overlay.classList.add("hidden");

        pauseBtn.innerText = "Ⅱ PAUSE";

        runGame();
    }
}

// Change Direction
function changeDirection(newDirection) {
    if (!gameRunning || paused || gameOver) return;

    const opposite = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT"
    };

    if (newDirection !== opposite[direction]) {
        nextDirection = newDirection;
    }
}

// Keyboard Controls
document.addEventListener("keydown", (event) => {

    const keys = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",

        w: "UP",
        W: "UP",
        s: "DOWN",
        S: "DOWN",
        a: "LEFT",
        A: "LEFT",
        d: "RIGHT",
        D: "RIGHT"
    };

    if (keys[event.key]) {
        event.preventDefault();
        changeDirection(keys[event.key]);
    }

    if (event.code === "Space") {
        event.preventDefault();
        togglePause();
    }
});

// Mobile Controls
document.querySelectorAll(".direction").forEach(button => {

    button.addEventListener("click", () => {
        changeDirection(button.dataset.direction);
    });

});

// Start Button
startBtn.addEventListener("click", () => {

    if (paused && !gameOver) {
        togglePause();
    } else {
        startGame();
    }

});

// Pause Button
pauseBtn.addEventListener("click", togglePause);

// Restart Button
restartBtn.addEventListener("click", startGame);

// Fullscreen Button
fullscreenBtn.addEventListener("click", async () => {

    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (error) {
        console.log("Fullscreen Error:", error);
    }

});

// Initial Setup
resizeCanvas();
draw();
