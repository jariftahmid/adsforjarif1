import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.getElementById("signupBtn").onclick = async () => {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const pass = document.getElementById("signupPass").value;

  const userCred = await createUserWithEmailAndPassword(auth,email,pass);
  await setDoc(doc(db,"users",userCred.user.uid),{
    name,email,role:"client",totalPoints:0,createdAt:serverTimestamp()
  });
  alert("Signup successful");
};
