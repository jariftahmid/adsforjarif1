import { auth, db } from "./firebase.js";
import { 
  onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  collection, getDocs, getDoc, doc, addDoc, updateDoc, query, orderBy, where, serverTimestamp 
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
onAuthStateChanged(auth, async (user)=>{
  if(!user){
    window.location.href="login.html";
    return;
  }
  currentUser = user;

  const userDoc = await getDoc(doc(db,"users",user.uid));
  if(userDoc.exists()){
    const data = userDoc.data();
    greeting.innerText = `Hi, ${data.name}`;
    totalPointsEl.innerText = data.totalPoints || 0;
  }

  loadTasks();
  loadLeaderboard();
  loadWithdraws();
});

/* ================= LOGOUT ================= */
logoutBtn.onclick = async ()=>{
  await signOut(auth);
  window.location.href="login.html";
};

/* ================= TASKS ================= */
async function loadTasks(){
  tasksUl.innerHTML = "";
  const snap = await getDocs(collection(db,"tasks"));

  snap.forEach(async (docu)=>{
    const t = docu.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <b>${t.title}</b> | Reward: ${t.points} pts <br>
      <span class="timer" style="color:green"></span><br>
      <button class="joinBtn">Join</button>
      <button class="startBtn" disabled>Start</button>
    `;

    const joinBtn = li.querySelector(".joinBtn");
    const startBtn = li.querySelector(".startBtn");
    const timerSpan = li.querySelector(".timer");

    // Check if user already joined this task
    const joinSnap = await getDocs(query(
      collection(db,"taskJoins"),
      where("userId","==",currentUser.uid),
      where("taskId","==",docu.id)
    ));

    let joinData = null;
    joinSnap.forEach(d=>{
      joinData = d.data();
    });

    // If joined, start timer
    if(joinData){
      joinBtn.disabled = true;
      startBtn.disabled = false;

      const joinTime = joinData.joinTime.toDate();
      setupTimer(joinTime, timerSpan, startBtn);
    }

    // Join Button
    joinBtn.onclick = async ()=>{
      const now = serverTimestamp();
      const joinDocRef = await addDoc(collection(db,"taskJoins"),{
        userId: currentUser.uid,
        taskId: docu.id,
        status:"joined",
        joinTime: now
      });
      alert("Task Joined! Start within 5 minutes.");
      joinBtn.disabled = true;
      startBtn.disabled = false;

      // setup timer
      setupTimer(new Date(), timerSpan, startBtn);
    };

    // Start Button
    startBtn.onclick = async ()=>{
      // Check if join within 5 min
      const joinSnap2 = await getDocs(query(
        collection(db,"taskJoins"),
        where("userId","==",currentUser.uid),
        where("taskId","==",docu.id)
      ));
      let joinedTime = null;
      joinSnap2.forEach(d=>{ joinedTime = d.data().joinTime.toDate(); });

      const diff = (new Date() - joinedTime)/1000/60; // in minutes
      if(diff>5){
        alert("You must start within 5 minutes of join!");
        return;
      }

      await addDoc(collection(db,"taskRequests"),{
        userId: currentUser.uid,
        taskId: docu.id,
        status:"started",
        startTime:serverTimestamp(),
        points:t.points
      });

      alert("Task Started! Admin will add points later.");
      startBtn.disabled = true;
    };

    tasksUl.appendChild(li);
  });
}

// Setup 4 hour countdown timer
function setupTimer(joinTime, timerEl, startBtn){
  const endTime = new Date(joinTime.getTime() + 4*60*60*1000); // 4hr
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
  const q = query(collection(db,"users"), orderBy("totalPoints","desc"));
  const snap = await getDocs(q);
  let rank=1;
  snap.forEach(d=>{
    const u=d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${rank++}</td><td>${u.name}</td><td>${u.totalPoints||0}</td>`;
    leaderboardBody.appendChild(tr);
  });
}

/* ================= WITHDRAW ================= */
withdrawBtn.onclick = async ()=>{
  const amount = parseInt(withdrawAmount.value);
  if(!amount || amount<=0) return alert("Invalid amount");

  await addDoc(collection(db,"withdrawRequests"),{
    userId:currentUser.uid,
    amount,
    status:"pending",
    time:serverTimestamp()
  });
  alert("Withdraw request sent");
  withdrawAmount.value="";
  loadWithdraws();
};

/* ================= MY WITHDRAWS ================= */
async function loadWithdraws(){
  myWithdraws.innerHTML="";
  const q = query(collection(db,"withdrawRequests"), where("userId","==",currentUser.uid), orderBy("time","desc"));
  const snap = await getDocs(q);
  snap.forEach(d=>{
    const w=d.data();
    const li=document.createElement("li");
    li.innerText = `${w.amount} pts - ${w.status}`;
    myWithdraws.appendChild(li);
  });
}
