import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, get, set, runTransaction, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhxbZfBhMDe54tJyO1dhVHJOx3CNW0H7g",
  authDomain: "studybuddy-94158.firebaseapp.com",
  projectId: "studybuddy-94158",
  storageBucket: "studybuddy-94158.appspot.com",
  messagingSenderId: "86479498232",
  appId: "1:86479498232:web:648218dbb342133259840d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase(app);

// Databases
const usernamesDB = ref(database, "usernames");
const quizzesDB = ref(database, "quizzes");
const likesDB = ref(database, "likes");

// Export to other scripts
export { 
    auth, push, get, set, ref, runTransaction, getAuth, app, remove, 
    usernamesDB, quizzesDB, likesDB, database,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail,
    setPersistence, browserSessionPersistence, browserLocalPersistence };