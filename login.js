// login.js
// 功能：輸入使用者名稱 → 存 localStorage → 寫入 Firestore users/{username} → 導向首頁

// ✅ 1. 載入 Firebase SDK（使用 CDN 模組版）
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ 2. 你的 Firebase 專案設定（請改成你自己的值）
const firebaseConfig = {
  apiKey: "AIzaSyC1j-dOgTlBdQR3Tpt5KehghPJfbRblcpM",
  authDomain: "energy-e1c4b.firebaseapp.com",
  projectId: "energy-e1c4b",
  storageBucket: "energy-e1c4b.firebasestorage.app",
  messagingSenderId: "349372717450",
  appId: "1:349372717450:web:161ebc5b0066a4acc89073"
};

// ✅ 3. 初始化 Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ 4. 抓取畫面上的元素
const loginBtn = document.getElementById("login-btn");
const usernameInput = document.getElementById("username");

// 綁定按鈕事件
loginBtn.addEventListener("click", handleLogin);

async function handleLogin() {
  const name = (usernameInput.value || "").trim();

  if (!name) {
    alert("請先輸入使用者名稱再開始使用。");
    return;
  }

  // 1️⃣ 存在 localStorage，其他頁面會用到
  localStorage.setItem("username", name);

  try {
    // 2️⃣ 在 Firestore 建立 / 更新 users/{username} 文件
    await setDoc(
      doc(db, "users", name),
      {
        displayName: name,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 3️⃣ 導到首頁（或改成 behavior.html 也可以）
    alert("歡迎回來，" + name + "！");
    window.location.href = "home.html";
  } catch (err) {
    console.error("寫入使用者資料失敗：", err);
    alert("寫入使用者資料失敗，請查看 Console。");
  }
}
