const boardEl = document.getElementById("board");
const piecesEl = document.getElementById("pieces");
const scoreEl = document.getElementById("score");
const highEl = document.getElementById("highscore");
const timerEl = document.getElementById("timer");
const restartBtn = document.getElementById("restart");

const BOARD_SIZE = 8;
const COLORS = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#facc15", "#22d3ee"];

const BASE_PIECES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[1, 1, 0], [0, 1, 1]], // S
  [[0, 1, 1], [1, 1, 0]], // Z
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 1], [1, 0, 0]], // L
  [[1, 1, 1], [0, 0, 1]] // J
];

let board = [],
  pieces = [],
  score = 0,
  timer = 120,
  interval,
  dragged = null;

function rotate(matrix) {
  const n = matrix.length,
    m = matrix[0].length;
  let res = Array(m).fill(null).map(() => Array(n).fill(0));
  for (let y = 0; y < n; y++)
    for (let x = 0; x < m; x++) res[x][n - 1 - y] = matrix[y][x];
  return res;
}

function randomPiece() {
  let base = BASE_PIECES[Math.floor(Math.random() * BASE_PIECES.length)];
  const rot = Math.floor(Math.random() * 4);
  let rotated = base;
  for (let i = 0; i < rot; i++) rotated = rotate(rotated);
  return rotated;
}

function initBoard() {
  board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
  pieces = [{
    shape: randomPiece(),
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  }, {
    shape: randomPiece(),
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  }, {
    shape: randomPiece(),
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  }, ];
  score = 0;
  timer = 120;
  scoreEl.textContent = score;
  highEl.textContent = localStorage.getItem("highscore") || 0;
  drawBoard();
  drawPieces();
  startTimer();
}

function drawBoard() {
  boardEl.innerHTML = '';
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (board[y][x]) {
        cell.classList.add("block");
        cell.style.background = board[y][x];
      }
      boardEl.appendChild(cell);
    }
  }
}

function drawPieces() {
  piecesEl.innerHTML = '';
  pieces.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "piece";
    div.style.gridTemplateColumns = `repeat(${p.shape[0].length}, 30px)`;
    p.shape.forEach(row => row.forEach(cell => {
      const c = document.createElement("div");
      if (cell) c.style.background = p.color;
      div.appendChild(c);
    }));
    div.addEventListener("pointerdown", () => dragged = i);
    div.addEventListener("pointerup", e => {
      if (dragged !== i) return;
      const rect = boardEl.getBoundingClientRect();
      const cellWidth = rect.width / BOARD_SIZE;
      const cellHeight = rect.height / BOARD_SIZE;
      const x = Math.floor((e.clientX - rect.left) / cellWidth);
      const y = Math.floor((e.clientY - rect.top) / cellHeight);
      placePiece(x, y);
      dragged = null;
    });
    piecesEl.appendChild(div);
  });
}

function placePiece(x0, y0) {
  if (dragged === null) return;
  const { shape, color } = pieces[dragged];

  // 1. Önce parçanın yerleştirilip yerleştirilemeyeceğini kontrol et
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy].length; dx++) {
      if (shape[dy][dx]) {
        const x = x0 + dx;
        const y = y0 + dy;
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y][x]) {
          return; // Geçersiz hamle
        }
      }
    }
  }

  // 2. Kontrollerden geçtiyse, parçayı yerleştir
  let blockCount = 0;
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy].length; dx++) {
      if (shape[dy][dx]) {
        board[y0 + dy][x0 + dx] = color;
        blockCount++;
      }
    }
  }

  score += blockCount; // Yerleştirilen blok sayısı kadar skor ekle
  timer += 2;
  clearLines();

  pieces[dragged] = {
    shape: randomPiece(),
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  };

  drawBoard();
  drawPieces();
}

function clearLines() {
  let cleared = 0;
  // Satırları kontrol et
  for (let y = 0; y < BOARD_SIZE; y++) {
    if (board[y].every(c => c)) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const cell = boardEl.children[y * BOARD_SIZE + x];
        cell.style.animation = "clearLine 0.3s ease forwards";
      }
      setTimeout(() => {
        board[y] = Array(BOARD_SIZE).fill(0);
        drawBoard(); // Tahtayı yeniden çiz
      }, 300);
      cleared++;
    }
  }

  // Sütunları kontrol et
  for (let x = 0; x < BOARD_SIZE; x++) {
    if (board.every(r => r[x])) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        const cell = boardEl.children[y * BOARD_SIZE + x];
        cell.style.animation = "clearLine 0.3s ease forwards";
      }
      setTimeout(() => {
        for (let y = 0; y < BOARD_SIZE; y++) board[y][x] = 0;
        drawBoard(); // Tahtayı yeniden çiz
      }, 300);
      cleared++;
    }
  }

  if (cleared > 0) {
    score += cleared * 10;
    scoreEl.textContent = score;
  }
}

function startTimer() {
  clearInterval(interval);
  interval = setInterval(() => {
    timer--;
    if (timer <= 0) {
      timer = 0; // Zamanlayıcının negatif olmasını engelle
      gameOver();
    }
    const m = String(Math.floor(timer / 60)).padStart(2, '0');
    const s = String(timer % 60).padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

function gameOver() {
  clearInterval(interval);
  const currentHighscore = parseInt(localStorage.getItem("highscore") || 0);
  if (score > currentHighscore) {
    localStorage.setItem("highscore", score);
  }
  // İsteğe bağlı: Oyun bittiğinde bir mesaj göstermek daha iyi olabilir.
  // window.location.href="gameover.html";
  alert(`Oyun Bitti! Skorunuz: ${score}`);
}

restartBtn.addEventListener("click", initBoard);
window.onload = initBoard;

