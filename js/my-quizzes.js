import { auth, get, quizzesDB } from './firebaseInit.js';

// Check user authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User is signed in:", user);

        //finishButton.addEventListener("click", () => addQuizToDatabase(user));
    } else {
        console.log("User is currently signed out");

        window.location.href = `log-in.html`;
    }
});

// Elements
const logoutMobile = document.getElementById("LogoutMobile");
const logoutDesktop = document.getElementById("LogoutDesktop");
const createQuizAnchor = document.getElementById("CreateNewQuizButton");
const loaderGif = document.getElementById("loader");

// Add event listener for logoutDesktop
logoutDesktop.addEventListener("click", () => {
    auth.signOut().then(() => {
        console.log("User signed out");
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});

// Add event listener for logoutMobile
logoutMobile.addEventListener("click", () => {
    auth.signOut().then(() => {
        console.log("User signed out");
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});

// Elements
const quizList = document.getElementById("QuizList");

// Function to retrieve quizzes and populate the list
const populateQuizList = async () => {
    try {
      // Assuming quizzesDB is a reference to the Firebase database
      const quizzesSnapshot = await get(quizzesDB);
  
      // Clear existing list items
      quizList.innerHTML = "";
  
      if (quizzesSnapshot.exists()) {
        quizzesSnapshot.forEach((quizSnapshot) => {
          const quizData = quizSnapshot.val();
  
          // Check if the quiz belongs to the current user
          if (quizData.creatorUID === auth.currentUser.uid) {
            // Create a list item using the provided template
            const listItem = document.createElement("li");
            listItem.classList.add("my-quizzes-li", "list-item");
  
            const titleElement = document.createElement("h1");
            titleElement.classList.add("my-quizzes-title");
            titleElement.textContent = quizData.title;
  
            const dateElement = document.createElement("span");
            dateElement.classList.add("my-quizzes-text16");
            let grammaticalNumber = "Terms";
            if(quizData.quizContent.length == 1) grammaticalNumber = "Term";
            let grammaticalNumber2 = "Likes";
            if(quizData.quizContent.length == 1) grammaticalNumber2 = "Like";
            dateElement.innerHTML = `<span>Created on ${quizData.creationDate}<br>Genre:&nbsp;${quizData.genre}, &nbsp;${quizData.quizContent.length}&nbsp;${grammaticalNumber}, ${quizData.likeCount}&nbsp;${grammaticalNumber2}</span>`;
  
            // Append elements to the list item
            listItem.appendChild(titleElement);
            listItem.appendChild(dateElement);
  
            // Add click event listener to the list item
            listItem.addEventListener("click", () => {
              // Redirect to the new page with the quiz ID
              window.location.href = `quiz.html?quizID=${quizSnapshot.key}`;
            });
  
            // Append the list item to the quiz list
            quizList.appendChild(listItem);
          }
        });
        createQuizAnchor.style.display = "block";
        loaderGif.style.display="none";
      }
      else{
        createQuizAnchor.style.display = "block";
        loaderGif.style.display="none";  
      }
    } catch (error) {
      createQuizAnchor.style.display = "block";
      loaderGif.style.display="none";
      console.error("Error retrieving quizzes:", error);
    }
  };
  

document.addEventListener("DOMContentLoaded", (event) => {
    // Your code here, for example:
    populateQuizList();
  });
  
