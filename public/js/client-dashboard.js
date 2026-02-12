import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const greeting = document.getElementById("greeting");
const totalPointsEl = document.getElementById("totalPoints");
const tasksUl = document.getElementById("tasks");
const leaderboardBody = document.getElementById("leaderboard");
const withdrawBtn = document.getElementById("withdrawBtn");
const withdrawAmount = document.getElementById("withdrawAmount");
const myWithdraws = document.getElementById("myWithdraws");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;

/* ================= AUTH ================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUser = user;

  // Get user profile
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    const data = userDoc.data();
    greeting.innerText = `Hi, ${data.name}`;
    totalPointsEl.innerText = data.points || 0;
  }

  loadTasks();
  loadLeaderboard();
  loadWithdraws();
});

/* ================= LOGOUT ================= */

logoutBtn.onclick = async () => {
  await signOut(auth);
  window.location.href = "login.html";
};

/* ================= TASKS ================= */

async function loadTasks() {
  tasksUl.innerHTML = "";

  const snap = await getDocs(collection(db, "tasks"));

  snap.forEach(docu => {
    const t = docu.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <b>${t.title}</b><br>
      Reward: ${t.points} pts<br>
      <button class="joinBtn">Join</button>
      <button class="startBtn">Start</button>
    `;

    const joinBtn = li.querySelector(".joinBtn");
    const startBtn = li.querySelector(".startBtn");

    joinBtn.onclick = async () => {
      await addDoc(collection(db, "taskJoins"), {
        userId: currentUser.uid,
        taskId: docu.id,
        status: "joined",
        time: serverTimestamp()
      });
      alert("Task Joined!");
    };

    startBtn.onclick = async () => {
      await addDoc(collection(db, "taskRequests"), {
        userId: currentUser.uid,
        taskId: docu.id,
        status: "started",
        time: serverTimestamp()
      });
      alert("Task Started!");
    };

    tasksUl.appendChild(li);
  });
}

/* ================= LEADERBOARD ================= */

async function loadLeaderboard() {
  leaderboardBody.innerHTML = "";

  const q = query(collection(db, "users"), orderBy("points", "desc"));
  const snap = await getDocs(q);

  let rank = 1;
  snap.forEach(d => {
    const u = d.data();
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${rank++}</td>
      <td>${u.name}</td>
      <td>${u.points || 0}</td>
    `;

    leaderboardBody.appendChild(tr);
  });
}

/* ================= WITHDRAW ================= */

withdrawBtn.onclick = async () => {
  const amount = parseInt(withdrawAmount.value);
  if (!amount || amount <= 0) return alert("Invalid amount");

  await addDoc(collection(db, "withdrawRequests"), {
    userId: currentUser.uid,
    amount,
    status: "pending",
    time: serverTimestamp()
  });

  alert("Withdraw Request Sent!");
  withdrawAmount.value = "";
  loadWithdraws();
};

/* ================= MY WITHDRAWS ================= */

async function loadWithdraws() {
  myWithdraws.innerHTML = "";

  const q = query(
    collection(db, "withdrawRequests"),
    where("userId", "==", currentUser.uid),
    orderBy("time", "desc")
  );

  const snap = await getDocs(q);

  snap.forEach(d => {
    const w = d.data();
    const li = document.createElement("li");
    li.innerText = `${w.amount} pts - ${w.status}`;
    myWithdraws.appendChild(li);
  });
}
