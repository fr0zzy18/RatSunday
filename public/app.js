const socket = io();

const playerBoardEl = document.getElementById("playerBoard");
const opponentBoardEl = document.getElementById("opponentBoard");
const startBtn = document.getElementById("startGameBtn");
const wordSelectionEl = document.getElementById("word-selection");
const setupDiv = document.getElementById("setup");
const gameDiv = document.getElementById("game");
const statusEl = document.getElementById("status");
const nicknameInput = document.getElementById("nickname");
const playerTitle = document.getElementById("playerTitle");
const opponentTitle = document.getElementById("opponentTitle");

const allWords = [
  "Soob dies",'"Guys pls just focus"',"Checking dps on adds","Some ppl don't soak","Tanks fucked up",
  '"Just listen to my calls"',"Tank dies","Threatens to replace someone",'"It is not a rocket science"',"They are not popping defensives",
  "An argument about wipe reasons",'"Ress that noob"','"This is unacceptable guys"',"Checking dying logs",'"We can not keep play like this"',
  "Zergg dies",'"That deaths are completely avoidable"',"Some dumb Blizzard bug messed up Dread",'"How can you die to this mechanic"','"I will recruit a few more people"',
  "Marko calling, Dread not saying anything","Dan is telling what he messed up",'"Come on Lich"',"An argument on boss strategy","This X is a (total) joke",
  "Just follow the fucking raid plan", "Dan dies", '"I fucking HATE weak auras"', '"Simply do not die"', '"This boss is so fucking boring"', "Dread rants about people not playing properly",
  "Soob changed weak auras", "Wipe below 5%", "Tulula dies", "Dread blames Maxi", '"I do not make suck mistakes"', "Melon suggests another good strategy", "Boss dies",
  "Wolfi late or absent without warning", "Someone leaves mid-raid with a scandal", "Katy Perry is mentioned", "Dread does not know boss mechanic", "Wrong BL", "Markos monitor is dead(again)"
];

let playerCells = [];
let opponentCells = [];
let playerBoard = [];
let myNickname = "";

// Генеруємо вибір слів (чекбокси)
allWords.forEach(word => {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = word;
  checkbox.id = word;

  // Контроль кількості вибраних
  checkbox.addEventListener("change", () => {
    const checked = wordSelectionEl.querySelectorAll("input:checked").length;
    if (checked > 24) {
      checkbox.checked = false;
      alert("Only 24 options!");
    }
  });

  const label = document.createElement("label");
  label.textContent = word;
  label.htmlFor = word;
  wordSelectionEl.appendChild(checkbox);
  wordSelectionEl.appendChild(label);
  wordSelectionEl.appendChild(document.createElement("br"));
});

// Старт гри
startBtn.onclick = () => {
  myNickname = nicknameInput.value.trim();
  if (!myNickname) {
    alert("Enter your name");
    return;
  }

  const selectedWords = Array.from(wordSelectionEl.querySelectorAll("input:checked"))
    .map(input => input.value);

  if(selectedWords.length !== 24){
    alert("Pick 24 options");
    return;
  }

  setupDiv.style.display = "none";
  gameDiv.style.display = "block";

  // Перемішуємо вибрані слова
  const shuffled = [...selectedWords].sort(() => Math.random() - 0.5);

  // Вставляємо слова у випадкові клітинки, крім центру
  playerBoard = [];
  let wordIndex = 0;
  for (let i = 0; i < 25; i++) {
    if (i === 12) { // центральна клітинка
      playerBoard.push({ word: "EMPTY SPACE", marked: true });
    } else {
      playerBoard.push({ word: shuffled[wordIndex], marked: false });
      wordIndex++;
    }
  }

  // Заголовок для своєї картки
  playerTitle.textContent = `Card ${myNickname}`;

  createBoard(playerBoardEl, playerBoard, playerCells, false);

  // Надсилаємо серверу свою картку і нік
  socket.emit('setBoard', { board: playerBoard, nickname: myNickname });
  socket.emit('joinGame');
};

// Створення картки
function createBoard(boardEl, boardData, cellArr, readOnly=false){
  boardEl.innerHTML = "";
  boardData.forEach((cellData,i)=>{
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = cellData.word;
    if(cellData.marked) cell.classList.add("marked");

    if(!readOnly && i !== 12){ // центральну клітинку не можна змінювати
      cell.onclick = ()=>{
        cell.classList.toggle("marked");
        playerBoard[i].marked = !playerBoard[i].marked;
        socket.emit('markCell', i);
        checkBingo();
      };
    }

    boardEl.appendChild(cell);
    cellArr.push(cell);

    // Підгонка тексту
    fitTextToCell(cell);
  });
}

// Підгонка тексту під клітинку
function fitTextToCell(cell) {
  let fontSize = 24;
  cell.style.fontSize = fontSize + "px";
  cell.style.whiteSpace = "normal";
  cell.style.wordBreak = "break-word";

  while ((cell.scrollWidth > cell.clientWidth || cell.scrollHeight > cell.clientHeight) && fontSize > 10) {
    fontSize -= 1;
    cell.style.fontSize = fontSize + "px";
  }
}

// Оновлення картки суперника
socket.on('opponentBoard', ({ board, nickname }) => {
  opponentBoardEl.innerHTML = "";
  opponentCells = [];
  createBoard(opponentBoardEl, board, opponentCells, true);

  opponentTitle.textContent = `Card ${nickname}`;
  statusEl.textContent = "Someone connected!";
});

// Оновлення клітинки суперника
socket.on('opponentMark', (index) => {
  if(opponentCells[index]){
    opponentCells[index].classList.toggle("marked");
  }
});

// Суперник відключився
socket.on('opponentDisconnected', () => {
  statusEl.textContent = "Someone disconnected.";
});

// Перевірка BINGO
function checkBingo(){
  const b = playerBoard.map(c => c.marked);
  const size = 5;

  // Горизонталі
  for(let i=0;i<size;i++){
    if(b.slice(i*size, i*size+size).every(Boolean)){
      alert("You win!");
      return;
    }
  }
  // Вертикалі
  for(let i=0;i<size;i++){
    if([...Array(size)].map((_,j)=>b[i+j*size]).every(Boolean)){
      alert("You win!");
      return;
    }
  }
  // Діагоналі
  if([...Array(size)].map((_,i)=>b[i*size+i]).every(Boolean) ||
     [...Array(size)].map((_,i)=>b[(i+1)*(size-1)]).every(Boolean)){
    alert("You win!");
    return;
  }
}