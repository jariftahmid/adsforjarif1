import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const signupForm = document.getElementById("signupForm");

signupForm.onsubmit = async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Save name & email in users collection
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      totalPoints: 0,
      role: "client"
    });

    alert("Signup successful!");
    window.location.href = "client.html";

  } catch(error) {
    console.error(error);
    alert(error.message);
  }
};
