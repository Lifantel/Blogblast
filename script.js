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
  dragged = null,
  draggedEl = null, // YENİ: Sürüklenen görsel element
  offsetX = 0, // YENİ: Fare/parmak ile elementin solu arasındaki fark
  offsetY = 0; // YENİ: Fare/parmak ile elementin üstü arasındaki fark

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

// DEĞİŞTİ: drawPieces fonksiyonu tamamen yenilendi
function drawPieces() {
  piecesEl.innerHTML = '';
  pieces.forEach((p, i) => {
    const pieceDiv = document.createElement("div");
    pieceDiv.className = "piece";
    pieceDiv.style.gridTemplateColumns = `repeat(${p.shape[0].length}, 30px)`;
    p.shape.forEach(row => row.forEach(cell => {
      const c = document.createElement("div");
      if (cell) c.style.background = p.color;
      pieceDiv.appendChild(c);
    }));

    pieceDiv.addEventListener("pointerdown", e => {
      e.preventDefault(); // Sayfanın sürüklenmesini engelle
      dragged = i;

      // Sürüklenen elementin bir kopyasını oluştur
      draggedEl = pieceDiv.cloneNode(true);
      draggedEl.classList.add("dragging");
      document.body.appendChild(draggedEl);

      // Orijinal parçayı biraz soluklaştır
      pieceDiv.style.opacity = '0.5';

      // Parmağın parçanın neresine bastığını hesapla
      const rect = pieceDiv.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      // Hayalet parçayı anında doğru konuma taşı
      draggedEl.style.left = `${e.clientX - offsetX}px`;
      draggedEl.style.top = `${e.clientY - offsetY}px`;
    });
    piecesEl.appendChild(pieceDiv);
  });
}

// YENİ: Parmağın hareketini takip eden olay dinleyicisi
window.addEventListener("pointermove", e => {
  if (dragged !== null && draggedEl) {
    e.preventDefault();
    // Hayalet parçayı parmağın pozisyonuna göre güncelle
    draggedEl.style.left = `${e.clientX - offsetX}px`;
    draggedEl.style.top = `${e.clientY - offsetY}px`;
  }
});

// YENİ: Parmağı kaldırdığımızda ne olacağını belirleyen olay dinleyicisi
window.addEventListener("pointerup", e => {
  if (dragged !== null && draggedEl) {
    // Tahtanın pozisyonunu al
    const rect = boardEl.getBoundingClientRect();

    // Tahtanın üzerinde miyiz diye kontrol et
    if (e.clientX > rect.left && e.clientX < rect.right && e.clientY > rect.top && e.clientY < rect.bottom) {
        const cellWidth = rect.width / BOARD_SIZE;
        const cellHeight = rect.height / BOARD_SIZE;
        // Bırakılan koordinatları hesapla
        const x = Math.floor((e.clientX - rect.left) / cellWidth);
        const y = Math.floor((e.clientY - rect.top) / cellHeight);
        placePiece(x, y);
    }
    
    // Temizlik yap
    document.body.removeChild(draggedEl);
    dragged = null;
    draggedEl = null;
    drawPieces(); // Orijinal parçanın görünümünü yenilemek için
  }
});


function placePiece(x0, y0) {
    // DEĞİŞTİ: Bu fonksiyon artık sürüklenen parçanın indeksini global 'dragged' değişkeninden alıyor.
    if (dragged === null) return;
    const { shape, color } = pieces[dragged];
    
    // Parçanın sol üst köşesini değil, parmağın bastığı noktayı referans alarak yerleştirme
    // Bu, daha sezgisel bir yerleştirme sağlar. Basitlik için orijinal mantığı koruyoruz:
    // const adjustedX = x0 - Math.floor(offsetX / (draggedEl.clientWidth / shape[0].length));
    // const adjustedY = y0 - Math.floor(offsetY / (draggedEl.clientHeight / shape.length));
    
    // Geçerlilik kontrolü
    for (let dy = 0; dy < shape.length; dy++) {
        for (let dx = 0; dx < shape[dy].length; dx++) {
            if (shape[dy][dx]) {
                const x = x0 + dx;
                const y = y0 + dy;
                if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[y][x]) {
                    return; 
                }
            }
        }
    }

    // Parçayı yerleştir
    let blockCount = 0;
    for (let dy = 0; dy < shape.length; dy++) {
        for (let dx = 0; dx < shape[dy].length; dx++) {
            if (shape[dy][dx]) {
                board[y0 + dy][x0 + dx] = color;
                blockCount++;
            }
        }
    }

    score += blockCount;
    timer += 2;
    clearLines();

    pieces[dragged] = {
        shape: randomPiece(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
    
    // DEĞİŞTİ: Yerleştirme sonrası sadece tahtayı çiziyoruz, parçalar 'pointerup' sonrası zaten çiziliyor.
    drawBoard();
}

function clearLines() {
  let cleared = 0;
  let rowsToClear = [];
  let colsToClear = [];

  for(let y=0; y<BOARD_SIZE; y++) if(board[y].every(c => c)) rowsToClear.push(y);
  for(let x=0; x<BOARD_SIZE; x++) if(board.every(r => r[x])) colsToClear.push(x);
  
  cleared = rowsToClear.length + colsToClear.length;

  if (cleared > 0) {
    rowsToClear.forEach(y => {
        for (let x = 0; x < BOARD_SIZE; x++) {
            boardEl.children[y * BOARD_SIZE + x].style.animation = "clearLine 0.3s ease forwards";
        }
    });
    colsToClear.forEach(x => {
        for (let y = 0; y < BOARD_SIZE; y++) {
            boardEl.children[y * BOARD_SIZE + x].style.animation = "clearLine 0.3s ease forwards";
        }
    });

    setTimeout(() => {
        rowsToClear.forEach(y => board[y] = Array(BOARD_SIZE).fill(0));
        colsToClear.forEach(x => {
            for (let y = 0; y < BOARD_SIZE; y++) board[y][x] = 0;
        });
        score += cleared * 10;
        scoreEl.textContent = score;
        drawBoard();
    }, 300);
  }
}

function startTimer() {
  clearInterval(interval);
  interval = setInterval(() => {
    timer--;
    if (timer <= 0) {
      timer = 0;
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
  window.location.href="gameover.html";
}

restartBtn.addEventListener("click", initBoard);
window.onload = initBoard;
