import { auth } from './firebaseInit.js';

const signUpDesktop = document.getElementById("signUpDesktop");
const loginDesktop = document.getElementById("loginDesktop");
const logoutDesktop = document.getElementById("logoutDesktop");

const signUpMobile = document.getElementById("signUpMobile");
const loginMobile = document.getElementById("loginMobile");
const logoutMobile = document.getElementById("logoutMobile");

// Check user authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User is signed in:", user);
        // User is signed in, show logout buttons, hide login/signup buttons
        signUpDesktop.style.display = "none";
        loginDesktop.style.display = "none";
        logoutDesktop.style.display = "inline-block";

        signUpMobile.style.display = "none";
        loginMobile.style.display = "none";
        logoutMobile.style.display = "inline-block";
    } else {
        console.log("User is signed out");
        // User is signed out, show login/signup buttons, hide logout buttons
        signUpDesktop.style.display = "block";
        loginDesktop.style.display = "block";
        logoutDesktop.style.display = "none";

        signUpMobile.style.display = "block";
        loginMobile.style.display = "block";
        logoutMobile.style.display = "none";
    }
});