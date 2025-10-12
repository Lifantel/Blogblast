// script.js - Tam ve eksiksiz sürüm (pointer events, mobil & masaüstü, yönlendirme)
const boardEl = document.getElementById('board');
const piecesEl = document.getElementById('pieces');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const restartBtn = document.getElementById('restart');
const timerEl = document.getElementById('timer');

const BOARD_SIZE = 8;
let board = [];
let pieces = [];
let draggedPieceIndex = null;
let score = 0;
let timer = 120;
let interval;

const PIECE_SHAPES = [
  [[0,0]], [[0,0],[1,0]], [[0,0],[0,1]],
  [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[1,1]], [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[0,2]], [[0,0],[1,0],[1,1]]
];

const COLORS = ['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#facc15','#22d3ee'];

// --- Board ve Parçalar ---
function initBoard(){
  board = Array(BOARD_SIZE).fill(null).map(()=>Array(BOARD_SIZE).fill(0));
}

function randomPieces(){
  pieces = [];
  for(let i=0;i<3;i++){
    const shape = PIECE_SHAPES[Math.floor(Math.random()*PIECE_SHAPES.length)];
    const color = COLORS[Math.floor(Math.random()*COLORS.length)];
    pieces.push({shape,color});
  }
}

// --- Çizimler ---
function drawBoard(){
  if(!boardEl) return;
  boardEl.innerHTML = '';
  for(let y=0;y<BOARD_SIZE;y++){
    for(let x=0;x<BOARD_SIZE;x++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      if(board[y][x] && board[y][x].color){
        cell.classList.add('block');
        cell.style.background = board[y][x].color;
      }
      // drop handlers for desktop drag/drop (keeps compatibility)
      cell.addEventListener('dragover', e=>e.preventDefault());
      cell.addEventListener('drop', e=>placeDraggedPiece(x,y));
      boardEl.appendChild(cell);
    }
  }
}

function drawPieces(){
  if(!piecesEl) return;
  piecesEl.innerHTML = '';
  pieces.forEach((p,i)=>{
    const div = document.createElement('div');
    div.className = 'piece';
    // pointer events are best for unified touch + mouse handling
    div.style.touchAction = 'none';

    // POINTER DOWN - başlama
    div.addEventListener('pointerdown', e=>{
      // only left mouse or touch or pen
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      draggedPieceIndex = i;
      div.setPointerCapture(e.pointerId);
      div.style.position = 'absolute';
      div.style.zIndex = 1000;
      div.style.opacity = 0.6;
      // position initial to where pointer is
      div.style.left = (e.clientX - 20) + 'px';
      div.style.top = (e.clientY - 20) + 'px';
    });

    // POINTER MOVE - takip
    div.addEventListener('pointermove', e=>{
      if(draggedPieceIndex !== i) return;
      div.style.left = (e.clientX - 20) + 'px';
      div.style.top = (e.clientY - 20) + 'px';
      e.preventDefault();
    });

    // POINTER UP - bırakma / yerleştirme
    div.addEventListener('pointerup', e=>{
      if(draggedPieceIndex !== i) return;
      const boardRect = boardEl.getBoundingClientRect();
      const x = Math.floor((e.clientX - boardRect.left) / (boardRect.width / BOARD_SIZE));
      const y = Math.floor((e.clientY - boardRect.top) / (boardRect.height / BOARD_SIZE));
      placeDraggedPiece(x,y);
      // temizle
      div.style.position = '';
      div.style.left = '';
      div.style.top = '';
      div.style.zIndex = '';
      div.style.opacity = 1;
      try { div.releasePointerCapture(e.pointerId); } catch {}
      draggedPieceIndex = null;
    });

    // Ayrıca fare için fallback dragstart/dragend (desktop)
    div.setAttribute('draggable', true);
    div.addEventListener('dragstart', e=>{
      draggedPieceIndex = i;
      div.style.opacity = 0.6;
    });
    div.addEventListener('dragend', e=>{
      div.style.opacity = 1;
      draggedPieceIndex = null;
    });

    // parça görünümü (4x4)
    for(let y=0;y<4;y++){
      for(let x=0;x<4;x++){
        const cell = document.createElement('div');
        if(p.shape.some(c=>c[0]===x && c[1]===y)) cell.style.background = p.color;
        div.appendChild(cell);
      }
    }
    piecesEl.appendChild(div);
  });
}

// --- Yerleştirme ---
function placeDraggedPiece(x0,y0){
  if(draggedPieceIndex === null) return;
  if(x0 === undefined || y0 === undefined) return;
  const pieceObj = pieces[draggedPieceIndex];
  if(!pieceObj) return;
  const piece = pieceObj.shape;
  const color = pieceObj.color;

  // çakışma / sınır kontrolü
  for(const [dx,dy] of piece){
    const x = x0 + dx;
    const y = y0 + dy;
    if(x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return;
    if(board[y][x]) return;
  }

  // yerleştir ve pop animasyonu
  for(const [dx,dy] of piece){
    const x = x0 + dx;
    const y = y0 + dy;
    board[y][x] = { color };
  }

  // hızlı görsel pop (hedef hücreye etki)
  drawBoard();
  piece.forEach(([dx,dy])=>{
    const x = x0 + dx;
    const y = y0 + dy;
    const cellIndex = y * BOARD_SIZE + x;
    const cellEl = boardEl.children[cellIndex];
    if(cellEl){
      cellEl.style.transform = 'scale(0.5)';
      setTimeout(()=>{ cellEl.style.transform = 'scale(1)'; }, 80);
    }
  });

  // temizle + süre ekle
  const cleared = animateClearLines();
  timer += cleared * 2;
  if(timer > 999) timer = 999;

  // parça yenile
  const newShape = PIECE_SHAPES[Math.floor(Math.random()*PIECE_SHAPES.length)];
  const newColor = COLORS[Math.floor(Math.random()*COLORS.length)];
  pieces[draggedPieceIndex] = { shape: newShape, color: newColor };

  // reset
  draggedPieceIndex = null;
  drawBoard();
  drawPieces();

  if(isGameOver() || timer <= 0){
    // kaydet ve yönlendir
    endGame();
  }
}

// --- Satır / sütun temizleme (animasyon) ---
function animateClearLines(){
  let clearedCells = [];
  // satırlar
  for(let y=0;y<BOARD_SIZE;y++){
    if(board[y].every(c => c)){
      for(let x=0;x<BOARD_SIZE;x++) clearedCells.push([x,y]);
    }
  }
  // sütunlar
  for(let x=0;x<BOARD_SIZE;x++){
    if(board.every(row => row[x])) {
      for(let y=0;y<BOARD_SIZE;y++) clearedCells.push([x,y]);
    }
  }

  // benzersizleştir (aynı hücre çakışmasın)
  const unique = {};
  const uniqCells = [];
  clearedCells.forEach(([x,y])=>{
    const k = `${x},${y}`;
    if(!unique[k]) { unique[k]=true; uniqCells.push([x,y]); }
  });

  // animasyon: hücreleri sırayla sıfırla
  uniqCells.forEach(([x,y], i)=>{
    setTimeout(()=>{
      board[y][x] = 0;
      drawBoard();
    }, i * 35);
  });

  // skor artışı
  score += uniqCells.length;
  scoreEl.textContent = score;

  // kaç satır/sütun temizlendi -> ceil(len/BOARD_SIZE)
  return Math.ceil(uniqCells.length / BOARD_SIZE);
}

// --- Oyun bitiş kontrolü ---
function isGameOver(){
  return pieces.every(pObj => {
    const piece = pObj.shape;
    for(let y=0;y<BOARD_SIZE;y++){
      for(let x=0;x<BOARD_SIZE;x++){
        const canPlace = piece.every(([dx,dy])=>{
          const nx = x + dx;
          const ny = y + dy;
          return nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && !board[ny][nx];
        });
        if(canPlace) return false;
      }
    }
    return true;
  });
}

// --- Timer ---
function startTimer(){
  clearInterval(interval);
  interval = setInterval(()=>{
    timer--;
    if(timer < 0) timer = 0;
    updateTimerDisplay();
    if(timer <= 0) endGame();
  }, 1000);
}

function updateTimerDisplay(){
  if(!timerEl) return;
  const min = String(Math.floor(timer/60)).padStart(2,'0');
  const sec = String(timer % 60).padStart(2,'0');
  timerEl.textContent = `${min}:${sec}`;
}

// --- Oyun bitişi: kaydet ve yönlendir ---
function endGame(){
  clearInterval(interval);
  // son skoru sakla
  localStorage.setItem('lastScore', String(score));
  const prevHigh = Number(localStorage.getItem('highscore') || 0);
  const newHigh = Math.max(prevHigh, score);
  localStorage.setItem('highscore', String(newHigh));

  // gameover sayfasına yönlendir
  // küçük gecikme veriyoruz ki localStorage yazılsın
  setTimeout(()=>{ window.location.href = 'gameover.html'; }, 150);
}

// --- Restart ---
function restart(){
  initBoard();
  randomPieces();
  draggedPieceIndex = null;
  score = 0;
  scoreEl.textContent = score;
  // timer reset
  timer = 120;
  updateTimerDisplay();
  drawBoard();
  drawPieces();
  startTimer();
}

// --- Başlatma: sayfa yüklenince ---
window.addEventListener('load', ()=>{
  // element kontrolleri
  if(!boardEl || !piecesEl || !scoreEl || !highscoreEl || !timerEl){
    console.error('Gerekli DOM elementleri bulunamadı. index.html içindeki id isimlerini kontrol et: board, pieces, score, highscore, timer, restart');
    return;
  }

  const storedHigh = Number(localStorage.getItem('highscore') || 0);
  highscoreEl.textContent = storedHigh;
  restart();
});

// restart butonu
if(restartBtn) restartBtn.addEventListener('click', restart);
