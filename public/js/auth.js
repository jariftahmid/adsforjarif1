import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Elements
const loginDiv = document.getElementById("loginFormDiv");
const signupDiv = document.getElementById("signupFormDiv");
const formTitle = document.getElementById("formTitle");

const showSignupLink = document.getElementById("showSignup");
const showLoginLink = document.getElementById("showLogin");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");

const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupBtn = document.getElementById("signupBtn");

// Toggle forms
showSignupLink.onclick = (e)=>{
  e.preventDefault();
  loginDiv.style.display="none";
  signupDiv.style.display="block";
  formTitle.innerText="Sign Up";
};

showLoginLink.onclick = (e)=>{
  e.preventDefault();
  loginDiv.style.display="block";
  signupDiv.style.display="none";
  formTitle.innerText="Login";
};

// Signup
signupBtn.onclick = async ()=>{
  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;

  if(!name || !email || !password) return alert("All fields required");

  try{
    const userCredential = await createUserWithEmailAndPassword(auth,email,password);
    const user = userCredential.user;

    // Save name/email in users collection
    await setDoc(doc(db,"users",user.uid),{
      name,
      email,
      totalPoints:0,
      role:"client"
    });

    alert("Signup successful!");
    window.location.href="client.html";

  }catch(err){
    console.error(err);
    alert(err.message);
  }
};

// Login
loginBtn.onclick = async ()=>{
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if(!email || !password) return alert("Both fields required");

  try{
    const userCredential = await signInWithEmailAndPassword(auth,email,password);
    const user = userCredential.user;

    // Check if admin
    const adminEmail = "jariftahmid10@gmail.com";
    if(user.email === adminEmail){
      window.location.href="admin.html";
    }else{
      window.location.href="client.html";
    }

  }catch(err){
    console.error(err);
    alert(err.message);
  }
};

// Auto redirect if already logged in
onAuthStateChanged(auth,user=>{
  if(user){
    const adminEmail = "jariftahmid10@gmail.com";
    if(user.email === adminEmail){
      window.location.href="admin.html";
    }else{
      window.location.href="client.html";
    }
  }
});
