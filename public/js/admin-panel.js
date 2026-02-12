import { auth, db } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const logoutBtn = document.getElementById("logoutBtn");
const usersBody = document.getElementById("usersBody");
const searchEmail = document.getElementById("searchEmail");
const searchBtn = document.getElementById("searchBtn");
const taskRequestsBody = document.getElementById("taskRequestsBody");
const withdrawBody = document.getElementById("withdrawBody");
const exportUsersBtn = document.getElementById("exportUsersBtn");
const exportRequestsBtn = document.getElementById("exportRequestsBtn");
const totalUsersEl = document.getElementById("totalUsers");
const totalStartsEl = document.getElementById("totalStarts");
const totalPointsEl = document.getElementById("totalPoints");

/* ================= LOGOUT ================= */
logoutBtn.onclick = async ()=>{
  await signOut(auth);
  window.location.href="login.html";
};

/* ================= USERS ================= */
async function loadUsers(emailFilter=""){
  usersBody.innerHTML="";
  let q;
  if(emailFilter){
    q = query(collection(db,"users"), where("email","==",emailFilter));
  } else {
    q = query(collection(db,"users"), orderBy("name"));
  }
  const snap = await getDocs(q);
  totalUsersEl.innerText = snap.size;
  snap.forEach(d=>{
    const u = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role||"client"}</td>
      <td>${u.totalPoints||0}</td>
      <td><button class="toggleBtn">Toggle Role</button></td>
    `;
    tr.querySelector(".toggleBtn").onclick = async ()=>{
      const newRole = u.role==="admin"?"client":"admin";
      await updateDoc(doc(db,"users",d.id), {role:newRole});
      loadUsers(emailFilter);
    };
    usersBody.appendChild(tr);
  });
}

searchBtn.onclick = ()=>{ loadUsers(searchEmail.value); };

/* ================= TASK REQUESTS ================= */
async function loadTaskRequests(){
  taskRequestsBody.innerHTML="";
  const snap = await getDocs(query(collection(db,"taskRequests"), orderBy("startTime","desc")));
  let totalStarts = 0;
  let totalPoints = 0;
  snap.forEach(d=>{
    const r = d.data();
    totalStarts++;
    totalPoints += r.points;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.userId}</td><td>${r.taskId}</td><td>${r.points}</td><td>${r.startTime.toDate()}</td>`;
    taskRequestsBody.appendChild(tr);
  });
  totalStartsEl.innerText = totalStarts;
  totalPointsEl.innerText = totalPoints;
}

/* ================= WITHDRAW REQUESTS ================= */
async function loadWithdraws(){
  withdrawBody.innerHTML="";
  const snap = await getDocs(query(collection(db,"withdrawRequests"), orderBy("time","desc")));
  snap.forEach(d=>{
    const r = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.userId}</td><td>${r.amount}</td><td>${r.status}</td>
      <td>
        <button class="approveBtn">Approve</button>
        <button class="rejectBtn">Reject</button>
      </td>`;
    tr.querySelector(".approveBtn").onclick = async ()=>{
      await updateDoc(doc(db,"withdrawRequests",d.id),{status:"approved"});
      loadWithdraws();
    };
    tr.querySelector(".rejectBtn").onclick = async ()=>{
      await updateDoc(doc(db,"withdrawRequests",d.id),{status:"rejected"});
      loadWithdraws();
    };
    withdrawBody.appendChild(tr);
  });
}

/* ================= EXPORT ================= */
function downloadCSV(filename, rows){
  const csvContent = rows.map(r=>r.join(",")).join("\n");
  const blob = new Blob([csvContent], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

exportUsersBtn.onclick = async ()=>{
  const snap = await getDocs(collection(db,"users"));
  const rows = [["Name","Email","Role","Points"]];
  snap.forEach(d=>{
    const u=d.data();
    rows.push([u.name,u.email,u.role||"client",u.totalPoints||0]);
  });
  downloadCSV("users.csv",rows);
};

exportRequestsBtn.onclick = async ()=>{
  const snap = await getDocs(collection(db,"taskRequests"));
  const rows=[["UserId","TaskId","Points","Time"]];
  snap.forEach(d=>{
    const r=d.data();
    rows.push([r.userId,r.taskId,r.points,r.startTime.toDate()]);
  });
  downloadCSV("taskRequests.csv",rows);
};

/* ================= INITIAL LOAD ================= */
loadUsers();
loadTaskRequests();
loadWithdraws();
