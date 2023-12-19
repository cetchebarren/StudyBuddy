import { auth, get, remove, database, ref } from './firebaseInit.js';

// Check user authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User is signed in:", user);

        //finishButton.addEventListener("click", () => addQuizToDatabase(user));
        populateQuizList();
    } else {
        console.log("User is currently signed out");

        window.location.href = `log-in.html`;
    }
});

// Elements
const logoutMobile = document.getElementById("LogoutMobile");
const logoutDesktop = document.getElementById("LogoutDesktop");
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
    let quizIdsArray = []
    try {
      // Get Liked Quiz IDs
      const likesRef = ref(database, 'likes/' + auth.currentUser.uid);
      console.log("likesref: ", likesRef);

      const likesSnapshot = await get(likesRef);

      console.log(likesSnapshot);

      if (likesSnapshot.exists()) {
        // Convert the snapshot to an array of quiz IDs
        quizIdsArray = Object.keys(likesSnapshot.val());
        
        console.log("Array of Quiz IDs:", quizIdsArray);
    } else {
        console.log("No liked quizzes found for the user.");
    }

      // Assuming quizIdsArray contains the array of quiz IDs from the 'likes' path
      const quizPromises = quizIdsArray.map(async (quizId) => {
        const quizRef = ref(database, 'quizzes/' + quizId);
        const quizSnapshot = await get(quizRef);
        
        if (quizSnapshot.exists()) {
            const quizData = quizSnapshot.val();
            return { ...quizData, quizId: quizId };
        } else {
            console.error("Quiz not found:", quizId);
            const missingQuizRef = ref(database, 'likes/' + auth.currentUser.uid + '/' + quizId);
            remove(missingQuizRef);
            location.reload();
        }
      });

      // Wait for all the promises to resolve
      const likedQuizzes = await Promise.all(quizPromises);

      // 'likedQuizzes' now contains an array of quiz data for the liked quizzes
      console.log("Liked Quizzes:", likedQuizzes);

      // Clear existing list items
      quizList.innerHTML = "";
  
        likedQuizzes.forEach((quizData) => {
          // Create a list item using the template
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
            window.location.href = `quiz.html?quizID=${quizData.quizId}`;
          });

          // Append the list item to the quiz list
          quizList.appendChild(listItem);   
      });
      loaderGif.style.display="none";    
    } catch (error) {
      console.error("Error retrieving quizzes:", error);
    }
  };
  

// document.addEventListener("DOMContentLoaded", (event) => {
//     // Your code here, for example:
//     populateQuizList();
//   });
  
