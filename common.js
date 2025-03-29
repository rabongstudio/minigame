const SUPABASE_URL = "https://dmxkznmliiyffoltdcxd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteGt6bm1saWl5ZmZvbHRkY3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNTc2NzksImV4cCI6MjA1ODYzMzY3OX0.NUQgOp8NGHEZ0RDQ4sbuH7YCJpfYqF3UyEK3sPtu5-o";
 
const heartTime = 5000;
// ✅ 공통 UUID 처리
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getUUID() {
  let uuid = localStorage.getItem("uuid");
  if (!uuid) {
    uuid = generateUUID();
    localStorage.setItem("uuid", uuid);
  }
  return uuid;
}

// ✅ 공통 하트 관련 처리
function getHearts() {
  const stored = localStorage.getItem(HEART_KEY);
  return stored !== null ? Math.min(parseInt(stored), MAX_HEARTS) : MAX_HEARTS;
}

function saveHearts(count) {
  localStorage.setItem(HEART_KEY, count);
}

function getLastRecoverTime() {
  const stored = localStorage.getItem(LAST_RECOVER_KEY);
  return stored ? parseInt(stored) : null;
}

function saveLastRecoverTime(timestamp) {
  localStorage.setItem(LAST_RECOVER_KEY, timestamp);
}

function renderHearts() {
  const heartArea = document.getElementById("hearts");
  const count = getHearts();
  const fullHeart = "❤️"; // 또는 "\\u2764\\uFE0F"
  const emptyHeart = "🤍"; // 또는 "\\u2661"
  heartArea.innerHTML = fullHeart.repeat(count) + emptyHeart.repeat(MAX_HEARTS - count);
}

function updateHearts() {
  const now = Date.now();
  const last = getLastRecoverTime();
  let hearts = getHearts();

  if (last !== null && hearts < MAX_HEARTS) {
    const diff = now - last;
    const recovered = Math.floor(diff / RECOVER_INTERVAL);
    if (recovered > 0) {
      hearts = Math.min(MAX_HEARTS, hearts + recovered);
      saveHearts(hearts);
      saveLastRecoverTime(last + recovered * RECOVER_INTERVAL);
    }
  }

  renderHearts();
  if (typeof toggleStartButton === 'function') toggleStartButton();
}

function useHeart() {
  let hearts = getHearts();
  if (hearts > 0) {
    saveHearts(hearts - 1);
    saveLastRecoverTime(Date.now());
    renderHearts();
    if (typeof toggleStartButton === 'function') toggleStartButton();
    return true;
  }
  return false;
}

// ✅ 불꽃놀이 애니메이션
function showFireworks(x, y) {
  for (let i = 0; i < 25; i++) {
    const spark = document.createElement("div");
    spark.classList.add("firework");

    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * 60;
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;

    spark.style.left = `${x + offsetX}px`;
    spark.style.top = `${y + offsetY}px`;
    spark.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;

    document.body.appendChild(spark);

    setTimeout(() => {
      spark.remove();
    }, 700);
  }
}

async function loadLeaderboard() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/memory_scores?select=uuid,nickname,school,score&order=score.desc&limit=10`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const scores = await res.json();
  const rankBody = document.getElementById("rank-body");
  rankBody.innerHTML = "";

  scores.forEach((entry, i) => {
    const row = document.createElement("tr");
    if (entry.uuid === uuid) {
      row.classList.add("my-row");
    }
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${entry.nickname}</td>
      <td>${entry.school}</td>
      <td>${entry.score}</td>
    `;
    rankBody.appendChild(row);
  });
}

async function loadMySchoolRank() {
  const school = localStorage.getItem("school");
  if (!school) return;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/memory_scores?school=eq.${encodeURIComponent(school)}&select=uuid,nickname,score&order=score.desc`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const data = await res.json();
  const tbody = document.getElementById("my-school-body");
  tbody.innerHTML = "";

  data.forEach((entry, i) => {
    const row = document.createElement("tr");
    if (entry.uuid === uuid) {
      row.classList.add("my-row");
    }
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${entry.nickname}</td>
      <td>${entry.score}</td>
    `;
    tbody.appendChild(row);
  });
  const title = document.getElementById("school-rank-title");
  title.innerHTML = `&#127891; 나의 학교 순위 <br/><span style="font-size:1rem; color:#555">(${school})</span>`;
}
async function loadSchoolRank() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/memory_scores?select=school,score`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  const data = await res.json();
  const schoolMap = {};

  data.forEach(entry => {
    const { school, score } = entry;
    if (!schoolMap[school]) schoolMap[school] = [];
    schoolMap[school].push(score);
  });

  const averages = Object.entries(schoolMap).map(([school, scores]) => ({
    school,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  })).sort((a, b) => b.avg - a.avg);

  const schoolBody = document.getElementById("school-body");
  schoolBody.innerHTML = "";

  averages.forEach((entry, i) => {
    const row = document.createElement("tr");
    if (entry.school === localStorage.getItem("school")) {
      row.classList.add("my-row");
    }
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${entry.school}</td>
      <td>${entry.avg}</td>
    `;
    schoolBody.appendChild(row);
  });
}