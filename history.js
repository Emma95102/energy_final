// history.js
// 只負責：把本地的 store.history 顯示在歷史頁，並同步更新上方進度條

const historyListEl = document.getElementById("history-list");
const todayPointsEl = document.getElementById("today-points");
const weekPointsEl = document.getElementById("week-points");
const weekPointsEl2 = document.getElementById("week-points-2");
const track = document.getElementById("track");
const walker = document.getElementById("walker");
const medalNote = document.getElementById("medal-note");

let currentPage = 1;
const PAGE_SIZE = 8;

// =====================
//  渲染歷史紀錄（分頁）
// =====================
function renderHistoryPage(page = 1) {
  if (!historyListEl) return;
  if (typeof store === "undefined") return;

  const list = store.history || [];

  historyListEl.innerHTML = "";

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, page), totalPages);

  const slice = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (slice.length === 0) {
    historyListEl.innerHTML = "<p class='muted'>尚無歷史紀錄</p>";
  } else {
    slice.forEach((item) => {
      const div = document.createElement("div");
      div.className = "history-item";

      const names =
        (item.actions || []).map((i) => TASKS[i]?.name || "").filter(Boolean).join("、") || "（無）";

      div.innerHTML = `
        <div class="date">${item.date} — ${item.points || 0} 點</div>
        <div class="muted">行為：${names}</div>
        <div class="muted">備註：${item.note || "（無）"}</div>
      `;

      historyListEl.appendChild(div);
    });
  }

  const pageInfoEl = document.getElementById("page-info");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");

  if (pageInfoEl) {
    pageInfoEl.textContent = `第 ${currentPage} 頁 / ${totalPages} 頁`;
  }
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

// =====================
//  確保今天有同步到 history
// =====================
function ensureTodayInHistory() {
  // 若 main.js 有提供初始化函式，就先呼叫
  if (typeof window.initializeTodayStore === "function") {
    window.initializeTodayStore();
  }

  if (typeof store === "undefined") return;

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const list = store.history || [];

  const todayData = store.today || {};
  const points = todayData.points || 0;
  const actions = todayData.actions || [];
  const note = todayData.note || "";

  // 完全沒資料就不動 history
  if (points === 0 && actions.length === 0 && !note) {
    return;
  }

  const todayIndex = list.findIndex((item) => item.date === today);
  const todayRecord = { date: today, points, actions, note };

  if (todayIndex >= 0) {
    list[todayIndex] = todayRecord;
  } else {
    list.unshift(todayRecord);
  }

  store.history = list;
  // 這個 key 要跟 main.js 一致（你原本就是 energy_tracker_v4）
  localStorage.setItem("energy_tracker_v4", JSON.stringify(store));
}

// =====================
//  分頁按鈕綁定
// =====================
document.getElementById("prev-page")?.addEventListener("click", () =>
  renderHistoryPage(currentPage - 1)
);
document.getElementById("next-page")?.addEventListener("click", () =>
  renderHistoryPage(currentPage + 1)
);

// =====================
//  初始化：補今天紀錄 + 畫畫面 + 更新上方分數與走路動畫
// =====================
ensureTodayInHistory();
renderHistoryPage();

if (typeof updatePoints === "function") {
  updatePoints();
}
if (typeof renderWalker === "function") {
  renderWalker();
}
