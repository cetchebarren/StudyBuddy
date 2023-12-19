import { auth, get, quizzesDB } from './firebaseInit.js';

// Elements
const signUpDesktop = document.getElementById("SignUpDesktop");
const loginDesktop = document.getElementById("LoginDesktop");
const logoutDesktop = document.getElementById("LogoutDesktop");

const signUpMobile = document.getElementById("SignUpMobile");
const loginMobile = document.getElementById("LoginMobile");
const logoutMobile = document.getElementById("LogoutMobile");

const quizList = document.getElementById("QuizList");
const sortSelect = document.getElementById("Sort");
const filterSelect = document.getElementById("Filter");

const loaderGif = document.getElementById("loader");

// Check user authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User is signed in:", user);
        signUpDesktop.style.display = "none";
        loginDesktop.style.display = "none";
        logoutDesktop.style.display = "inline-block";

        signUpMobile.style.display = "none";
        loginMobile.style.display = "none";
        logoutMobile.style.display = "inline-block";
        //finishButton.addEventListener("click", () => addQuizToDatabase(user));
    } else {
        console.log("User is currently signed out");
        signUpDesktop.style.display = "block";
        loginDesktop.style.display = "block";
        logoutDesktop.style.display = "none";

        signUpMobile.style.display = "block";
        loginMobile.style.display = "block";
        logoutMobile.style.display = "none";
        //window.location.href = "index.html"; // Redirect to home page
    }
});

// Add event listener for logoutDesktop
logoutDesktop.addEventListener("click", () => {
    auth.signOut().then(() => {
        console.log("User signed out");
        location.reload();
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});

// Add event listener for logoutMobile
logoutMobile.addEventListener("click", () => {
    auth.signOut().then(() => {
        console.log("User signed out");
        location.reload();
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});

// Function to retrieve quizzes and populate the list
const populateQuizList = async () => {
  try {
    //console.log("Populating quiz list...");
    //console.log(filterSelect.value);
    //console.log(sortSelect.value);
    // Assuming quizzesDB is a reference to the Firebase database
    const quizzesSnapshot = await get(quizzesDB);

    //console.log("Quizzes Snapshot:", quizzesSnapshot.val()); // Log the data

    // Clear existing list items
    quizList.innerHTML = "";

    if (quizzesSnapshot.exists()) {
      const sortedAndFilteredQuizzes = sortAndFilterQuizzes(quizzesSnapshot);

      sortedAndFilteredQuizzes.forEach((quizData) => {
        // Create a list item using the provided template
        const listItem = document.createElement("li");
        listItem.classList.add("my-quizzes-li", "list-item");

        const titleElement = document.createElement("h1");
        titleElement.classList.add("my-quizzes-title");
        titleElement.textContent = quizData.title;

        const dateElement = document.createElement("span");
        dateElement.classList.add("all-quizzes-text16");
        let grammaticalNumber = "Terms";
        if(quizData.quizContent.length == 1) grammaticalNumber = "Term";
        let grammaticalNumber2 = "Likes";
        if(quizData.likeCount == 1) grammaticalNumber2 = "Like";
        dateElement.innerHTML = `<span>Created by ${quizData.creatorUsername} on ${quizData.creationDate}<br>Genre:&nbsp;${quizData.genre}, &nbsp;${quizData.quizContent.length}&nbsp;${grammaticalNumber}, ${quizData.likeCount}&nbsp;${grammaticalNumber2}</span>`;

        // Append elements to the list item
        listItem.appendChild(titleElement);
        listItem.appendChild(dateElement);

        // Add click event listener to the list item
        listItem.addEventListener("click", () => {
          // Redirect to the new page with the quiz ID
          window.location.href = `quiz.html?quizID=${quizData.key}`;
        });

        // Append the list item to the quiz list
        quizList.appendChild(listItem);
      });
      loaderGif.style.display="none";
    }
    else{
      loaderGif.style.display="none";  
    }
  } catch (error) {
    console.error("Error retrieving quizzes:", error);
  }
};

const sortAndFilterQuizzes = (quizzesSnapshot) => {
  //console.log("Sorting and filtering quizzes...");

  try {
    // Check if quizzesSnapshot is valid
    if (!quizzesSnapshot || !quizzesSnapshot.exists()) {
      console.error("Invalid quizzes snapshot:", quizzesSnapshot);
      return [];
    }

    // Convert the snapshot to an array
    const quizzesArray = Object.entries(quizzesSnapshot.val()).map(([key, value]) => ({
      key,
      ...value,
    }));

    //console.log("Quizzes Array:", quizzesArray);

    // Filter based on genre
    let filteredQuizzes = filterSelect.value === "All" ? quizzesArray : quizzesArray.filter((quiz) => quiz.genre === filterSelect.value);
    filteredQuizzes = quizzesArray.filter((quiz) => quiz.visibility === "Public");

    // Sort based on selected criteria
    switch (sortSelect.value) {
      case "MostLiked":
        return filteredQuizzes.sort((a, b) => b.likeCount - a.likeCount);
      case "NewestFirst":
        return filteredQuizzes.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
      case "OldestFirst":
        return filteredQuizzes.sort((a, b) => new Date(a.creationDate) - new Date(b.creationDate));
      case "Alphabetical":
        return filteredQuizzes.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
      default:
        return filteredQuizzes;
    }
  } catch (error) {
    console.error("Error processing quizzes snapshot:", error);
    return [];
  }
};



// Event listeners for select elements
sortSelect.addEventListener("change", populateQuizList);
filterSelect.addEventListener("change", populateQuizList);

// Populate the quiz list when the page loads
document.addEventListener("DOMContentLoaded", () => {
  populateQuizList();
});