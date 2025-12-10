import "./firebase.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;
const { doc, getDoc, collection, getDocs, orderBy, query } = window.firestore;

// DOM 元素
const medalList = document.getElementById("medal-list");

// 登入後開始載入獎牌資料
window.onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("請先登入才能查看獎牌紀錄");
    window.location.href = "home.html";
    return;
  }
  loadMedals(user.uid);
});


// ===== 讀取獎牌 =====
async function loadMedals(uid) {
  medalList.innerHTML = "讀取中…";

  // (A) 讀取總獎牌數
  const userSnap = await getDoc(doc(db, "users", uid));
  const totalMedals = userSnap.exists() ? (userSnap.data().medals || 0) : 0;

  // (B) 讀取每次獲得獎牌的紀錄（可選功能）
  const q = query(
    collection(db, "users", uid, "medals"),
    orderBy("earnedAt", "desc")
  );

  const medalHistory = await getDocs(q);

  // 渲染畫面
  renderMedals(totalMedals, medalHistory.docs);
}


// ===== 產生 HTML =====
function renderMedals(total, docs) {
  medalList.innerHTML = `
    <div class="medal-summary">
      <h3>目前總獎牌數：🏅 <span>${total}</span> 面</h3>
      <hr>
    </div>
  `;

  if (docs.length === 0) {
    medalList.innerHTML += `<p>尚無獎牌紀錄</p>`;
    return;
  }

  docs.forEach(docSnap => {
    const data = docSnap.data();
    const time = data.earnedAt?.toDate().toLocaleString("zh-TW") ?? "未知時間";

    const item = document.createElement("div");
    item.className = "medal-item";
    item.innerHTML = `
      <div>🏅 <strong>${data.reason || "達成成就"}</strong></div>
      <div class="time">${time}</div>
      <hr>
    `;
    medalList.appendChild(item);
  });
}
