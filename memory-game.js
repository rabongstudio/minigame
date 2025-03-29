 
let stage = 1;
let score = 0;
let answerOrder = [];
let currentIndex = 0;
const uuid = getUUID();

window.onload = () => {
  updateHearts();
  loadLeaderboard(); // 추가
  loadMySchoolRank();
  loadSchoolRank();
};
setInterval(updateHearts, 5000);

function toggleStartButton() {
  const btn = document.getElementById("start-btn");
  if (btn) btn.disabled = getHearts() <= 0;
}

function startGame() {
  if (getHearts() <= 0) return alert("하트가 없습니다!");
  useHeart();
  stage = 1;
  score = 0;
  nextStage();
}

function nextStage() {
  document.getElementById("stage").innerHTML = `단계: ${stage} (숫자 ${2 ** stage}개)`;
  const count = 2 + (stage - 1) * 2;
  const board = document.getElementById("board");
  board.innerHTML = "";
  answerOrder = [];
  currentIndex = 0;

  const numbers = Array.from({ length: count }, (_, i) => i + 1);
  const shuffled = [...numbers].sort(() => Math.random() - 0.5);
  answerOrder = [...shuffled].sort((a, b) => a - b);

  const gridSize = Math.ceil(Math.sqrt(count));
  board.style.gridTemplateColumns = `repeat(${gridSize}, 60px)`;

  shuffled.forEach(num => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = num;
    cell.dataset.num = num;
    // 👉 여기 추가
    cell.style.display = "flex";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "center";
    board.appendChild(cell);
  });

  // 2초 후 숨김
  const hideDelay = 2000 + (stage - 1) * 500; // 기본 2초 + 단계당 0.2초 증가
  setTimeout(() => {
    document.querySelectorAll(".cell").forEach(cell => {
      cell.classList.add("hidden");
      cell.addEventListener("click", onCellClick);
    });
  }, hideDelay);
}

function onCellClick(e) {
  const num = parseInt(e.target.dataset.num);
  if (num === answerOrder[currentIndex]) {
    e.target.classList.remove("hidden");
    e.target.classList.add("correct");
    currentIndex++;
    score++;
    if (currentIndex === answerOrder.length) {
      document.getElementById("result").innerHTML = `<p>🎉 성공! 현재 점수: <b>${score}</b>점</p>`;
      setTimeout(() => {
        stage++;
        document.getElementById("result").innerHTML = "";
        nextStage();
      }, 1500);
    }
  } else {
    e.target.classList.remove("hidden");
    e.target.classList.add("wrong");
    document.querySelectorAll(".cell").forEach(cell => cell.removeEventListener("click", onCellClick));
    gameOver();
  }
}

function gameOver() {
  document.getElementById("result").innerHTML = `<p>😢 실패! 당신의 최종 점수는 <b>${score}</b>점입니다.</p>`;
  saveScore(localStorage.getItem("nickname"), localStorage.getItem("school"), uuid, score);
  document.getElementById("start-btn").disabled = false;
  
  setTimeout(() => {
    loadLeaderboard(); // 추가
    loadMySchoolRank();
    loadSchoolRank();
  }, 500);
 
  
}

async function saveScore(nickname, school, uuid, finalScore) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/memory_scores?uuid=eq.${uuid}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await res.json();

    if (data.length > 0 && finalScore > data[0].score) {
      await fetch(`${SUPABASE_URL}/rest/v1/memory_scores?uuid=eq.${uuid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ score: finalScore })
      });
      showFireworks(window.innerWidth / 2, window.innerHeight / 2);
    } else if (data.length === 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/memory_scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "return=representation"
        },
        body: JSON.stringify({ uuid, nickname, school, score: finalScore })
      });
      showFireworks(window.innerWidth / 2, window.innerHeight / 2);
    }
  } catch (e) {
    console.error("점수 저장 오류:", e);
  }
}

 
