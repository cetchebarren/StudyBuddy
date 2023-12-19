import { auth, EmailAuthProvider, reauthenticateWithCredential, push, get, set, ref, database, runTransaction, usernamesDB, remove } from './firebaseInit.js';

// Get the value of a query parameter from the URL
const getQueryParam = (name) => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get(name);
  };
  
// Elements and variables
const quizID = getQueryParam("quizID");
const signUpDesktop = document.getElementById("signUpDesktop");
const loginDesktop = document.getElementById("loginDesktop");
const logoutDesktop = document.getElementById("logoutDesktop");

const signUpMobile = document.getElementById("signUpMobile");
const loginMobile = document.getElementById("loginMobile");
const logoutMobile = document.getElementById("logoutMobile");

const modifySection = document.getElementById("ModifySection");
const modifyButton = document.getElementById("ModifyQuiz");
const editButton = document.getElementById("EditQuiz");
const deleteButton = document.getElementById("DeleteQuiz");
const likeButton = document.getElementById("LikeQuiz");
const likeIcon = document.getElementById("LikeIcon");

const overlay = document.getElementById('overlay');
const deletePopup = document.getElementById('deletePopup');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');
const incorrectPasswordNotification = document.getElementById("incorrectPasswordNotification");
const passwordNotificationText = document.getElementById("passwordNotificationText");
const passwordField = document.getElementById("deleteConfirmInput");
const showPasswordCheckbox = document.getElementById("showPasswordID");

const quizTitle = document.getElementById("QuizTitle");
const author = document.getElementById("Author");
const information = document.getElementById("Information");
const visibility = document.getElementById("Visibility");
const termsList = document.getElementById("TermsList");

// Quiz Settings and Begin
const formatSelect = document.getElementById("FormatSelect");
const questionOrderSelect = document.getElementById("QuestionOrderSelect");
const answerTypeSelect = document.getElementById("AnswerTypeSelect");
const beginButton = document.getElementById("BeginQuiz");

// Leaderboard Elements and Declarations
const leaderboardPopup = document.getElementById('leaderboardPopup');
const leaderboardButton = document.getElementById('leaderboardButton');
const closeLeaderboard = document.getElementById('closeLeaderboard');
const leaderboardFormatSelect = document.getElementById('formatLB');
const leaderboardQuestionOrderSelect = document.getElementById('questionOrderLB');
const leaderboardAnswerTypeSelect = document.getElementById('answerTypeLB');
const leaderboardList = document.getElementById('leaderboardList');

//Mid-Quiz Elements
const preQuizContainer = document.getElementById("PreQuizContainer");
const typedQuizContainer = document.getElementById("TypedQuizContainer");
const multipleChoiceQuizContainer = document.getElementById("MultipleChoiceQuizContainer");
const questionAndTimerContainer = document.getElementById("QuestionNumberAndTimerContainer");
const questionCountText = document.getElementById("QuestionNumber");
const timerText = document.getElementById("TimerText");
let questionText1Value = "definition";

// Post-Quiz Elements
const resultsContainer = document.getElementById("ResultsContainer");
const scoreText = document.getElementById("Score"); 
const newHighScore = document.getElementById("NewHighScore"); 
const timerResultsText = document.getElementById("TimerResults")
const incorrectAnswerList = document.getElementById("IncorrectAnswerList")
const finishButton = document.getElementById("Finish");

// Multiple Choice Elements
const mcQuestionText1 = document.getElementById("MultipleChoiceQuestionText1");
const mcQuestionText2 = document.getElementById("MultipleChoiceQuestionText2");
const mcTextOptionA = document.getElementById("TextA");
const mcTextOptionB = document.getElementById("TextB");
const mcTextOptionC = document.getElementById("TextC");
const mcTextOptionD = document.getElementById("TextD");
const mcRadioA = document.getElementById("RadioA");
const mcRadioB = document.getElementById("RadioB");
const mcRadioC = document.getElementById("RadioC");
const mcRadioD = document.getElementById("RadioD");
const mcSubmitButton = document.getElementById("SubmitMultipleChoice");
const mcCorrectnessText = document.getElementById("CorrectnessMultipleChoice");
const mcContinueButton = document.getElementById("ContinueMultipleChoice");

// Typed Quiz Elements
const typedQuestionText1 = document.getElementById("TypedQuestionText1");
const typedQuestionText2 = document.getElementById("TypedQuestionText2");

const typedCorrectAnswerLabel = document.getElementById("CorrectAnswerLabelTyped");
const typedCorrectAnswer = document.getElementById("CorrectAnswerTyped");

const typedSubmitButton = document.getElementById("SubmitTyped");
const typedCorrectnessText = document.getElementById("CorrectnessTypedText");
const typedContinueButton = document.getElementById("ContinueTyped");
const typedInputTextArea = document.getElementById("InputTextArea");

// Mid-Quiz variables
let currentQuestion = 0; //index for current question
let timer;
let seconds = 0;
let minutes = 0;
let typedAnswerPercentages = []; // used to calulcate overall score
let correctAnswer; // store the correct answer
let canSubmitWithEnter = false; //used for check with enter key submit

let currentUser; //reference to current firebase user
let termsAndDefinitions = []; //contains quiz contents after updating
let genreCopy;// used for updating genre locally
let likeCountCopy = 0;// used for updating like count locally

// Results variables
let incorrectAnswerIndices = [];
let incorrectAnswers = []

// Fetch quiz data and update the page
const fetchQuizData = async (quizID) => {
    try {
        // Get reference to quiz path
        const quizRef = ref(database, 'quizzes/' + quizID);
        // snapshot relevant quiz data
        const quizSnapshot = await get(quizRef); 
        //if snapshot exists, get values and udpate page content
        if (quizSnapshot.exists()) {
            const quizData = quizSnapshot.val();
            updatePageContent(quizData);
        } else {
            console.error("Quiz not found");
            window.location.href = "index.html"; // Redirect to home page
        }
    } catch (error) {
        console.error("Error fetching quiz data:", error);
        window.location.href = "index.html"; // Redirect to home page
    }
};

// Get quiz data from database
fetchQuizData(quizID);

// Check user authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User is signed in:", user);
        currentUser = user;
        checkIfLiked();
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

// For delete quiz, start with password in password type
passwordField.type = "password";

// #region Listeners

modifyButton.addEventListener("click", () => {
    // Toggle the display property of editButton and deleteButton
    if (editButton.style.display === "none" || !editButton.style.display) {
      editButton.style.display = "inline-block";
      deleteButton.style.display = "inline-block";
    } else {
      editButton.style.display = "none";
      deleteButton.style.display = "none";
      confirmDeleteButton.style.display = "none";
    }
  });

editButton.addEventListener("click", edit);
async function edit(){
    const quizRef = ref(database, 'quizzes/' + quizID);
    const quizSnapshot = await get(quizRef); // Corrected this line
    const quizData = quizSnapshot.val();
    if(auth.currentUser.uid == quizData.creatorUID){
        window.location.href = `create-quiz.html?quizID=${quizID}`;
    }    
}

formatSelect.addEventListener("change", () => {
    if(formatSelect.value == "typed")
    {
        leaderboardFormatSelect.value = "typed";
    }
    else{
        leaderboardFormatSelect.value = "multipleChoice";
    }
});

questionOrderSelect.addEventListener("change", () => {
    if(questionOrderSelect.value == "Random")
    {
        leaderboardQuestionOrderSelect.value = "random";
    }
    else{
        leaderboardQuestionOrderSelect.value = "inOrder";
    }
});

answerTypeSelect.addEventListener("change", () => {
    if(questionOrderSelect.value == "Definition")
    {
        leaderboardAnswerTypeSelect.value = "definition";
    }
    else{
        leaderboardAnswerTypeSelect.value = "term";
    }
});

formatSelect.addEventListener("change", () => {
    if(formatSelect.value == "typed")
    {
        leaderboardFormatSelect.value = "typed";
    }
    else{
        leaderboardFormatSelect.value = "multipleChoice";
    }
});

questionOrderSelect.addEventListener("change", () => {
    if(questionOrderSelect.value == "Random")
    {
        leaderboardQuestionOrderSelect.value = "random";
    }
    else{
        leaderboardQuestionOrderSelect.value = "inOrder";
    }
});

leaderboardFormatSelect.addEventListener("change", () => {
    updateLeaderboardList();
});

leaderboardQuestionOrderSelect.addEventListener("change", () => {
    updateLeaderboardList();
});

leaderboardAnswerTypeSelect.addEventListener("change", () => {
    updateLeaderboardList();
});

beginButton.addEventListener("click", () => {
    startQuiz();
});

finishButton.addEventListener("click", () => {
    location.reload();
});

likeButton.addEventListener("click", () => {
    handleLikeEvent();
});

deleteButton.addEventListener("click", () => {
    openDeletePopup();
});

leaderboardButton.addEventListener("click", () => {
    openLeaderboardPopup();
});

closeLeaderboard.addEventListener("click", () => {
    closeLeaderboardPopup();
});

mcTextOptionA.addEventListener("click", () => {
    if(mcRadioA.disabled == false) {
        mcRadioA.checked = true;        
    }
});

mcTextOptionB.addEventListener("click", () => {
    if(mcRadioB.disabled == false) {
        mcRadioB.checked = true;
    }
});

mcTextOptionC.addEventListener("click", () => {
    if(mcRadioC.disabled == false) {
        mcRadioC.checked = true;
    }
});

mcTextOptionD.addEventListener("click", () => {
    if(mcRadioD.disabled == false) {
        mcRadioD.checked = true;
    }
});

mcContinueButton.addEventListener("click", () => {
    currentQuestion++;
    if(currentQuestion < termsAndDefinitions.length) {
        //console.log(currentQuestion + " < " + termsAndDefinitions.length + " is true, continue quiz" );
        loadNextMultipleChoiceQuestion();        
    }
    else{
        //console.log(currentQuestion + " < " + termsAndDefinitions.length + " is false, end quiz" );
        displayResults();
    }
});

typedContinueButton.addEventListener("click", () => {
    currentQuestion++;
    if(currentQuestion < termsAndDefinitions.length) {
        //console.log(currentQuestion + " < " + termsAndDefinitions.length + " is true, continue quiz" );
        loadNextTypedQuestion();        
    }
    else{
        //console.log(currentQuestion + " < " + termsAndDefinitions.length + " is false, end quiz" );
        displayResults();
    }
});

confirmDeleteButton.addEventListener('click', async function () {

    const quizRef = ref(database, 'quizzes/' + quizID);
    const quizSnapshot = await get(quizRef); // Corrected this line
    const quizData = quizSnapshot.val();

    // Assuming you have the current user from Firebase Authentication
    const currentUser = auth.currentUser;
    // Get the entered password from the input field
    const enteredPassword = passwordField.value.trim();

    // Create a credential with the current email and entered password
    const credential = EmailAuthProvider.credential(
        currentUser.email,
        enteredPassword
    );
    
    // Reauthenticate the user with the provided credential
    reauthenticateWithCredential(currentUser, credential)
        .then(() => {
            // User has been successfully reauthenticated
            // Perform your sensitive action, e.g., delete the quiz
            const quizRef = ref(database, 'quizzes/' + quizID);
            if(currentUser.uid == quizData.creatorUID){
                // Remove the quiz
                remove(quizRef).then(() => {
                  // Now, let's remove the likes for that quiz
                  const likesRef = ref(database, 'likes');
                  
                  // Fetch all users who liked the quiz
                  get(likesRef).then((snapshot) => {
                    if (snapshot.exists()) {
                      const users = snapshot.val();
                
                      // Iterate over each user
                      for (const userUID in users) {
                        const userLikesRef = ref(database, 'likes/' + userUID + '/' + quizID);
                        
                        // Remove the like for the specific quiz for this user
                        remove(userLikesRef);
                      }
                    }
                    window.location.href = `my-quizzes.html`;
                  }).catch((error) => {
                    console.error('Error fetching likes:', error);
                  });
                }).catch((error) => {
                  console.error('Error removing quiz:', error);
                });
                
            }
            else{
                console.error("Authentication failed: Identity Error");
                passwordNotificationText.textContent = "Authentication failed: Identity Error";
                incorrectPasswordNotification.style.display = "inline-block";
            }
        })
        .catch((error) => {
            // An error occurred during reauthentication
            console.error("Reauthentication failed:", error);
            passwordNotificationText.textContent = "Incorrect Password";
            incorrectPasswordNotification.style.display = "inline-block";
    });
});

cancelDeleteButton.addEventListener('click', function () {
    console.log('Cancelled');
    closeDeletePopup();
});

showPasswordCheckbox.addEventListener("change", function () {
    const passwordType = showPasswordCheckbox.checked ? "text" : "password";
    passwordField.type = passwordType;
  // Change the SVG content based on the checkbox state
    if (showPasswordCheckbox.checked) {
        eyeIcon.src = "media/eye.svg";
    } else {
        eyeIcon.src = "media/eyeslash.svg";
    }
});

typedInputTextArea.addEventListener('input', function() {
    this.style.height='auto';
    this.style.height = (this.scrollHeight) + 'px';
});

typedInputTextArea.addEventListener('keydown', function(event) {
    if(event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        // Check text area has input        
        if (typedInputTextArea.value.trim() != '' && canSubmitWithEnter) {
            canSubmitWithEnter = false;
            // Prevent timer accumulation between questions;
            stopTimer();
            // check results using input and correct answer
            checkAnswerTyped(typedInputTextArea.value, correctAnswer);
        } else {
            console.log("No input text detected");
        }
    }
});

loginDesktop.addEventListener("click", () => {
    window.location.href = `log-in.html?quizID=${quizID}`;
});

loginMobile.addEventListener("click", () => {
    window.location.href = `log-in.html?quizID=${quizID}`;
});

signUpDesktop.addEventListener("click", () => {
    window.location.href = `sign-up.html?quizID=${quizID}`;
});

signUpMobile.addEventListener("click", () => {
    window.location.href = `sign-up.html?quizID=${quizID}`;
});

logoutDesktop.addEventListener("click", () => {
    auth.signOut().then(() => {
        console.log("User signed out");
        location.reload();
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});

logoutMobile.addEventListener("click", () => {
    auth.signOut().then(() => {
        console.log("User signed out");
        location.reload();
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});
// #endregion

// #region Popup Functions
function openDeletePopup() {
    overlay.style.display = 'block';
    deletePopup.style.display = 'flex';
}

function openLeaderboardPopup() {
    updateLeaderboardList();
    overlay.style.display = 'block';
    leaderboardPopup.style.display = 'flex';
}

function closeDeletePopup() {
    overlay.style.display = 'none';
    deletePopup.style.display = 'none';
    incorrectPasswordNotification.style.display = "none";
}

function closeLeaderboardPopup() {
    overlay.style.display = 'none';
    leaderboardPopup.style.display = 'none';
}
// #endregion

// #region Page Content Functions

// Function to update the page content with quiz data
const updatePageContent = (quizData) => {
    quizTitle.textContent = quizData.title;
    author.textContent = `Created by ${quizData.creatorUsername} on ${quizData.creationDate}`;
    let grammaticalNumber = "Terms";
    if(quizData.quizContent.length == 1) grammaticalNumber = "Term";
    let grammaticalNumber2 = "Likes";
    if(quizData.likeCount == 1) grammaticalNumber2 = "Like";
    information.textContent = `Genre:\u00A0${quizData.genre}, ${quizData.quizContent.length}\u00A0${grammaticalNumber}, ${quizData.likeCount}\u00A0${grammaticalNumber2}`;
    visibility.textContent = quizData.visibility;
    likeCountCopy = quizData.likeCount;
    genreCopy = quizData.genre;
    
    // Clear existing list items
    termsList.innerHTML = "";

    // If the user is signed in
    if(currentUser != null) {
        // and the user is the creator (uid's match)
        if(quizData.creatorUID == currentUser.uid) {
            modifySection.style.display = "flex";
        }        
    }

    if (quizData.quizContent && quizData.quizContent.length > 0) {
        quizData.quizContent.forEach((term) => {
            // Add the term and definition to the array
            termsAndDefinitions.push({ 0: term.term, 1: term.definition });

            createListItem(term.term, term.definition);

        });
    }
    //console.log(termsAndDefinitions);
};

// Function to create and append a new list item based on term and definition
const createListItem = (term, definition) => {
    // Create the list item
    const listItem = document.createElement("li");
    listItem.classList.add("quiz-li");

    // Create the heading for term
    const termHeading = document.createElement("h2");
    termHeading.classList.add("quiz-term");
    termHeading.innerHTML = `<span>${term}</span><br />`;

    // Create the span for definition
    const definitionSpan = document.createElement("span");
    definitionSpan.classList.add("quiz-defintion");
    definitionSpan.innerHTML = `<span>${definition}</span><br />`;

    // Append heading and span to the list item
    listItem.appendChild(termHeading);
    listItem.appendChild(definitionSpan);

    // Append the list item to the termsList
    termsList.appendChild(listItem);
};
// #endregion

// #region Like Functions
async function handleLikeEvent() {
    const userLikesRef = ref(database, 'likes/' + currentUser.uid + "/" + quizID);

    const likeCountRef = ref(database, `quizzes/${quizID}/likeCount`);

    // Check if the quiz is already liked to prevent duplicates
    const existingLikeSnapshot = await get(userLikesRef);

    if (!existingLikeSnapshot.exists()) {
        // Update icon
        likeIcon.src = "media/liked.svg";
        // If the quiz is not already liked, add it to the liked quizzes
        set(userLikesRef, quizID);
        // Update Quiz's like count + 1
        await runTransaction(likeCountRef, (currentValue = 0) => currentValue + 1);

        // Update counter for description
        likeCountCopy++;
    }
    else {
        // Update icon
        likeIcon.src = "media/unliked.svg";        
        // If the quiz is already liked, remove it from liked quizzes database
        set(userLikesRef, null);
        // Update quiz's like count - 1
        await runTransaction(likeCountRef, (currentValue = 0) => Math.max(currentValue - 1, 0));

        // Update counter for description
        likeCountCopy--;
    }

        let grammaticalNumber = "Terms";
        if(termsAndDefinitions.length == 1) grammaticalNumber = "Term";
        let grammaticalNumber2 = "Likes";
        if(likeCountRef == 1) grammaticalNumber2 = "Like";
        information.textContent = `Genre:\u00A0${genreCopy}, ${termsAndDefinitions.length}\u00A0${grammaticalNumber}, ${likeCountCopy}\u00A0${grammaticalNumber2}`;
}

async function checkIfLiked() {
    likeButton.style.display = "inline-block";

    const userLikesRef = ref(database, 'likes/' + currentUser.uid + "/" + quizID);

    // Check if the quiz is already liked to prevent duplicates
    const existingLikeSnapshot = await get(userLikesRef);

    if (!existingLikeSnapshot.exists()) {
        // If the quiz is not already liked, add it to the liked quizzes
        likeIcon.src = "media/unliked.svg";
    }
    else {
        // If the quiz is already liked, remove it from liked quizzes database
        likeIcon.src = "media/liked.svg";
    }
}
// #endregion

// #region Timer & Randomize Functions
function startTimer() {
    timer = setInterval(updateTimer, 1000); // Update every 1000 milliseconds (1 second)
}
  
function stopTimer() {
    // pause timer by clearing interval
    clearInterval(timer);
}
  
function updateTimer() {
    seconds++;
    if (seconds === 60) {
        seconds = 0;
        minutes++;
    }
    const formattedSeconds = padNumber(seconds);
    timerText.textContent = `Time: ${minutes}:${formattedSeconds}`;
}
  
function padNumber(number) {
    return number < 10 ? `0${number}` : number;
}

function shuffleArray(array) { // Fisher-Yates algorithm for randomizing array
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

function flipElements(array) {
    for(let i = 0; i < array.length; i++) {
        let temp = array[i][0];
        array[i][0] = array[i][1];
        array[i][1] = temp;
    }
}
//#endregion

// #region Quiz Functions

function startQuiz() {
    let typedQuiz = (formatSelect.value == "typed");
    let randomQuiz = (questionOrderSelect.value == "random");
    let answerIsDef = (answerTypeSelect.value == "definition");

    console.log("Typed: " + typedQuiz);
    console.log("Random: " + randomQuiz);
    console.log("Answer is the definition: " + answerIsDef);

    if(randomQuiz) shuffleArray(termsAndDefinitions);
    if(!answerIsDef) flipElements(termsAndDefinitions);

    // If setting Answer is Term, switch instructions to indicate it
    if(!answerIsDef) questionText1Value = "term";

    preQuizContainer.style.display = "none";

    if(typedQuiz) {
        // Load the next question, in this case the first question is loaded
        loadNextTypedQuestion();   
        // We are starting a Typed quiz
        typedQuizContainer.style.display = "flex";
        // Select text box for convenience
        typedInputTextArea.select();
    }
    else{
        // Load the next question, in this case the first question is loaded
        loadNextMultipleChoiceQuestion();          
        // Display the multiple choice container
        multipleChoiceQuizContainer.style.display = "flex";     
    }
    //Enable UI for Question number ad timer
    questionAndTimerContainer.style.display="flex";
}

//#endregion

//#region Multiple Choice Quiz Functions

function loadNextMultipleChoiceQuestion() {
    // Start or Resume the Timer
    startTimer();
    // Reset Hidden and Disabled Elements
    mcContinueButton.style.display="none";    
    mcCorrectnessText.style.display = "none";
    mcTextOptionA.parentElement.parentElement.style.display = "list-item";
    mcTextOptionB.parentElement.parentElement.style.display = "list-item";
    mcTextOptionC.parentElement.parentElement.style.display = "list-item";
    mcTextOptionD.parentElement.parentElement.style.display = "list-item";
    mcRadioA.checked = false;
    mcRadioB.checked = false;
    mcRadioC.checked = false;
    mcRadioD.checked = false;
    mcRadioA.disabled = false;
    mcRadioB.disabled = false;
    mcRadioC.disabled = false;
    mcRadioD.disabled = false;

    // Display the current question number
    questionCountText.textContent = `Question ${currentQuestion + 1} / ${termsAndDefinitions.length}`;
    // Update instructions to "term" or "definition" based on assignment in StartQuiz()
    mcQuestionText1.textContent = questionText1Value;
    // Update instructions for the actual erm or definition, values already flipped if enabled
    mcQuestionText2.textContent = termsAndDefinitions[currentQuestion][0];
    // Generate random indexes excluding currentQuestion so that we can have wrong answer options
    const randomIndices = generateRandomIndices(termsAndDefinitions.length, currentQuestion);
    //console.log("Current Question (shouldn't repeat): " + currentQuestion + ", Random wrong answers: " + randomIndices);
    // Randomize and set the correct answer option
    let correctAnswer = Math.floor(Math.random() * 4); // 0, 1, 2, 3
    // Get the string of the correct answer
    let correctOption = termsAndDefinitions[currentQuestion][1];
    // create array of the text elements for easy referencing and iteration
    const texts = [ mcTextOptionA, mcTextOptionB, mcTextOptionC, mcTextOptionD ]; 
    // For each, IF it is the correct answer, set text to correct answer, else check null and take additional action in checkNullOPtion()
    for(let index = 0; index < texts.length; index++){
        // Original :  mcTextOptionA.textContent = (correctAnswer === 0) ? correctOption : checkNullOption(randomIndices, 0, mcTextOptionA); b->d :: 0->3        
        texts[index].textContent = (correctAnswer === index) ? correctOption : checkNullOption(randomIndices, index,  texts[index]);
        // It is also convenient to reset the text colors here, so let us do that
        texts[index].style.color = "#000000"; 
    }
    // Show submit button
    mcSubmitButton.style.display="block";
     
    // Prevent multi firing
    let submitTriggered = false;
    // Add event listener to submit button
    mcSubmitButton.addEventListener("click", () => {
        if(!submitTriggered){
            // Get selected radio button
            const selectedRadioButton = document.querySelector('input[name="radio"]:checked');
            // Check if a button is selected
            if (selectedRadioButton) {
                submitTriggered = true;
                mcSubmitButton.style.display="none"                
                // Prevent timer accumulation between questions;
                stopTimer();
                // Get the value of the selected radio button
                const selectedValue = selectedRadioButton.value;            
                // Disable radio buttons
                mcRadioA.disabled = true;
                mcRadioB.disabled = true;
                mcRadioC.disabled = true;
                mcRadioD.disabled = true;
                // Check input for correctness
                checkAnswerMultipleChoice(selectedValue, correctAnswer, texts);
            } else {
                console.log("No option selected");
            }
        }
    });
}

function checkNullOption(randomIndices, index, textOption)
{
    if(termsAndDefinitions[randomIndices[index]] == null)
    {
        // Hide list item: span -> div -> li
        textOption.parentElement.parentElement.style.display = "none";
        return "EMPTY";
    }
    else{
        // Return the string for the randomized wrong answer
        return termsAndDefinitions[randomIndices[index]][1];
    }
}

function generateRandomIndices(arrayLength, currentQuestion) {
    // Create an array of all indices except currentQuestion index   
    let incorrectAnswerIndices = Array.from({ length: arrayLength }, (_, index) => index).filter(i => i !== currentQuestion);

    // Shuffle the array to get random order
    shuffleArray(incorrectAnswerIndices);

    // Take the first three elements (or fewer if arrayLength is less than 3)
    let randomIndices = incorrectAnswerIndices.slice(0, Math.min(4, arrayLength - 1));

    // If we have less than three indices (questions), duplicate non-correct questions 
    while(randomIndices.length < 4)
    {
        // Get a random index from our random indices
        let i = Math.floor(Math.random() * randomIndices.length);
        // Get the value at that index
        let newIndex = randomIndices[i];
        // Push the new index (should be a duplicate from randomIndices) into our random array
        randomIndices.push(newIndex);
    }
    // Send wrong answer indices bak
    return randomIndices;
}

function checkAnswerMultipleChoice(selectedOption, correctOption, texts){
    
     //console.log("Chose: " + selectedOption + ", Correct: " + (selectedOption == correctOption)); 
     // Determine if answer is correct 
    let correct = (selectedOption == correctOption);

    // Set all answers text to black
    texts.forEach((text) => {
        text.style.color = "#000000";
    });

    if(correct) {
        // If correct, display correct in green        
        mcCorrectnessText.textContent = "CORRECT";
        mcCorrectnessText.style.color = "#20C91B";
    }
    else{ 
        // If incorrect, indicate so via text and set choice to red
        mcCorrectnessText.textContent = "INCORRECT";
        mcCorrectnessText.style.color = "#EE4624";  
        texts[selectedOption].style.color = "#EE4624"; 
        // Add this question to the incorrect answers index to be used in results
        //console.log("pushing " + currentQuestion + " into incorrectAnswersIndices");
        incorrectAnswerIndices.push(currentQuestion); // reminder: currentQuestion is the index of termsAndDefinitions
        //console.log("Incorrect Array: " + incorrectAnswerIndices);
        // Keep record of the actual selected text for the results page
        incorrectAnswers.push(texts[selectedOption].textContent);
    }

    // Correct answer will always appear green after submission
    texts[correctOption].style.color = "#20C91B"; 
    // Show correctness text "CORRECT/INCORRECT"
    mcCorrectnessText.style.display = "flex";
    // Hide submit button
    mcSubmitButton.style.display="none";
    // Show Continue to next question button
    mcContinueButton.style.display="block";
}

// #endregion

// #region Typed Quiz Functions
function loadNextTypedQuestion() {
    // clear text input
    typedInputTextArea.value = "";
    // Allow input
    typedInputTextArea.readOnly = false;
    // Select text box for convenience
    typedInputTextArea.select();
    // Show submit button
    typedSubmitButton.style.display = "block";
    // Allow enter key to submit
    canSubmitWithEnter = true;

    // Start or Resume the Timer
    startTimer();
    // Reset Hidden and Disabled Elements
    typedCorrectAnswerLabel.style.display = "none";
    typedCorrectAnswer.style.display = "none";
    typedContinueButton.style.display = "none";    
    typedCorrectnessText.style.display = "none";

    // Display the current question number
    questionCountText.textContent = `Question ${currentQuestion + 1} / ${termsAndDefinitions.length}`;
    // Update instructions to "term" or "definition" based on assignment in StartQuiz()
    typedQuestionText1.textContent = questionText1Value;
    // Update instructions for the actual erm or definition, values already flipped if enabled
    typedQuestionText2.textContent = termsAndDefinitions[currentQuestion][0];

    // Get the string of the correct answer and store it
    correctAnswer = termsAndDefinitions[currentQuestion][1];
     
    // Prevent multi-firing
    let submitTriggered = false;
    // Add event listener to submit button
    typedSubmitButton.addEventListener("click", () => {
        if(!submitTriggered){
            // Check text area has input
            if (typedInputTextArea.value.trim() != '') {
                submitTriggered = true;         
                // Prevent timer accumulation between questions;
                stopTimer();
                checkAnswerTyped(typedInputTextArea.value, correctAnswer);
            } else {
                console.log("No input text detected");
            }
        }
    });
}

function checkAnswerTyped(userAnswer, correctAnswer){
    // prevent changing input
    typedInputTextArea.readOnly = true;
    // hide submit button
    typedSubmitButton.style.display = "none";
    // Keep a copy of the correct answer, unaltered
    let correctAnswerCopy = correctAnswer;
    // Remove uncounted characters/symbols from trimmed correct answer
    correctAnswer = cleanString(correctAnswer.trim());
    // keep a copy of user answer to store into incorrectAnswers (if they didn't get 100%)
    let userAnswerRaw = userAnswer.trim();
    // Remove uncounted characters/symbols from trimmed user answer
    userAnswer = cleanString(userAnswer.trim());
    // Set accuracy (score)
    let accuracy = similarity(correctAnswer, userAnswer);
    // answer had errors, place user answer into incorrect answers array
    if(accuracy < 100){
        incorrectAnswers.push(userAnswerRaw);
        incorrectAnswerIndices.push(currentQuestion);
        console.log("incorrect indices: " + incorrectAnswerIndices);
    }
    // Add this accuracy to our list of accuracies to help calculate overall score
    typedAnswerPercentages.push(accuracy);
    //console.log(typedAnswerPercentages);
    // To display only first decimal
    let truncuatedAccuracy = parseFloat(accuracy.toFixed(1));
    //display correct answer
    typedCorrectAnswerLabel.style.display="inline-block";
    typedCorrectAnswer.textContent = correctAnswerCopy;
    typedCorrectAnswer.style.display="inline-block";
    //display accuracy
    //let formattedAccuracy = parseInt(accuracy * 100);
    typedCorrectnessText.textContent = `Accuracy: ${truncuatedAccuracy}%`;
    typedCorrectnessText.style.display = "inline-block";
    // display continue button
    typedContinueButton.style.display = "block";
    typedContinueButton.focus();

}

// Function to calculate the similarity percentage between two strings
function similarity(str1, str2) {
    // Calculate the Levenshtein distance between the strings
    const distance = levenshteinDistance(str1, str2);

    // Find the maximum length of the two strings
    const maxLength = Math.max(str1.length, str2.length);

    // Calculate the similarity percentage based on the Levenshtein distance
    const similarityPercentage = ((maxLength - distance) / maxLength) * 100;

    // Return the similarity percentage
    return similarityPercentage;
}

// Function to calculate the Levenshtein distance between two strings
function levenshteinDistance(str1, str2) {
    // Get the lengths of the input strings
    const m = str1.length;
    const n = str2.length;

    // Create a 2D array to store the dynamic programming values
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    // Populate the dp array based on the Levenshtein distance algorithm
    for (let i = 0; i <= m; i++) {
        for (let j = 0; j <= n; j++) {
            // If one of the strings is empty, the distance is the length of the other string
            if (i === 0) {
                dp[i][j] = j;
            } else if (j === 0) {
                dp[i][j] = i;
            } else {
                // Calculate the cost of the current operation
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

                // Update the dp value based on the minimum of deletion, insertion, and substitution
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,     // Deletion
                    dp[i][j - 1] + 1,     // Insertion
                    dp[i - 1][j - 1] + cost  // Substitution
                );
            }
        }
    }

    // Return the Levenshtein distance between the two strings
    return dp[m][n];
}

// Remove specific characters from string
function cleanString(inputString) {
    // Convert the string to lowercase to prevent case detection
    const lowercaseString = inputString.toLowerCase();

    // Remove punctuation except for double quotes and forward slashes
    const cleanWithoutPunctuation = lowercaseString.replace(/[^\w\s"\/]/g, '');

    // Replace multiple spaces with a single space
    const cleanString = cleanWithoutPunctuation.replace(/\s+/g, ' ');

    return cleanString;
}

// #endregion

// #region Results and Leaderboard

async function displayResults(){
    // Hide Containers
    multipleChoiceQuizContainer.style.display="none";
    typedQuizContainer.style.display="none";
    questionAndTimerContainer.style.display="none";
    // Calculate score depending on quiz type
    let score = 0;
    // Get quiz type
    let typedQuiz = (formatSelect.value == "typed");
    // if typed quiz, calculate average percentage
    if(typedQuiz) {
        // Get average percentage of all results
        let averagePercentage = calculateAverage(typedAnswerPercentages);
        // Get result in one decimal format
        let truncuatedAccuracy = parseFloat(averagePercentage.toFixed(1));
        // Divide by 100 to change 100% to 1.0
        score = averagePercentage / 100;
        // Set score text to truncated accuracy
        scoreText.textContent = `Score: ${truncuatedAccuracy}%`;
    }else{
        //console.log("Incorrect Length: " + incorrectAnswerIndices.length);
        score = termsAndDefinitions.length - incorrectAnswerIndices.length;
        // Update Score Text
        scoreText.textContent = `Score: ${score} / ${termsAndDefinitions.length}`;
    }

    // Display Final Time Text
    timerResultsText.textContent = `Time: ${minutes}m ${seconds}s`;

    // For each question that was wrong, display the correct answer and user's answer
    for(let i = 0; i < incorrectAnswerIndices.length; i++)
    {
        // get the question number value from the incorrect indices list
        let index = incorrectAnswerIndices[i];
        // incorrect answers are already aligned with incorrect indices
        let yourAnswer = incorrectAnswers[i];
        // get the correct term+definition from specific question number
        let correctTerm = termsAndDefinitions[index][0];
        let correctDefinition = termsAndDefinitions[index][1];

        //console.log("Correct Term " + i + ": " + correctTerm);
        //console.log("Correct Def " + i + ": " + correctDefinition);
        //console.log("Your answer " + i + ": " + yourAnswer);
        generateIncorrectListItem(correctTerm, correctDefinition, yourAnswer);
    }
    // display the results container
    resultsContainer.style.display = "flex";

    if(currentUser) {
        // check that user is signed in (exists) in order to update leaderboard
        if(typedQuiz){
            // we multiply by termsAndDefinitons length because (for multiple choice),
            // we divide for the score in handleLeaderboardInDB            
            handleLeaderboardInDB(score * termsAndDefinitions.length);            
        } else {
            handleLeaderboardInDB(score);
        }

        

    }
}

async function handleLeaderboardInDB(score) {
    // Check quiz leaderboard and sends results 
    // Get user's username
    const currentUsername = await getUsernameForUserUID(currentUser.uid);   
    //get score
    let scoreAsPercentage = (score / termsAndDefinitions.length);
    //console.log(`${score}/${termsAndDefinitions.length}=${scoreAsPercentage}`);
    // get time spent on quiz in seconds
    let totalTimeInSeconds = (minutes * 60) + seconds;    
    // Update the overall study time leaderboard
    updateStudyTimeLeaderboardInDB(currentUsername, totalTimeInSeconds);

    let typedQuizPath = formatSelect.value;
    let randomQuizPath = questionOrderSelect.value;
    let answerTypePath = answerTypeSelect.value;

    // Create the path to the relevant directory
    const leaderboardRef = ref(database, `quizzes/${quizID}/leaderboards/${typedQuizPath}/${randomQuizPath}/${answerTypePath}/`);

    // Get the existing (relevant) leaderboard and its data
    const existingLeaderboard = await get(leaderboardRef);
    // Check if there is existing leaderboard data
    if (existingLeaderboard.exists()) {
        console.log("leaderboard exists");
        // used to check if user was not on leaderboard so they can be added
        let found = false;
        // Iterate over existing leaderboard data to find the entry for currentUsername
        existingLeaderboard.forEach((entry) => {
            const leaderboardEntry = entry.val();
            const leaderboardUsername = leaderboardEntry.username;
            const leaderboardScorePercentage = leaderboardEntry.scorePercentage;
            const leaderboardTimeInSeconds = leaderboardEntry.timeInSeconds;
            const leaderboardPath = entry.ref;
            console.log("leaderboardUsername(iteration): " + leaderboardUsername);             
            if (leaderboardUsername === currentUsername) { // Username found in leaderboard
                //console.log("(Username found) leaderboardScorePercentage: ", leaderboardScorePercentage, "Score: ", + scoreAsPercentage);
                // if new score is higher, set the quiz attempt into the leaderboard                   
                if (leaderboardScorePercentage < scoreAsPercentage) {
                    console.log("score improved, replacing leaderboard entry");
                    const leaderboardData = {
                        username: currentUsername,
                        scorePercentage: scoreAsPercentage,
                        timeInSeconds: totalTimeInSeconds,
                    };
                    // Update old leaderboard entry                            
                    if(leaderboardData.username != null) {                         
                        set(leaderboardPath, leaderboardData);
                    }
                    // Notify new high score
                    newHighScore.style.display = "flex";
                }
                // if score is the same, but the time has improved, replace in leaderboard
                else if ((leaderboardScorePercentage == scoreAsPercentage)
                        && (totalTimeInSeconds < leaderboardTimeInSeconds)) {
                    console.log("time improved, replacing leaderboard entry");
                    const leaderboardData = {
                        username: currentUsername,
                        scorePercentage: scoreAsPercentage,
                        timeInSeconds: totalTimeInSeconds,
                    };
                    // Update old leaderboard entry
                    if(leaderboardData.username != null) {                         
                        set(leaderboardPath, leaderboardData);
                    }
                    // Notify new high score
                    newHighScore.style.display = "flex";
                }
                // Set found to true to prevent adding to list again and to stop 
                found = true;
                return;// Exit the loop since we found the entry
            }
 
        });

        if(!found)
        {
            console.log("username wasn't in leaderboard, adding")
            const leaderboardData = {
                username: currentUsername,
                scorePercentage: scoreAsPercentage,
                timeInSeconds: totalTimeInSeconds,
            };
            if(leaderboardData.username != null) {
                push(leaderboardRef, leaderboardData); //works correctly
                newHighScore.style.display = "flex";
            }        
        }

    } else {
        // If there is no existing leaderboard data, create a new entry
        //console.log("no leaderboards exist, adding")
        const leaderboardData = {
            username: currentUsername,
            scorePercentage: scoreAsPercentage,
            timeInSeconds: totalTimeInSeconds,
        };
        //console.log(leaderboardData.username);
        if(leaderboardData.username != null) {
            push(leaderboardRef, leaderboardData); //works correctly
            newHighScore.style.display = "flex";
        }     
    }
}

async function updateStudyTimeLeaderboardInDB(currentUsername, timeToAdd){
    // Reference to the user node based on the username
    const userRef = ref(database, `/totalStudyTime/${currentUsername}`);

    // Retrieve the existing data
    const userData = await get(userRef);

    // Check if the user exists
    if (userData.exists()) {
        // Retrieve the current totalTime
        const currentTotalTime = userData.val().totalTime;

        // Calculate the new totalTime by adding the time to add
        const newTotalTime = currentTotalTime + timeToAdd;
        const leaderboardData = {
            username: currentUsername,
            totalTime: newTotalTime,
        }
        // Update the database with the new totalTime
        if(leaderboardData.username != null) {
            set(userRef, leaderboardData);            
        }
        //console.log(`Total time updated for user ${currentUsername}. New total time: ${newTotalTime}`);
    } else {
        console.log(`User ${currentUsername} not found. Adding new entry.`);
        const leaderboardData = {
            username: currentUsername,
            totalTime: timeToAdd,
        }
        // Update the database with the new totalTime
        if(leaderboardData.username != null) {
            set(userRef, leaderboardData);            
        }
        //console.log(`Total time updated for user ${currentUsername}. New total time: ${timeToAdd}`);
    }
}

function generateIncorrectListItem(correctTerm, correctDefinition, yourAnswer) {
    // Create list item element
    const listItem = document.createElement("li");
    listItem.classList.add("quiz-li2", "list-item");
  
    // Append the term 
    const correctTermSpan = document.createElement("span");
    correctTermSpan.classList.add("quiz-correct-answer");
    correctTermSpan.textContent = correctTerm;
    listItem.appendChild(correctTermSpan);

    // Create and append the correct answer heading
    const correctAnswerHeading = document.createElement("h2");
    correctAnswerHeading.classList.add("quiz-correct-answer-heading");
    correctAnswerHeading.innerHTML = `<span>Correct Answer:</span><br />`;
    listItem.appendChild(correctAnswerHeading);
  
    // Create and append the correct answer span
    const correctAnswerSpan = document.createElement("span");
    correctAnswerSpan.classList.add("quiz-correct-answer1");
    correctAnswerSpan.innerHTML = `<span>${correctDefinition}</span><br />`;
    listItem.appendChild(correctAnswerSpan);
  
    // Create and append the your answer heading
    const yourAnswerHeading = document.createElement("h2");
    yourAnswerHeading.classList.add("quiz-your-answer-heading");
    yourAnswerHeading.innerHTML = `<span>Your Answer:</span><br />`;
    listItem.appendChild(yourAnswerHeading);
  
    // Create and append the your answer span
    const yourAnswerSpan = document.createElement("span");
    yourAnswerSpan.classList.add("quiz-your-answer");
    yourAnswerSpan.innerHTML = `<span>${yourAnswer}</span><br />`;
    listItem.appendChild(yourAnswerSpan);
    
    incorrectAnswerList.appendChild(listItem);
  }

  // Function to get the username associated with a userUID
const getUsernameForUserUID = async (targetUserUID) => {
    try {
        const usernamesSnapshot = await get(usernamesDB);

        if (usernamesSnapshot.exists()) {
            let foundUsername = null;

            usernamesSnapshot.forEach((firebaseIdentifierSnapshot) => {
                const userUID = firebaseIdentifierSnapshot.child("userUID").val();
                const username = firebaseIdentifierSnapshot.child("username").val();

                if (userUID === targetUserUID) {
                    // Found the matching userUID, save the username
                    foundUsername = username;
                }
            });
            //console.log("current username: " + foundUsername);
            return foundUsername;
        }
        else{
            //console.error("usernames snapshot doesn't exist");
        }
    } catch (error) {
        //console.error("Error getting username for userUID:", error);
        return null;
    }
};

function calculateAverage(floatArray) {
    // Ensure the array is not empty to avoid division by zero
    if (floatArray.length === 0) {
        return 0;
    }
    
    // Sum up all values in the array
    const sum = floatArray.reduce((acc, val) => acc + val, 0);
    
    // Calculate the average
    const average = sum / floatArray.length;
    
    return average;
    }


// #endregion

// #region Display Leaderboard
async function updateLeaderboardList() {
    // Clear leaderboard
    leaderboardList.innerHTML = "";

    // Declare path related values
    const typedQuizPath = leaderboardFormatSelect.value;
    const randomQuizPath = leaderboardQuestionOrderSelect.value;
    const answerTypePath = leaderboardAnswerTypeSelect.value;

    // Create the path to the relevant directory
    const leaderboardRef = ref(database, `quizzes/${quizID}/leaderboards/${typedQuizPath}/${randomQuizPath}/${answerTypePath}/`);

    // Retrieve leaderboard data
    const leaderboardSnapshot = await get(leaderboardRef);

    // Check if there is existing leaderboard data
    if (leaderboardSnapshot.exists()) {
        // start placement at 1
        let leaderboardPlacement = 1;

        // Convert the leaderboardSnapshot to an array to sort
        let sortedLeaderboard = [];
        leaderboardSnapshot.forEach((entry) => {
            sortedLeaderboard.push(entry.val());
        });
    
        // Sort the array primarily based on scorePercentage and secondarily on timeInSeconds
        sortedLeaderboard.sort((a, b) => { // TimSort, hybrid of merge and insertion sort
            if (a.scorePercentage !== b.scorePercentage) {
                return b.scorePercentage - a.scorePercentage; // Sort by scorePercentage in descending order (high score at top)
            } else {
                return a.timeInSeconds - b.timeInSeconds; // Sort by timeInSeconds in ascending order (lowest time at top)
            }
        });       

        // Iterate over existing leaderboard data
        sortedLeaderboard.forEach((leaderboardEntry) => {
            const username = leaderboardEntry.username;
            const scorePercentage = leaderboardEntry.scorePercentage;
            let timeInSeconds = leaderboardEntry.timeInSeconds;

            // Create an LI element for each leaderboard entry
            const listItem = document.createElement("li");
            listItem.classList.add("listItemLB");

            // Create and append the left span
            const leftSpan = document.createElement("span");
            leftSpan.classList.add("leaderboard-left");
            leftSpan.textContent = leaderboardPlacement + ".\t\t\t\t" + username;
            listItem.appendChild(leftSpan);

            const middleSpan = document.createElement("span");
            middleSpan.classList.add("leaderboard-middle");
            const scoreString = parseFloat((scorePercentage*100).toFixed(1));
            middleSpan.textContent = `${scoreString}%`;
            listItem.appendChild(middleSpan);

            // Create and append the right span
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

// #endregion
  

