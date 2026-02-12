import { auth, db, functions } from "./firebase.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

// Load users
async function loadUsers(){
  const snap = await getDocs(collection(db,"users"));
  const tbody = document.getElementById("usersTable");
  tbody.innerHTML = "";

  snap.forEach(docSnap=>{
    const d = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.name||""}</td>
      <td>${d.email}</td>
      <td>${d.role}</td>
      <td>${d.totalPoints||0}</td>
      <td><button data-id="${docSnap.id}" data-role="${d.role}">Toggle</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll("button[data-id]").forEach(btn=>{
    btn.onclick = async ()=>{
      const uid = btn.dataset.id;
      const role = btn.dataset.role;
      const toggle = httpsCallable(functions,"toggleUserRole");
      await toggle({ uid, newRole: role==="admin"?"client":"admin" });
      loadUsers();
    }
  });
}

loadUsers();

// Search user
document.getElementById("searchEmail").oninput = async (e)=>{
  const val = e.target.value;
  const q = query(collection(db,"users"), where("email","==",val));
  const snap = await getDocs(q);
  const tbody = document.getElementById("usersTable");
  tbody.innerHTML="";
  snap.forEach(docSnap=>{
    const d = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.name}</td><td>${d.email}</td><td>${d.role}</td><td>${d.totalPoints}</td><td></td>`;
    tbody.appendChild(tr);
  });
}

// Export CSV
document.getElementById("exportCSV").onclick = async ()=>{
  const snap = await getDocs(collection(db,"users"));
  let csv="Name,Email,Role,Points\n";
  snap.forEach(docSnap=>{
    const d=docSnap.data();
    csv+=`${d.name||""},${d.email||""},${d.role||""},${d.totalPoints||0}\n`;
  });
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download="users.csv"; a.click();
}
