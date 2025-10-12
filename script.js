const boardEl = document.getElementById('board');
const piecesEl = document.getElementById('pieces');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart');

const BOARD_SIZE = 8;
const PIECE_SHAPES = [
  [[0,0]], [[0,0],[1,0]], [[0,0],[0,1]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[0,0],[1,0],[2,0]], [[0,0],[1,0],[1,1]],
  [[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[1,0],[2,0],[2,1]], [[0,0],[1,0],[1,1],[2,1]]
];
const COLORS = ['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#facc15','#22d3ee'];

let board, pieces, score, timer, interval, draggedPieceIndex = null;

function init(){
  board = Array(BOARD_SIZE).fill().map(()=>Array(BOARD_SIZE).fill(0));
  pieces = Array(3).fill().map(()=>randomPiece());
  score = 0;
  timer = 120;
  scoreEl.textContent = score;
  highscoreEl.textContent = localStorage.getItem('highscore') || 0;
  drawBoard();
  drawPieces();
  startTimer();
}

function randomPiece(){
  return {
    shape: PIECE_SHAPES[Math.floor(Math.random()*PIECE_SHAPES.length)],
    color: COLORS[Math.floor(Math.random()*COLORS.length)]
  };
}

function drawBoard(){
  boardEl.innerHTML='';
  for(let y=0;y<BOARD_SIZE;y++){
    for(let x=0;x<BOARD_SIZE;x++){
      const c=document.createElement('div');
      c.className='cell';
      if(board[y][x]){ c.classList.add('block'); c.style.background=board[y][x]; }
      c.addEventListener('dragover',e=>e.preventDefault());
      c.addEventListener('drop',e=>placePiece(x,y));
      boardEl.appendChild(c);
    }
  }
}

function drawPieces(){
  piecesEl.innerHTML='';
  pieces.forEach((p,i)=>{
    const div=document.createElement('div');
    div.className='piece';
    div.style.setProperty('--block-color',p.color);
    for(let y=0;y<4;y++){
      for(let x=0;x<4;x++){
        const cell=document.createElement('div');
        if(p.shape.some(c=>c[0]==x&&c[1]==y)) cell.style.background=p.color;
        div.appendChild(cell);
      }
    }

    div.addEventListener('pointerdown',e=>{
      draggedPieceIndex=i;
      div.style.opacity=0.6;
      div.setPointerCapture(e.pointerId);
    });
    div.addEventListener('pointerup',e=>{
      if(draggedPieceIndex!==i)return;
      const rect=boardEl.getBoundingClientRect();
      const x=Math.floor((e.clientX-rect.left)/(rect.width/BOARD_SIZE));
      const y=Math.floor((e.clientY-rect.top)/(rect.height/BOARD_SIZE));
      placePiece(x,y);
      div.style.opacity=1;
      draggedPieceIndex=null;
    });
    piecesEl.appendChild(div);
  });
}

function placePiece(x0,y0){
  if(draggedPieceIndex===null)return;
  const {shape,color}=pieces[draggedPieceIndex];
  for(const[dx,dy]of shape){
    const x=x0+dx,y=y0+dy;
    if(x<0||x>=BOARD_SIZE||y<0||y>=BOARD_SIZE||board[y][x])return;
  }
  for(const[dx,dy]of shape){board[y0+dy][x0+dx]=color;}
  score+=shape.length;
  timer+=2;
  checkLines();
  pieces[draggedPieceIndex]=randomPiece();
  drawBoard(); drawPieces();
}

function checkLines(){
  let cleared=0;
  for(let y=0;y<BOARD_SIZE;y++){
    if(board[y].every(c=>c)){board[y]=Array(BOARD_SIZE).fill(0);cleared++;}
  }
  for(let x=0;x<BOARD_SIZE;x++){
    if(board.every(r=>r[x])){for(let y=0;y<BOARD_SIZE;y++)board[y][x]=0;cleared++;}
  }
  if(cleared>0) score+=cleared*10;
  scoreEl.textContent=score;
}

function startTimer(){
  clearInterval(interval);
  interval=setInterval(()=>{
    timer--;
    if(timer<=0){endGame();}
    const m=String(Math.floor(timer/60)).padStart(2,'0');
    const s=String(timer%60).padStart(2,'0');
    timerEl.textContent=`${m}:${s}`;
  },1000);
}

function endGame(){
  clearInterval(interval);
  const high=parseInt(localStorage.getItem('highscore')||0);
  if(score>high)localStorage.setItem('highscore',score);
  window.location='gameover.html';
}

restartBtn.addEventListener('click',()=>{clearInterval(interval);init();});
window.onload=init;

