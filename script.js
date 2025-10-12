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

// Çeşitli bloklar
const PIECE_SHAPES = [
  [[0,0]], [[0,0],[1,0]], [[0,0],[0,1]],
  [[0,0],[1,0],[0,1],[1,1]], [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[1,1]], [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[0,2]], [[0,0],[1,0],[1,1]]
];

const COLORS = ['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#facc15','#22d3ee'];

// Board başlat
function initBoard(){
  board = Array(BOARD_SIZE).fill(null).map(()=>Array(BOARD_SIZE).fill(0));
}

// Rastgele parçalar
function randomPieces(){
  pieces = [];
  for(let i=0;i<3;i++){
    const shape = PIECE_SHAPES[Math.floor(Math.random()*PIECE_SHAPES.length)];
    const color = COLORS[Math.floor(Math.random()*COLORS.length)];
    pieces.push({shape,color});
  }
}

// Board çiz
function drawBoard(){
  boardEl.innerHTML = '';
  for(let y=0;y<BOARD_SIZE;y++){
    for(let x=0;x<BOARD_SIZE;x++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      if(board[y][x] && board[y][x].color){
        cell.classList.add('block');
        cell.style.background = board[y][x].color;
      }
      cell.addEventListener('dragover', e=>e.preventDefault());
      cell.addEventListener('drop', e=>placeDraggedPiece(x,y));
      boardEl.appendChild(cell);
    }
  }
}

// Parçaları çiz (masaüstü ve mobil)
function drawPieces(){
  piecesEl.innerHTML = '';
  pieces.forEach((p,i)=>{
    const div = document.createElement('div');
    div.className='piece';

    // Masaüstü
    div.setAttribute('draggable', true);
    div.addEventListener('dragstart', ()=>{ draggedPieceIndex = i; });

    // Mobil
    div.addEventListener('touchstart', e=>{
      draggedPieceIndex = i;
      div.style.position = 'absolute';
      div.style.zIndex = 1000;
    });
    div.addEventListener('touchmove', e=>{
      const touch = e.touches[0];
      div.style.left = touch.clientX - 20 + 'px';
      div.style.top = touch.clientY - 20 + 'px';
      e.preventDefault();
    });
    div.addEventListener('touchend', e=>{
      const touch = e.changedTouches[0];
      const boardRect = boardEl.getBoundingClientRect();
      const x = Math.floor((touch.clientX - boardRect.left)/(boardRect.width/BOARD_SIZE));
      const y = Math.floor((touch.clientY - boardRect.top)/(boardRect.height/BOARD_SIZE));
      placeDraggedPiece(x,y);
      div.style.position = '';
      div.style.left = '';
      div.style.top = '';
      div.style.zIndex = '';
      draggedPieceIndex = null;
    });

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

// Blok yerleştir
function placeDraggedPiece(x0,y0){
  if(draggedPieceIndex===null) return;
  const pieceObj = pieces[draggedPieceIndex];
  const piece = pieceObj.shape;
  const color = pieceObj.color;

  for(const [dx,dy] of piece){
    const x = x0+dx;
    const y = y0+dy;
    if(x<0 || x>=BOARD_SIZE || y<0 || y>=BOARD_SIZE) return;
    if(board[y][x]) return;
  }

  for(const [dx,dy] of piece){
    const x = x0+dx;
    const y = y0+dy;
    board[y][x] = {color};
  }

  const cleared = animateClearLines();
  timer += cleared*2;
  if(timer>999) timer=999;

  // Yeni parça
  const newShape = PIECE_SHAPES[Math.floor(Math.random()*PIECE_SHAPES.length)];
  const newColor = COLORS[Math.floor(Math.random()*COLORS.length)];
  pieces[draggedPieceIndex] = {shape:newShape, color:newColor};
  draggedPieceIndex = null;

  drawBoard();
  drawPieces();

  if(isGameOver() || timer<=0) endGame();
}

// Satır/sütun temizle
function animateClearLines(){
  let clearedCells = [];
  for(let y=0;y<BOARD_SIZE;y++){
    if(board[y].every(c=>c)) for(let x=0;x<BOARD_SIZE;x++) clearedCells.push([x,y]);
  }
  for(let x=0;x<BOARD_SIZE;x++){
    if(board.every(row=>row[x])) for(let y=0;y<BOARD_SIZE;y++) clearedCells.push([x,y]);
  }

  clearedCells.forEach(([x,y],i)=>{
    setTimeout(()=>{
      board[y][x] = 0;
      drawBoard();
    }, i*30);
  });

  score += clearedCells.length;
  scoreEl.textContent = score;
  return Math.ceil(clearedCells.length/BOARD_SIZE);
}

// Oyun bitiş kontrol
function isGameOver(){
  return pieces.every(p=>{
    const piece = p.shape;
    for(let y=0;y<BOARD_SIZE;y++){
      for(let x=0;x<BOARD_SIZE;x++){
        const canPlace = piece.every(([dx,dy])=>{
          const nx=x+dx; const ny=y+dy;
          return nx>=0 && nx<BOARD_SIZE && ny>=0 && ny<BOARD_SIZE && !board[ny][nx];
        });
        if(canPlace) return false;
      }
    }
    return true;
  });
}

// Timer
function startTimer(){
  clearInterval(interval);
  interval = setInterval(()=>{
    timer--;
    if(timer<0) timer=0;
    updateTimerDisplay();
    if(timer<=0) endGame();
  },1000);
}

function updateTimerDisplay(){
  const min = String(Math.floor(timer/60)).padStart(2,'0');
  const sec = String(timer%60).padStart(2,'0');
  timerEl.textContent = `${min}:${sec}`;
}

// Oyun bitişi
function endGame(){
  clearInterval(interval);
  const highscore = Math.max(score, Number(localStorage.getItem('highscore')||0));
  localStorage.setItem('highscore', highscore);
  highscoreEl.textContent = highscore;
  alert(`Oyun Bitti! Skor: ${score}`);
}

// Restart
function restart(){
  initBoard();
  randomPieces();
  draggedPieceIndex=null;
  score=0;
  scoreEl.textContent=score;
  timer=120;
  updateTimerDisplay();
  drawBoard();
  drawPieces();
  startTimer();
}

// Başlat
window.onload = ()=>{
  const highscore = Number(localStorage.getItem('highscore')||0);
  highscoreEl.textContent = highscore;
  restart();
};
restartBtn.addEventListener('click', restart);
