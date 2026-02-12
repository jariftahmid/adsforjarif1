import { db } from "./firebase.js";
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const dailyCtx = document.getElementById("dailyStartsChart").getContext("2d");
const topCtx = document.getElementById("topEarnersChart").getContext("2d");
const dateFilter = document.getElementById("dateFilter");

let dailyChart = null;
let topChart = null;

dateFilter.onchange = ()=>loadCharts(dateFilter.value);

async function loadCharts(filter){
  // 1️⃣ Calculate start date
  const now = new Date();
  let startDate;
  if(filter==="week"){
    const day = now.getDay(); // 0=Sun
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  } else if(filter==="month"){
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // 2️⃣ Fetch taskRequests after startDate
  const q = query(collection(db,"taskRequests"), where("startTime",">=", startDate));
  const snap = await getDocs(q);
  
  const dailyCounts = {}; // key = date string YYYY-MM-DD, value=count
  const userPoints = {}; // key = userId, value=points

  snap.forEach(d=>{
    const r = d.data();
    const dateStr = r.startTime.toDate().toISOString().split("T")[0];
    dailyCounts[dateStr] = (dailyCounts[dateStr]||0)+1;
    userPoints[r.userId] = (userPoints[r.userId]||0) + r.points;
  });

  // 3️⃣ Prepare data for line chart
  const labels = [];
  const data = [];
  let tempDate = new Date(startDate);
  while(tempDate <= now){
    const dStr = tempDate.toISOString().split("T")[0];
    labels.push(dStr);
    data.push(dailyCounts[dStr]||0);
    tempDate.setDate(tempDate.getDate()+1);
  }

  if(dailyChart) dailyChart.destroy();
  dailyChart = new Chart(dailyCtx,{
    type:"line",
    data:{
      labels,
      datasets:[{
        label:"Daily Task Starts",
        data,
        borderColor:"blue",
        backgroundColor:"lightblue",
        fill:true
      }]
    },
    options:{responsive:true}
  });

  // 4️⃣ Prepare top earners data
  const topUsersSnap = await getDocs(collection(db,"users"));
  const userMap = {};
  topUsersSnap.forEach(d=>{ userMap[d.id] = d.data().name; });
  const sortedUsers = Object.entries(userPoints).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const topLabels = sortedUsers.map(u=>userMap[u[0]]||u[0]);
  const topData = sortedUsers.map(u=>u[1]);

  if(topChart) topChart.destroy();
  topChart = new Chart(topCtx,{
    type:"bar",
    data:{
      labels: topLabels,
      datasets:[{
        label:"Points Earned",
        data: topData,
        backgroundColor:"orange"
      }]
    },
    options:{responsive:true}
  });
}

// Initial load
loadCharts(dateFilter.value);
