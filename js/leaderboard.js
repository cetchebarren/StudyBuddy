import { auth, ref, database, get } from './firebaseInit.js';

const signUpDesktop = document.getElementById("signUpDesktop");
const loginDesktop = document.getElementById("loginDesktop");
const logoutDesktop = document.getElementById("logoutDesktop");

const signUpMobile = document.getElementById("signUpMobile");
const loginMobile = document.getElementById("loginMobile");
const logoutMobile = document.getElementById("logoutMobile");

const leaderboardList = document.getElementById("leaderboardList");

updateLeaderboardList();

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

// #region Display Leaderboard
async function updateLeaderboardList() {
    // Clear leaderboard
    leaderboardList.innerHTML = "";

        // Create the path to the relevant directory
        //const leaderboardasdasdRef = ref(database, `quizzes/${quizID}/leaderboards/${typedQuizPath}/${randomQuizPath}/${answerTypePath}/`);

    // Create the path to the relevant directory
    const leaderboardRef = ref(database, `totalStudyTime/`);

    // Retrieve leaderboard data
    const leaderboardSnapshot = await get(leaderboardRef);

    console.log(leaderboardSnapshot);

    // Check if there is existing leaderboard data
    if (leaderboardSnapshot.exists()) {
        // start placement at 1
        let leaderboardPlacement = 1;

        // Convert the leaderboardSnapshot to an array to sort
        let sortedLeaderboard = [];
        leaderboardSnapshot.forEach((entry) => {
            sortedLeaderboard.push(entry.val());
        });
    
        // Sort the array primarily based on timeInSeconds
        sortedLeaderboard.sort((a, b) => { // TimSort, hybrid of merge and insertion sort
            if (a.totalTime - b.totalTime) {
                return b.totalTime - a.totalTime; // Sort by scorePercentage in descending order (high score at top)
            }
        });       

        // Iterate over existing leaderboard data
        sortedLeaderboard.forEach((leaderboardEntry) => {
            let username = leaderboardEntry.username;
            let timeInSeconds = leaderboardEntry.totalTime;

            // Create an LI element for each leaderboard entry
            const listItem = document.createElement("li");
            listItem.classList.add("listItemLB");

            // Create and append the left span
            const leftSpan = document.createElement("span");
            leftSpan.classList.add("leaderboard-left");
            leftSpan.textContent = '\u00A0' + leaderboardPlacement + '. ' + username;
            listItem.appendChild(leftSpan);   

            const rightSpan = document.createElement("span");
            rightSpan.classList.add("leaderboard-right");
            if(timeInSeconds >= 59940) timeInSeconds = 59999;
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = timeInSeconds % 60;
            rightSpan.textContent = `${minutes}m\u00A0${seconds}s`;
            listItem.appendChild(rightSpan);

            // Append the LI element to the UL
            leaderboardList.appendChild(listItem);

            // Update counter for leaderboard order
            leaderboardPlacement++;
        });
    } else {
        // Handle case where there is no existing leaderboard data
        console.log("No leaderboard data found");
    }
}