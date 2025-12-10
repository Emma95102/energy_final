// firebase.js
// 統一在這裡初始化 Firebase，並把需要的東西掛到 window 上，給其他 js 使用

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ✅ 這一段請直接用你 Firebase 控制台上的 Config
//   （你之前用過的那組可以直接貼進來）
const firebaseConfig = {
  apiKey: "AIzaSyC1j-dOgTlBdQR3Tpt5KehghPJfbRblcpM",
  authDomain: "energy-e1c4b.firebaseapp.com",
  projectId: "energy-e1c4b",
  storageBucket: "energy-e1c4b.firebasestorage.app",
  messagingSenderId: "349372717450",
  appId: "1:349372717450:web:161ebc5b0066a4acc89073",
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Firestore
const db = getFirestore(app);

// ⭐ 把 Firestore 相關東西掛到 window 上，其他檔案就可以用 window.firebaseDB / window.firestore
window.firebaseDB = db;
window.firestore = {
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
};

console.log("Firebase 已初始化，已掛載到 window.firebaseDB / window.firestore");
