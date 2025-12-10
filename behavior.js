// behavior.js
// 功能：
// 1. 保留行為表 UI / 計分 / 動畫（依賴 main.js 的 store / TASKS / WEEKLY_GOAL）
// 2. 用 localStorage 的 username 當 Firebase 使用者 ID
// 3. 儲存今日紀錄到 Firestore：
//    users/{username}
//    users/{username}/dailyRecords/{date}
//    users/{username}/history/{autoId}

// ========== DOM 元素 ==========


const taskListEl = document.getElementById("task-list");
const noteEl = document.getElementById("note");
const saveBtn = document.getElementById("save-btn");
const todayPointsEl = document.getElementById("today-points");
const weekPointsEl = document.getElementById("week-points");
const weekPointsEl2 = document.getElementById("week-points-2");
const weeklyGoalLabel = document.getElementById("weekly-goal-label");
const weeklyGoalLabel2 = document.getElementById("weekly-goal-2");
const track = document.getElementById("track");
const walker = document.getElementById("walker");
const saveSound = document.getElementById("save-sound");


// 2️⃣ Debug 檢查（這段要放在 saveBtn 宣告之後）
console.log("saveBtn =", saveBtn);

if (saveBtn) {
  console.log("🎯 saveBtn 綁定 click 事件成功");
  saveBtn.addEventListener("click", saveTodayRecord);
} else {
  console.log("❌ saveBtn 抓不到");
}


// 顯示本週目標
weeklyGoalLabel.textContent = WEEKLY_GOAL;
weeklyGoalLabel2.textContent = WEEKLY_GOAL;

// 初始畫面
renderTasks();
updatePoints();
renderWalker();


// ========== 任務 UI 渲染 ==========

function renderTasks() {
  taskListEl.innerHTML = "";
  TASKS.forEach((t, idx) => {
    const doneToday = store.tasksDone[idx] === getToday();

    const row = document.createElement("div");
    row.className = "task";

    row.innerHTML = `
      <div class="left">
        <div class="name">${t.name}</div>
        <div class="points small muted">${t.points} 點</div>
      </div>
      <button ${doneToday ? "disabled" : ""}>
        ${doneToday ? "已完成" : `+${t.points}`}
      </button>
    `;

    row.querySelector("button")
      .addEventListener("click", () => markTask(idx));

    taskListEl.appendChild(row);
  });
}


// ========== 任務邏輯 ==========

function markTask(idx) {
  const t = TASKS[idx];

  if (store.tasksDone[idx] === getToday()) return;

  if (store.weeklyTotal + t.points > WEEKLY_GOAL) {
    alert(`加上此項會超過本週上限 ${WEEKLY_GOAL} 點`);
    return;
  }

  store.tasksDone[idx] = getToday();
  store.weeklyTotal += t.points;

  saveStore();
  renderTasks();
  updatePoints();
  renderWalker();
}


function updatePoints() {
  const today = getToday();
  const todayPoints = Object.keys(store.tasksDone).reduce((sum, k) => {
    return store.tasksDone[k] === today ? sum + TASKS[k].points : sum;
  }, 0);

  todayPointsEl.textContent = todayPoints;
  weekPointsEl.textContent = store.weeklyTotal;
  weekPointsEl2.textContent = store.weeklyTotal;
}


function renderWalker() {
  const trackWidth = Math.max(track.clientWidth - 48, 24);
  const ratio = Math.min(store.weeklyTotal / WEEKLY_GOAL, 1);
  walker.style.left = 8 + Math.round(trackWidth * ratio) + "px";
}


// ========== Firebase 相關 ==========

// 從 firebase.js 取得
const db = window.firebaseDB;
const fs = window.firestore;

function getUsername() {
  const name = localStorage.getItem("username");
  return name ? name.trim() : "";
}


// 綁定儲存事件
if (saveBtn) saveBtn.addEventListener("click", saveTodayRecord);


// ========== 儲存今日紀錄（本機 + Firestore） ==========
console.log("🚀 saveTodayRecord() 被呼叫！");

async function saveTodayRecord() {
  const username = getUsername();
  if (!username) {
    alert("找不到使用者名稱，請回登入頁輸入名稱");
    return;
  }

  const today = getToday();
  const note = noteEl.value.trim();

  // 今日完成的任務 index
  const actions = Object.keys(store.tasksDone)
    .filter((i) => store.tasksDone[i] === today)
    .map(Number);

  const points = actions.reduce((sum, i) => sum + TASKS[i].points, 0);

  // ===== 1️⃣ 本機儲存 =====
  store.history.unshift({
    date: today,
    actions,
    points,
    note,
    timestamp: new Date().toISOString()
  });

  saveStore();

  updatePoints();
  renderWalker();

  if (saveSound) {
    try {
      saveSound.currentTime = 0;
      saveSound.play();
    } catch {}
  }

  // ===== 2️⃣ Firestore 儲存 =====
  try {
    // (A) 使用者主文件
    await fs.setDoc(
      fs.doc(db, "users", username),
      {
        displayName: username,
        updatedAt: fs.serverTimestamp()
      },
      { merge: true }
    );

    // (B) 每日紀錄
    await fs.setDoc(
      fs.doc(db, "users", username, "dailyRecords", today),
      {
        date: today,
        username,
        points,
        note,
        savedAt: fs.serverTimestamp()
      },
      { merge: true }
    );

    // (C) 歷史流水帳
    await fs.addDoc(
      fs.collection(db, "users", username, "history"),
      {
        date: today,
        username,
        points,
        note,
        type: "daily_save",
        createdAt: fs.serverTimestamp()
      }
    );

    alert("已成功儲存（本機 + Firebase）！");
  } catch (err) {
    console.error("Firebase 寫入失敗：", err);
    alert("Firestore 寫入失敗，請查看 Console");
  }
}   
// =====================
//  將獎牌寫入 Firestore
//  路徑：users/{username}/medals/{autoId}
// =====================
async function saveMedalToFirebase(medal) {
  const username = localStorage.getItem("username")?.trim();
  if (!username) {
    console.error("無法寫入獎牌：找不到 username");
    return;
  }

  const db = window.firebaseDB;
  const fs = window.firestore;

  try {
    await fs.addDoc(
      fs.collection(db, "users", username, "medals"),
      {
        date: medal.date,            // 獎牌日期（你等一下會給）
        points: medal.points,        // 當週累積點數
        message: medal.message || "",// 自訂訊息（可空字串）
        createdAt: fs.serverTimestamp()
      }
    );
    console.log("🏅 Firebase：已寫入一枚獎牌", medal);
  } catch (err) {
    console.error("寫入獎牌到 Firebase 失敗：", err);
  }
}
