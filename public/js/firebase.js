import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyAwvOeiC37x9R-tWh0do_aLqTPOmL1TRVI",
  authDomain: "jarif-38853.firebaseapp.com",
  projectId: "jarif-38853",
  storageBucket: "jarif-38853.firebasestorage.app",
  messagingSenderId: "954513621967",
  appId: "1:954513621967:web:c64b676b5ff8bd3389c8ba",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
