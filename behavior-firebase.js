import "./firebase.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;
const { doc, setDoc, getDoc, addDoc, collection, serverTimestamp, updateDoc, increment } = window.firestore;

let currentUser = null;

window.onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("請先登入才能使用行為表！");
    window.location.href = "home.html";
    return;
  }
  currentUser = user;
  console.log("登入使用者：", user.displayName);
});


// 取得登入使用者名稱
function getUsername() {
  const name = localStorage.getItem("username");
  return name ? name.trim() : "";
}

// 綁定「儲存今天」按鈕
document.getElementById("save-btn")?.addEventListener("click", saveTodayToFirebase);

async function saveTodayToFirebase() {
  const username = getUsername();
  if (!username) {
    alert("請先登入，找不到使用者名稱！");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const points = Number(document.getElementById("today-points")?.textContent || 0);
  const note = document.getElementById("note")?.value || "";

  try {
    // 0️⃣ 確保 users/{username} 文件存在
    await setDoc(
      doc(db, "users", username),
      {
        displayName: username,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    // 1️⃣ 寫入 dailyRecords
    await setDoc(
      doc(db, "users", username, "dailyRecords", today),
      {
        date: today,
        points: points,
        note: note,
        createdAt: serverTimestamp()
      },
      { merge: true }
    );

    // 2️⃣ 寫入 history
    await addDoc(
      collection(db, "users", username, "history"),
      {
        date: today,
        points: points,
        note: note,
        createdAt: serverTimestamp()
      }
    );

    alert("已成功儲存到 Firebase！");
  } catch (e) {
    console.error(e);
    alert("寫入 Firebase 失敗，請檢查 console。");
  }
}
