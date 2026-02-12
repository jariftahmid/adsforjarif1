import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const signupBtn = document.getElementById("signupBtn");

signupBtn.onclick = async ()=>{
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if(!name || !email || !password) return alert("All fields required");

  const userCredential = await createUserWithEmailAndPassword(auth,email,password);
  const user = userCredential.user;

  // ✅ Save name + email to users collection
  await setDoc(doc(db,"users",user.uid),{
    name,
    email,
    totalPoints:0,
    role:"client"
  });

  alert("Signup successful!");
  window.location.href="client.html";
};
