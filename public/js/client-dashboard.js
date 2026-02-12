import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, doc, getDoc, addDoc, query, where, orderBy, getDocs, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const greeting = document.getElementById("greeting");
const totalPointsEl = document.getElementById("totalPoints");
const tasksUl = document.getElementById("tasks");
const leaderboardBody = document.getElementById("leaderboard");
const withdrawBtn = document.getElementById("withdrawBtn");
const withdrawAmount = document.getElementById("withdrawAmount");
const myWithdraws = document.getElementById("myWithdraws");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;
const taskReward = { "task1": 10, "task2": 20 };

onAuthStateChanged(auth, async (user)=>{
  if(!user){ window.location.href="index.html"; return; }
  currentUser = user;

  const userDoc = await getDoc(doc(db,"users",user.uid));
  if(userDoc.exists()){
    const data = userDoc.data();
    greeting.innerText = `Hi, ${data.name}`;
    totalPointsEl.innerText = data.totalPoints || 0;
  }

  setupTasks();
  loadLeaderboard();
  loadWithdraws();
});

logoutBtn.onclick = async ()=>{ await signOut(auth); window.location.href="index.html"; };

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
    joinSnap.forEach(d=> joinData=d.data());

    if(joinData){
      joinBtn.disabled = true;
      startBtn.disabled = false;
      setupTimer(new Date(joinData.joinTime.seconds*1000), timerSpan, startBtn);
    }

    joinBtn.onclick = async ()=>{
      const now = serverTimestamp();
      await addDoc(collection(db,"taskJoins"),{ userId:currentUser.uid, taskId, joinTime:now });
      joinBtn.disabled=true;
      startBtn.disabled=false;
      setupTimer(new Date(), timerSpan, startBtn);
      alert("Task Joined! Start within 5 minutes.");
    };

    startBtn.onclick = async ()=>{
      const joinSnap2 = await getDocs(query(
        collection(db,"taskJoins"),
        where("userId","==",currentUser.uid),
        where("taskId","==",taskId)
      ));
      let joinedTime = null;
      joinSnap2.forEach(d=>{ joinedTime = d.data().joinTime.toDate(); });

      const diff = (new Date() - joinedTime)/1000/60;
      if(diff>5){ alert("You must start within 5 minutes of join!"); return; }

      await addDoc(collection(db,"taskRequests"),{
        userId:currentUser.uid,
        taskId,
        startTime:serverTimestamp(),
        points:taskReward[taskId]
      });

      const userRef = doc(db,"users",currentUser.uid);
      const userSnap = await getDoc(userRef);
      const currentPoints = userSnap.data().totalPoints||0;
      await updateDoc(userRef,{ totalPoints: currentPoints + taskReward[taskId] });
      totalPointsEl.innerText = currentPoints + taskReward[taskId];

      alert(`Task Started! ${taskReward[taskId]} points added`);
      startBtn.disabled = true;
      window.open("https://boardques.vercel.app","_blank");
    };
  });
}

function setupTimer(joinTime, timerEl, startBtn){
  const endTime = new Date(joinTime.getTime() + 4*60*60*1000);
  const interval = setInterval(()=>{
    const now = new Date();
    const diff = endTime - now;
    if(diff<=0){ timerEl.innerText="Task expired"; startBtn.disabled=true; clearInterval(interval); return; }
    const h=Math.floor(diff/1000/60/60);
    const m=Math.floor(diff/1000/60)%60;
    const s=Math.floor(diff/1000)%60;
    timerEl.innerText=`Time left: ${h}h ${m}m ${s}s`;
  },1000);
}

async function loadLeaderboard(){
  leaderboardBody.innerHTML="";
  const snap = await getDocs(query(collection(db,"users"), orderBy("totalPoints","desc")));
  let rank=1;
  snap.forEach(d=>{
    const u=d.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${rank++}</td><td>${u.name}</td><td>${u.totalPoints||0}</td>`;
    leaderboardBody.appendChild(tr);
  });
}

withdrawBtn.onclick = async ()=>{
  const amount = parseInt(withdrawAmount.value);
  if(!amount||amount<=0) return alert("Invalid amount");
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

async function loadWithdraws(){
  myWithdraws.innerHTML="";
  const snap = await getDocs(query(collection(db,"withdrawRequests"), where("userId","==",currentUser.uid), orderBy("time","desc")));
  snap.forEach(d=>{
    const w=d.data();
    const li=document.createElement("li");
    li.innerText=`${w.amount} pts - ${w.status}`;
    myWithdraws.appendChild(li);
  });
}
