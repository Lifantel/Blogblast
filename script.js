const boardEl = document.getElementById('board');
const piecesEl = document.getElementById('pieces');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart');

const BOARD_SIZE = 8;
let board = [];
let pieces = [];
let draggedPieceIndex = null;
let score = 0;

const PIECE_SHAPES = [
    [[0,0]],
    [[0,0],[1,0]],
    [[0,0],[0,1]],
    [[0,0],[1,0],[0,1],[1,1]], // 2x2
    [[0,0],[1,0],[2,0]],        // 1x3
    [[0,0],[0,1],[1,1]]         // L
];

// Board ve parçaları başlat
function initBoard() {
    board = Array(BOARD_SIZE).fill(null).map(()=>Array(BOARD_SIZE).fill(0));
}

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
            if(board[y][x]) cell.classList.add('block');
            // Drop alanı
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
                if(p.some(c=>c[0]===x && c[1]===y)) cell.style.background='#6366f1';
                div.appendChild(cell);
            }
        }
        piecesEl.appendChild(div);
    });
}

// Parçayı board’a bırak
function placeDraggedPiece(x0,y0) {
    if(draggedPieceIndex===null) return;
    const piece = pieces[draggedPieceIndex];

    // Çakışma kontrolü
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
        board[y][x]=1;
    }

    // Animasyonlu temizleme
    animateClearLines();

    // Yeni parça
    pieces[draggedPieceIndex]=PIECE_SHAPES[Math.floor(Math.random()*PIECE_SHAPES.length)];
    draggedPieceIndex=null;

    drawBoard();
    drawPieces();

    // Oyun bitiş kontrolü
    if(isGameOver()){
        setTimeout(()=>{ alert('Game Over! Skor: '+score); restart(); }, 50);
    }
}

// Satır ve sütunları animasyonlu temizle
function animateClearLines() {
    let clearedCells = [];
    // Satır
    for(let y=0;y<BOARD_SIZE;y++){
        if(board[y].every(c=>c!==0)){
            for(let x=0;x<BOARD_SIZE;x++) clearedCells.push([x,y]);
        }
    }
    // Sütun
    for(let x=0;x<BOARD_SIZE;x++){
        if(board.every(row=>row[x]!==0)){
            for(let y=0;y<BOARD_SIZE;y++) clearedCells.push([x,y]);
        }
    }

    // Animasyon
    clearedCells.forEach(([x,y],i)=>{
        setTimeout(()=>{ 
            board[y][x]=0; 
            drawBoard(); 
        }, i*50);
    });

    score += clearedCells.length;
    scoreEl.textContent = score;
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

// Restart
function restart() {
    initBoard();
    randomPieces();
    draggedPieceIndex=null;
    score=0;
    scoreEl.textContent=score;
    drawBoard();
    drawPieces();
}

// Başlat
restartBtn.addEventListener('click', restart);
restart();
