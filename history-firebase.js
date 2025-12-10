import "./firebase.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;
const { collection, getDocs, orderBy, query, limit, startAfter } = window.firestore;

// DOM
const historyList = document.getElementById("history-list");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

let currentUser = null;
let lastVisible = null;
let firstVisible = null;
let currentPage = 1;

// ====== 監聽登入狀態 ======
window.onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("請先登入才能查看歷史紀錄");
    window.location.href = "home.html";
    return;
  }
  currentUser = user;
  loadPage(1);
});


// ====== 分頁讀取歷史紀錄 ======
async function loadPage(page) {
  historyList.innerHTML = "讀取中…";

  const baseQuery = query(
    collection(db, "users", currentUser.uid, "history"),
    orderBy("timestamp", "desc"),
    limit(10)
  );

  let q = baseQuery;

  if (page > 1 && lastVisible) {
    q = query(baseQuery, startAfter(lastVisible));
  }

  const snap = await getDocs(q);

  if (snap.empty) {
    historyList.innerHTML = "<p>沒有更多紀錄了</p>";
    return;
  }

  // 更新可視範圍
  firstVisible = snap.docs[0];
  lastVisible = snap.docs[snap.docs.length - 1];

  renderHistory(snap.docs);
  currentPage = page;
  pageInfo.textContent = `第 ${currentPage} 頁`;
}


// ====== 產生 HTML ======
function renderHistory(docs) {
  historyList.innerHTML = "";

  docs.forEach(docSnap => {
    const data = docSnap.data();
    const time = data.timestamp?.toDate().toLocaleString("zh-TW") ?? "未知時間";

    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div><strong>${data.action}</strong></div>
      <div>${data.detail ?? ""}</div>
      <div class="time">${time}</div>
      <hr>
    `;

    historyList.appendChild(div);
  });
}


// ====== 上一頁 / 下一頁 ======
prevBtn.addEventListener("click", () => {
  if (currentPage === 1) return;
  currentPage--;
  loadPage(currentPage);
});

nextBtn.addEventListener("click", () => {
  currentPage++;
  loadPage(currentPage);
});
