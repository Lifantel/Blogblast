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
let timer = 120; // 2 dakika
let interval;

// Artırılmış blok çeşitleri
const PIECE_SHAPES = [
    [[0,0]], [[0,0],[1,0]], [[0,0],[0,1]],
    [[0,0],[1,0],[0,1],[1,1]], // 2x2
    [[0,0],[1,0],[2,0]],        // 1x3
    [[0,0],[0,1],[1,1]],        // L
    [[0,0],[1,0],[2,0],[3,0]],  // 1x4
    [[0,0],[0,1],[0,2]],        // 3x1
    [[0,0],[1,0],[1,1]]         // ters L
];

// Board ve parçaları başlat
function initBoard() {
    board = Array(BOARD_SIZE).fill(null).map(()=>Array(BOARD_SIZE).fill(0));
}

// Rastgele parçaları oluştur
function randomPieces() {
    pieces = [];
    for(let i=0;i<3;i++){
        const shape = PIECE_SHAPES[Math.floor(Math.random()*PIECE_SHAPES.length)];
        pieces.push(shape);
    }
}

// Board’u çiz
function drawBoard() {
    boardEl.innerHTML = '';
    for(let y=0;y<BOARD_SIZE;y++){
        for(let x=0;x<BOARD_SIZE;x++){
            const cell = document.createElement('div');
            cell.className = 'cell';
            if(board[y][x]) {
                cell.classList.add('block');
                cell.style.background = randomColor(board[y][x]);
            }
            cell.addEventListener('dragover', e => e.preventDefault());
            cell.addEventListener('drop', e => placeDraggedPiece(x,y));
            boardEl.appendChild(cell);
        }
    }
}

// Parçaları çiz
function drawPieces() {
    piecesEl.innerHTML = '';
    pieces.forEach((p,i)=>{
        const div = document.createElement('div');
        div.className = 'piece';
        div.setAttribute('draggable', true);
        div.addEventListener('dragstart', ()=>{ draggedPieceIndex=i; });
        for(let y=0;y<4;y++){
            for(let x=0;x<4;x++){
                const cell = document.createElement('div');
                if(p.some(c=>c[0]===x && c[1]===y)) {
                    cell.style.background = randomColor(i+1);
                }
                div.appendChild(cell);
            }
        }
        piecesEl.appendChild(div);
    });
}

// Rastgele renk
function randomColor(seed){
    const colors = ['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#facc15'];
    return colors[seed % colors.length];
}

// Parçayı board’a bırak
function placeDraggedPiece(x0,y0) {
    if(draggedPieceIndex===null) return;
    const piece = pieces[draggedPieceIndex];

    for(const [dx,dy] of piece){
        const x = x0+dx;
        const y = y0+dy;
        if(x<0 || x>=BOARD_SIZE || y<0 || y>=BOARD_SIZE) return;
        if(board[y][x]) return;
    }

    // Yerleştir
    for(const [dx,dy] of piece){
        const x = x0+dx;
        const y = y0+dy;
        board[y][x]=draggedPieceIndex+1;
    }

    // Satır/sütun temizle ve +2 sn ekle
    const cleared = animateClearLines();
    timer += cleared*2; 

    // Yeni parça
    pieces[draggedPieceIndex]=PIECE_SHAPES[Math.floor(Math.random()*PIECE_SHAPES.length)];
    draggedPieceIndex=null;

    drawBoard();
    drawPieces();

    if(isGameOver() || timer<=0){
        endGame();
    }
}

// Satır/sütun temizle ve animasyon
function animateClearLines() {
    let clearedCells = [];
    for(let y=0;y<BOARD_SIZE;y++){
        if(board[y].every(c=>c!==0)){
            for(let x=0;x<BOARD_SIZE;x++) clearedCells.push([x,y]);
        }
    }
    for(let x=0;x<BOARD_SIZE;x++){
        if(board.every(row=>row[x]!==0)){
            for(let y=0;y<BOARD_SIZE;y++) clearedCells.push([x,y]);
        }
    }

    clearedCells.forEach(([x,y],i)=>{
        setTimeout(()=>{ 
            board[y][x]=0; 
            drawBoard(); 
        }, i*30);
    });

    score += clearedCells.length;
    scoreEl.textContent = score;
    return Math.ceil(clearedCells.length/BOARD_SIZE); // kaç satır/sütun temizlendi
}

// Oyun bitiş kontrolü
function isGameOver() {
    return pieces.every(piece=>{
        for(let y=0;y<BOARD_SIZE;y++){
            for(let x=0;x<BOARD_SIZE;x++){
                let canPlace = piece.every(([dx,dy])=>{
                    const nx=x+dx;
                    const ny=y+dy;
                    return nx>=0 && nx<BOARD_SIZE && ny>=0 && ny<BOARD_SIZE && board[ny][nx]===0;
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
function restart() {
    initBoard();
    randomPieces();
    draggedPieceIndex=null;
    score=0;
    scoreEl.textContent = score;
    timer = 120;
    updateTimerDisplay();
    drawBoard();
    drawPieces();
    startTimer();
}

// Başlat
window.onload = () => {
    const highscore = Number(localStorage.getItem('highscore')||0);
    highscoreEl.textContent = highscore;
    restart();
};

restartBtn.addEventListener('click', restart);

