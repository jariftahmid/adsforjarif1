import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;

  const userCred = await signInWithEmailAndPassword(auth,email,pass);
  const token = await userCred.user.getIdTokenResult();
  if(token.claims.admin) window.location.href="admin.html";
  else window.location.href="client.html";
};
