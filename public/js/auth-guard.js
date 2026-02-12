import { auth } from "./firebase.js";

export async function protectRoute(role){
  auth.onAuthStateChanged(async user=>{
    if(!user) return window.location.href="index.html";
    const token = await user.getIdTokenResult();
    if(role==="admin" && !token.claims.admin) window.location.href="index.html";
  });
}
