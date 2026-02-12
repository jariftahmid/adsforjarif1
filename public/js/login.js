import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;

  const userCred = await signInWithEmailAndPassword(auth,email,pass);

  // 🔥 Firestore admin check
  const adminDoc = await getDoc(doc(db,"admins",email));

  if(adminDoc.exists()){
    window.location.href="admin.html";
  }else{
    window.location.href="client.html";
  }
};
