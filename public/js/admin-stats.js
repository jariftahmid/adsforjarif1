import { db, functions } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

// Load task requests
async function loadRequests(){
  const snap = await getDocs(collection(db,"taskRequests"));
  const ul = document.getElementById("requests");
  ul.innerHTML="";
  snap.forEach(docSnap=>{
    const d = docSnap.data();
    if(d.status==="pending"){
      const li = document.createElement("li");
      li.innerHTML = `
        User: ${d.userId} | Task: ${d.taskId}
        <input type="number" placeholder="Points" id="p-${docSnap.id}">
        <button id="b-${docSnap.id}">Approve</button>
      `;
      ul.appendChild(li);

      document.getElementById(`b-${docSnap.id}`).onclick = async ()=>{
        const points = parseInt(document.getElementById(`p-${docSnap.id}`).value);
        const approve = httpsCallable(functions,"givePoints");
        await approve({ userId:d.userId, requestId:docSnap.id, points });
        loadRequests();
      }
    }
  });
}

loadRequests();

// Withdraw requests
async function loadWithdraws(){
  const snap = await getDocs(collection(db,"withdrawRequests"));
  const ul = document.getElementById("withdraws");
  ul.innerHTML="";
  snap.forEach(docSnap=>{
    const d = docSnap.data();
    const li=document.createElement("li");
    li.textContent=`User: ${d.userId} | Amount: ${d.amount} | Status: ${d.status}`;
    ul.appendChild(li);
  });
}

loadWithdraws();
