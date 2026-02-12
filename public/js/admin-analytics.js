import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Daily starts chart
async function dailyChart(){
  const snap = await getDocs(collection(db,"taskRequests"));
  const days = {};
  snap.forEach(docSnap=>{
    const d = docSnap.data();
    if(d.createdAt){
      const day = d.createdAt.toDate().toLocaleDateString();
      days[day]=(days[day]||0)+1;
    }
  });

  new Chart(document.getElementById("dailyChart"),{
    type:"line",
    data:{
      labels:Object.keys(days),
      datasets:[{label:"Daily Starts",data:Object.values(days)}]
    }
  });
}

// Top earners chart
async function topChart(){
  const snap = await getDocs(collection(db,"users"));
  const names=[], points=[];
  snap.forEach(docSnap=>{
    const d=docSnap.data();
    names.push(d.name||d.email);
    points.push(d.totalPoints||0);
  });

  new Chart(document.getElementById("topChart"),{
    type:"bar",
    data:{
      labels:names,
      datasets:[{label:"Top Earners",data:points}]
    }
  });
}

dailyChart();
topChart();
