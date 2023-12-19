import { auth, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, push, get, usernamesDB, likesDB } from './firebaseInit.js';

// If directed here from a quiz, we remember that quiz so we can redirect back to it after signup
// Get the value of a query parameter from the URL
const getQueryParam = (name) => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get(name);
  };
  
const quizID = getQueryParam("quizID");
//console.log(quizID);

// Prevent premature redirect on login (prevent skipping persistence set)
let shouldRunOnAuthStateChanged = true;

// Check user authentication state
auth.onAuthStateChanged((user) => {
    if (user && shouldRunOnAuthStateChanged) {
        console.log("User is signed in:", user);
        redirectUser();
    } else {
        if(shouldRunOnAuthStateChanged == false)
        {
            console.log("Sign-in redirect blocked by user activity");       
        }
        else
        {
            console.log("User is currently signed out");
        }
        // Nothing happens, allow user to log in
    }
});

// Elements
const inputFieldUsername = document.getElementById("enterUsernameID");
const inputFieldEmail = document.getElementById("enterEmailID");
const inputFieldEnterPassword = document.getElementById("enterPasswordID");
const inputFieldReenterPassword = document.getElementById("reenterPasswordID");
const rememberMeCheckbox = document.getElementById("rememberMeID");
const signUpButton = document.getElementById("signUpButtonID");
const showPasswordCheckbox = document.getElementById("showPasswordID");
const eyeIcon = document.getElementById("eyeIcon");
const errorBox = document.getElementById("errorBox");

// Defaults
inputFieldEnterPassword.type = "password";
inputFieldReenterPassword.type = "password";

// Initialize usernamesList on page load
const usernamesList = [];

// Fetch usernames data on page load
const initializeUsernamesList = async () => {
    try {
        const usernamesSnapshot = await get(usernamesDB);

        if (usernamesSnapshot.exists()) {
            usernamesSnapshot.forEach((firebaseIdentifierSnapshot) => {
                const userUID = firebaseIdentifierSnapshot.child("userUID").val();
                const username = firebaseIdentifierSnapshot.child("username").val();
                
                //console.log("User UID:", userUID);
                //console.log("Username:", username);

                // add usernames to the usernamesList array
                usernamesList.push(username);
            });
        }
    } catch (error) {
        console.error("Error initializing usernames list:", error);
    }
};

// Call the initialization function when the page loads
window.addEventListener("load", initializeUsernamesList);

// Listeners
signUpButton.addEventListener("click", handleSignUp);

// Enter key
function handleKeyUpEvent(inputField, callback) {
    inputField.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            callback();
        }
    });
}

handleKeyUpEvent(inputFieldEnterPassword, handleSignUp);
handleKeyUpEvent(inputFieldReenterPassword, handleSignUp);
handleKeyUpEvent(inputFieldUsername, handleSignUp);
handleKeyUpEvent(inputFieldEmail, handleSignUp);

showPasswordCheckbox.addEventListener("change", function () {
    const passwordType = showPasswordCheckbox.checked ? "text" : "password";
    inputFieldEnterPassword.type = passwordType;
    inputFieldReenterPassword.type = passwordType;

  // Change the SVG content based on the checkbox state
    if (showPasswordCheckbox.checked) {
        eyeIcon.src = "media/eye.svg";
    } else {
        eyeIcon.src = "media/eyeslash.svg";
    }
});

// Function to handle sign up
function handleSignUp() 
{
    let username = inputFieldUsername.value.trim();
    let email = inputFieldEmail.value.trim();
    let password1 = inputFieldEnterPassword.value.trim();
    let password2 = inputFieldReenterPassword.value.trim();

    // Validation: Check for a valid username
    if (!username) {
        console.error("Please enter a username");
        showErrorBox("Please enter a username");
        return;
    }

    if (username.length < 4) {
        console.error("Username too short");
        showErrorBox("Username too short");
        return;
    }

    if (username.length > 15) {
        console.error("Username too long");
        showErrorBox("Username too long");
        return;
    }

    if (/^\s+$/.test(username)) {
        console.error("Please enter a username");
        showErrorBox("Please enter a username");
        return;
    }

    if (/\s/.test(username)) {
        console.error("No spaces in username.");
        showErrorBox("No spaces in username.");
        return;
    }

    if (usernamesList.includes(username)) {
        console.error("Username is already taken");
        showErrorBox("Username is already taken");
        return;
    }
    
    // Validation: Check if passwords match
    if (password1 !== password2) {
        console.error("Passwords do not match");
        showErrorBox("Passwords do not match");
        return;
    }

    // Validation: Check if the email is valid
    if (!isValidEmail(email)) {
        console.error("Invalid email");
        showErrorBox("Invalid email");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password1)
        .then((userCredential) => {
            // Signed up
            const user = userCredential.user;
            const useruid = user.uid;
            console.log("User created:", user);
            // Add user's username to database, linked to UID
            //replace with safe characters, double checked by data
            username = username.replaceAll('<','\uFF1C');
            username = username.replaceAll('>','\uFF1E');

            // Structure the quiz data
            const usernameData = {
                userUID: useruid,
                username: username,
            };
            
            push(usernamesDB, usernameData);
            // Stay Logged in Based on User Choice and redirect User to home page
            SetPersistenceAndRedirect();
        })
        .catch((error) => {
            let errorCode = error.code;
            const errorMessage = error.message;
            console.error("Error creating user:", errorCode, errorMessage);
            if(errorCode == "auth/email-already-in-use") errorCode = "Email already in use";
            if(errorCode == "auth/missing-password") errorCode = "Please enter password";
            if(errorCode == "auth/weak-password") errorCode = "Weak password";
            showErrorBox(errorCode);
        });
}

// Function to show the error box
function showErrorBox(message) 
{
    errorBox.textContent = message;
    errorBox.style.display = "block";
}

// Function to validate email format
function isValidEmail(email) 
{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function SetPersistenceAndRedirect()
{
    if(rememberMeCheckbox.checked)
    {
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                // Now the authentication state is persisted across browser sessions
                // ...
            })
            .catch((error) => {
                // Handle errors
                console.error(error.code, error.message);
            });
    }
    else
    {
        setPersistence(auth, browserSessionPersistence)
        .then(() => {
            // Now the authentication state is persisted within a session
            // ...
        })
        .catch((error) => {
            // Handle errors
            console.error(error.code, error.message);
        });
    }
    // Redirect to the desired page
    redirectUser();
}

function redirectUser() {
    if(quizID == null)
    {
        window.location.href = "index.html";
    }
    else{
        window.location.href = `quiz.html?quizID=${quizID}`;
    }
}
