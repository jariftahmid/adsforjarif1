import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, doc, getDoc, addDoc, query, where, orderBy, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const greeting = document.getElementById("greeting");
const totalPointsEl = document.getElementById("totalPoints");
const tasksUl = document.getElementById("tasks");
const leaderboardBody = document.getElementById("leaderboard");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;
const taskReward = {
  "task1": 10,
  "task2": 20
};

/* ================= AUTH ================= */
onAuthStateChanged(auth, async (user)=>{
  if(!user) { window.location.href="index.html"; return; }
  currentUser = user;

  const userDoc = await getDoc(doc(db,"users",user.uid));
  if(userDoc.exists()){
    const data = userDoc.data();
    greeting.innerText = `Hi, ${data.name}`;
    totalPointsEl.innerText = data.totalPoints || 0;
  }

  setupTasks();
  loadLeaderboard();
});

/* ================= LOGOUT ================= */
logoutBtn.onclick = async ()=>{
  await signOut(auth);
  window.location.href="index.html";
};

/* ================= TASKS ================= */
function setupTasks(){
  const taskLis = tasksUl.querySelectorAll("li");
  taskLis.forEach(async li=>{
    const taskId = li.dataset.taskId;
    const joinBtn = li.querySelector(".joinBtn");
    const startBtn = li.querySelector(".startBtn");
    const timerSpan = li.querySelector(".timer");

    // Check if already joined
    const joinSnap = await getDocs(query(
      collection(db,"taskJoins"),
      where("userId","==",currentUser.uid),
      where("taskId","==",taskId)
    ));
    let joinData = null;
    joinSnap.forEach(d=>{ joinData = d.data(); });

    if(joinData){
      joinBtn.disabled = true;
      startBtn.disabled = false;
      setupTimer(new Date(joinData.joinTime.seconds*1000), timerSpan, startBtn);
    }

    // Join button
    joinBtn.onclick = async ()=>{
      const now = serverTimestamp();
      await addDoc(collection(db,"taskJoins"),{
        userId: currentUser.uid,
        taskId,
        joinTime: now
      });
      joinBtn.disabled = true;
      startBtn.disabled = false;
      setupTimer(new Date(), timerSpan, startBtn);
      alert("Task Joined! Start within 5 minutes.");
    };

    // Start button
    startBtn.onclick = async ()=>{
      // Check joinTime from Firebase
      const joinSnap2 = await getDocs(query(
        collection(db,"taskJoins"),
        where("userId","==",currentUser.uid),
        where("taskId","==",taskId)
      ));
      let joinedTime = null;
      joinSnap2.forEach(d=>{ joinedTime = d.data().joinTime.toDate(); });

      const diff = (new Date() - joinedTime)/1000/60; // minutes
      if(diff>5){ alert("You must start within 5 minutes of join!"); return; }

      // Save start to taskRequests
      await addDoc(collection(db,"taskRequests"),{
        userId: currentUser.uid,
        taskId,
        startTime: serverTimestamp(),
        points: taskReward[taskId]
      });

      // Update user points
      const userRef = doc(db,"users",currentUser.uid);
      const userSnap = await getDoc(userRef);
      const currentPoints = userSnap.data().totalPoints || 0;
      await userRef.update({ totalPoints: currentPoints + taskReward[taskId] });
      totalPointsEl.innerText = currentPoints + taskReward[taskId];

      alert(`Task Started! ${taskReward[taskId]} points added`);
      startBtn.disabled = true;

      // Open boardques.vercel.app
      window.open("https://boardques.vercel.app","_blank");
    };
  });
}

function setupTimer(joinTime, timerEl, startBtn){
  const endTime = new Date(joinTime.getTime() + 4*60*60*1000); // 4 hr
  const interval = setInterval(()=>{
    const now = new Date();
    const diff = endTime - now;
    if(diff<=0){
      timerEl.innerText = "Task expired";
      startBtn.disabled = true;
      clearInterval(interval);
      return;
    }
    const h = Math.floor(diff/1000/60/60);
    const m = Math.floor(diff/1000/60)%60;
    const s = Math.floor(diff/1000)%60;
    timerEl.innerText = `Time left: ${h}h ${m}m ${s}s`;
  },1000);
}

/* ================= LEADERBOARD ================= */
async function loadLeaderboard(){
  leaderboardBody.innerHTML = "";
  const snap = await getDocs(query(collection(db,"users"), orderBy("totalPoints","desc")));
  let rank=1;
  snap.forEach(d=>{
    const u = d.data();
    const tr=document.createElement("tr");
    tr.innerHTML = `<td>${rank++}</td><td>${u.name}</td><td>${u.totalPoints||0}</td>`;
    leaderboardBody.appendChild(tr);
  });
}
