import { auth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail } from './firebaseInit.js';

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
const inputFieldEmail = document.getElementById("enterEmailID");
const inputFieldEnterPassword = document.getElementById("enterPasswordID");
const rememberMeCheckbox = document.getElementById("rememberMeID");
const loginButton = document.getElementById("loginButtonID");
const showPasswordCheckbox = document.getElementById("showPasswordID");
const eyeIcon = document.getElementById("eyeIcon");
const errorBox = document.getElementById("errorBox");
const forgotPasswordButton = document.getElementById("ForgotPassword");
const forgotPopup = document.getElementById("ForgotPopup");
const forgotEmailInput = document.getElementById("ForgotEmailInput");
const sendResetLink = document.getElementById("SendResetLink");
const closeForgotPassword = document.getElementById("CloseForgotPassword");
const resetEmailNotification = document.getElementById("ResetEmailNotification");
const resetEmailNotificationText = document.getElementById("ResetEmailNotificationText");

// Defaults
inputFieldEnterPassword.type = "password";

// Listeners
loginButton.addEventListener("click", handleLogin);
forgotPasswordButton.addEventListener("click", openPopup);
sendResetLink.addEventListener("click", sendLink);
closeForgotPassword.addEventListener("click", closePopup);

// Enter key
function handleKeyUpEvent(inputField, callback) {
    inputField.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            callback();
        }
    });
}
handleKeyUpEvent(inputFieldEnterPassword, handleLogin);
handleKeyUpEvent(inputFieldEmail, handleLogin);

// Hide/Show Password
showPasswordCheckbox.addEventListener("change", function () {
    const passwordType = showPasswordCheckbox.checked ? "text" : "password";
    inputFieldEnterPassword.type = passwordType;

  // Change the SVG content based on the checkbox state
    if (showPasswordCheckbox.checked) {
        eyeIcon.src = "media/eye.svg";
    } else {
        eyeIcon.src = "media/eyeslash.svg";
    }
});

// Handle Login Logic
function handleLogin() {
    // Set to false to prevent onAuthStateChanged from running after login detected
    shouldRunOnAuthStateChanged = false;

    let email = inputFieldEmail.value;
    let password = inputFieldEnterPassword.value;

    // Validation: Check if the email is valid
    if (!isValidEmail(email)) {
        console.error("Invalid email");
        showErrorBox("Invalid email");
        return;
    }

    // Log in to Firebase
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // User successfully logged in

            // Set User credentials
            const user = userCredential.user;
            console.log("User logged in:", user);

            // Stay Logged in Based on User Choice and redirect User to home page
            SetPersistenceAndRedirect();

        })
        .catch((error) => {
            // Handle login errors
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Error logging in:", errorCode, errorMessage);
            showErrorBox("Invalid email or password");
        });
}

// Function to show the error box
function showErrorBox(message) {
    errorBox.textContent = message;
    errorBox.style.display = "block";
}

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Stay Logged in Based on User Choice
function SetPersistenceAndRedirect()
{
    if(rememberMeCheckbox.checked)
    {
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                // Now the authentication state is persisted across browser sessions
                // Stay logged in
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
            // Now the authentication state is persisted within a single session
            // ...
        })
        .catch((error) => {
            // Handle errors
            console.error(error.code, error.message);
        });
    }
    //console.log("SetPersistence done");
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

function sendLink() {
    console.log("forgot password clicked");
    // Admin SDK API to generate the password reset link.
    const userEmail = forgotEmailInput.value.trim();

    if (!isValidEmail(userEmail)) {
        console.error("Invalid email");
        resetEmailNotificationText.textContent = "Invalid Email";
        resetEmailNotification.style.backgroundColor = "#d81c1c";
        resetEmailNotification.style.display = "block";
        return;
    }

    sendPasswordResetEmail(auth, userEmail).then(() => {
        resetEmailNotificationText.textContent = "Email Sent!";
        resetEmailNotification.style.backgroundColor = "#249b3e";
        resetEmailNotification.style.display = "block";
        console.log('email sent!');
      }).catch(function(error) {
        resetEmailNotificationText.textContent = "An Error Occurred";
        resetEmailNotification.style.backgroundColor = "#d81c1c";
        resetEmailNotification.style.display = "block";
      });
}

function openPopup() {
    overlay.style.display = 'block';
    forgotPopup.style.display = 'flex';
}

function closePopup() {
    overlay.style.display = 'none';
    forgotPopup.style.display = 'none';
    resetEmailNotification.style.display = "none";
}

