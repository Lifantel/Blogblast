const boardEl = document.getElementById("board");
const piecesEl = document.getElementById("pieces");
const scoreEl = document.getElementById("score");
const highEl = document.getElementById("highscore");
const timerEl = document.getElementById("timer");
const restartBtn = document.getElementById("restart");

const BOARD_SIZE = 8;
const COLORS = ["#f87171","#fbbf24","#34d399","#60a5fa","#a78bfa","#f472b6","#facc15","#22d3ee"];
const BASE_PIECES = [
  [[1,1,1,1]],               // I
  [[1,1],[1,1]],             // O
  [[1,1,0],[0,1,1]],         // S
  [[0,1,1],[1,1,0]],         // Z
  [[1,1,1],[0,1,0]],         // T
  [[1,1,1],[1,0,0]],         // L
  [[1,1,1],[0,0,1]],
  [[1]],
  [[1,1]],
  [[1],[1]] 
];

let board=[], pieces=[], score=0, timer=120, interval;
let dragged=null, draggedEl=null, offsetX=0, offsetY=0;

// ---------- AKILLI RASTGELELİK ----------
let pieceBag = [];
let colorBag = [];
function refillBag(baseArr) {
  const arr = [...baseArr];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function getRandomPiece() {
  if (pieceBag.length === 0) pieceBag = refillBag(BASE_PIECES);
  let base = pieceBag.pop();
  const rot = Math.floor(Math.random() * 4);
  for (let i = 0; i < rot; i++) base = rotate(base);
  return base;
}
function getRandomColor() {
  if (colorBag.length === 0) colorBag = refillBag(COLORS);
  return colorBag.pop();
}
// ----------------------------------------

function rotate(matrix) {
  const n = matrix.length, m = matrix[0].length;
  let res = Array(m).fill(null).map(()=>Array(n).fill(0));
  for (let y=0;y<n;y++) for (let x=0;x<m;x++) res[x][n-1-y]=matrix[y][x];
  return res;
}

function initBoard() {
  board = Array(BOARD_SIZE).fill().map(()=>Array(BOARD_SIZE).fill(0));
  pieces = Array(3).fill().map(()=>({
    shape:getRandomPiece(),
    color:getRandomColor()
  }));
  score=0; timer=120;
  scoreEl.textContent=score;
  highEl.textContent=localStorage.getItem("highscore")||0;
  drawBoard();
  drawPieces();
  startTimer();
}

function drawBoard() {
  boardEl.innerHTML='';
  for (let y=0;y<BOARD_SIZE;y++) {
    for (let x=0;x<BOARD_SIZE;x++) {
      const cell=document.createElement("div");
      cell.className="cell";
      if (board[y][x]) {
        cell.classList.add("block");
        cell.style.background=board[y][x];
      }
      boardEl.appendChild(cell);
    }
  }
}

function drawPieces() {
  piecesEl.innerHTML='';
  pieces.forEach((p,i)=>{
    const pieceDiv=document.createElement("div");
    pieceDiv.className="piece";
    pieceDiv.style.gridTemplateColumns=`repeat(${p.shape[0].length},30px)`;
    p.shape.forEach(row=>row.forEach(cell=>{
      const c=document.createElement("div");
      if(cell) c.style.background=p.color;
      pieceDiv.appendChild(c);
    }));

    pieceDiv.addEventListener("pointerdown",e=>{
      e.preventDefault();
      dragged=i;
      draggedEl=pieceDiv.cloneNode(true);
      draggedEl.classList.add("dragging");
      document.body.appendChild(draggedEl);
      pieceDiv.style.opacity="0.5";
      const rect=pieceDiv.getBoundingClientRect();
      offsetX=e.clientX-rect.left;
      offsetY=e.clientY-rect.top;
      draggedEl.style.left=`${e.clientX-offsetX}px`;
      draggedEl.style.top=`${e.clientY-offsetY}px`;
    });
    piecesEl.appendChild(pieceDiv);
  });
}

window.addEventListener("pointermove",e=>{
  if(dragged!==null&&draggedEl){
    e.preventDefault();
    draggedEl.style.left=`${e.clientX-offsetX}px`;
    draggedEl.style.top=`${e.clientY-offsetY}px`;
  }
});

window.addEventListener("pointerup",e=>{
  if(dragged!==null&&draggedEl){
    const rect=boardEl.getBoundingClientRect();
    if(e.clientX>rect.left&&e.clientX<rect.right&&e.clientY>rect.top&&e.clientY<rect.bottom){
      const cellW=rect.width/BOARD_SIZE,cellH=rect.height/BOARD_SIZE;
      const x=Math.floor((e.clientX-rect.left)/cellW);
      const y=Math.floor((e.clientY-rect.top)/cellH);
      placePiece(x,y);
    }
    document.body.removeChild(draggedEl);
    dragged=null; draggedEl=null;
    drawPieces();
  }
});

function placePiece(x0,y0){
  if(dragged===null)return;
  const{shape,color}=pieces[dragged];
  for(let dy=0;dy<shape.length;dy++){
    for(let dx=0;dx<shape[dy].length;dx++){
      if(shape[dy][dx]){
        const x=x0+dx,y=y0+dy;
        if(x<0||x>=BOARD_SIZE||y<0||y>=BOARD_SIZE||board[y][x])return;
      }
    }
  }
  let blockCount=0;
  for(let dy=0;dy<shape.length;dy++){
    for(let dx=0;dx<shape[dy].length;dx++){
      if(shape[dy][dx]){
        board[y0+dy][x0+dx]=color;
        blockCount++;
      }
    }
  }
  score+=blockCount;
  timer+=2;
  clearLines();
  pieces[dragged]={shape:getRandomPiece(),color:getRandomColor()};
  drawBoard();
}

function clearLines(){
  let rows=[],cols=[];
  for(let y=0;y<BOARD_SIZE;y++) if(board[y].every(c=>c)) rows.push(y);
  for(let x=0;x<BOARD_SIZE;x++) if(board.every(r=>r[x])) cols.push(x);
  const cleared=rows.length+cols.length;
  if(cleared>0){
    rows.forEach(y=>{
      for(let x=0;x<BOARD_SIZE;x++)
        boardEl.children[y*BOARD_SIZE+x].style.animation="clearLine 0.3s ease forwards";
    });
    cols.forEach(x=>{
      for(let y=0;y<BOARD_SIZE;y++)
        boardEl.children[y*BOARD_SIZE+x].style.animation="clearLine 0.3s ease forwards";
    });
    setTimeout(()=>{
      rows.forEach(y=>board[y]=Array(BOARD_SIZE).fill(0));
      cols.forEach(x=>{for(let y=0;y<BOARD_SIZE;y++)board[y][x]=0;});
      score+=cleared*10;
      scoreEl.textContent=score;
      drawBoard();
    },300);
  }
}

function startTimer(){
  clearInterval(interval);
  interval=setInterval(()=>{
    timer--;
    if(timer<=0){timer=0;gameOver();}
    const m=String(Math.floor(timer/60)).padStart(2,"0");
    const s=String(timer%60).padStart(2,"0");
    timerEl.textContent=`${m}:${s}`;
  },1000);
}

function gameOver(){
  clearInterval(interval);
  const hs=parseInt(localStorage.getItem("highscore")||0);
  if(score>hs)localStorage.setItem("highscore",score);
  window.location.href="gameover.html";
}

restartBtn.addEventListener("click",initBoard);
window.onload=initBoard;

