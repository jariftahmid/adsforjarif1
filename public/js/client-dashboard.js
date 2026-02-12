import { auth, db } from "./firebase.js";
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Load greeting and total points
async function loadUser(){
  const docSnap = await getDoc(doc(db,"users",auth.currentUser.uid));
  const data = docSnap.data();
  document.getElementById("greeting").textContent = `Hi, ${data.name}`;
  document.getElementById("totalPoints").textContent = data.totalPoints || 0;
}

loadUser();

// Load leaderboard
async function loadLeaderboard(){
  const snap = await getDocs(query(collection(db,"users"), orderBy("totalPoints","desc"), limit(10)));
  const tbody = document.getElementById("leaderboard");
  tbody.innerHTML = "";
  let rank = 1;
  snap.forEach(docSnap=>{
    const data = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${rank}</td><td>${data.name||data.email}</td><td>${data.totalPoints||0}</td>`;
    tbody.appendChild(tr);
    rank++;
  });
}

loadLeaderboard();

// Withdraw system
document.getElementById("withdrawBtn").onclick = async () => {
  const amount = parseInt(document.getElementById("withdrawAmount").value);
  if(!amount || amount<=0) return alert("Enter valid points");
  await addDoc(collection(db,"withdrawRequests"),{
    userId: auth.currentUser.uid,
    amount,
    status: "pending",
    createdAt: serverTimestamp()
  });
  loadWithdrawRequests();
}

async function loadWithdrawRequests(){
  const snap = await getDocs(query(collection(db,"withdrawRequests"), where("userId","==",auth.currentUser.uid)));
  const ul = document.getElementById("myWithdraws");
  ul.innerHTML = "";
  snap.forEach(docSnap=>{
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `Amount: ${data.amount}, Status: ${data.status}`;
    ul.appendChild(li);
  });
}

loadWithdrawRequests();
