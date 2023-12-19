import { auth, push, get, set, quizzesDB, usernamesDB, database, ref } from './firebaseInit.js';
//import * as XLSX from '../packages/node_modules/xlsx/dist/xlsx.full.min.js';

// Get the value of a query parameter from the URL
// Here, this will be used to edit the quiz
const getQueryParam = (name) => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get(name);
  };
  
// Elements and variables
const quizID = getQueryParam("quizID");

// Check user authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User is signed in:", user);
        finishButton.addEventListener("click", () => addQuizToDatabase(user));
    } else {
        console.log("User is currently signed out");

        window.location.href = "index.html"; // Redirect to home page
    }
    editQuizContent();
});

// Elements
const titleField = document.getElementById("EnterTitle");
const genreSelect = document.getElementById("Genre");
const visibilitySelect = document.getElementById("Visibility");
const finishButton = document.getElementById("Finish");
const newDefButton = document.getElementById("AddNewDefinition");
const definitionList = document.getElementById("DefinitionList");
const logoutMobile = document.getElementById("LogoutButtonMobile");
const logoutDesktop = document.getElementById("LogoutButtonDesktop");
const excelButton = document.getElementById("UploadExcelSheet");
const notification = document.getElementById("Notification");
const notificationText = document.getElementById("NotificationText");
let definitionCount = 0; // Keep track of the number of definitions
let quizCreated = false; // prevent multiple submissions
let originalCreationDate;
let originalLikeCount;

// Listeners
newDefButton.addEventListener("click", createNewDefinition);

excelButton.addEventListener("click", uploadExcel);

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
  
// Function to create a new list item
function createNewDefinition(termsAndDefArray=null, setValues=false) {
  definitionCount++;
  //console.log(definitionCount);

  // Create the list item
  const listItem = document.createElement("li");
  listItem.classList.add("create-quiz-li", "list-item");

  // Create a container div
  const containerDiv = document.createElement("div");
  containerDiv.classList.add("create-quiz-container2");

  // Create a heading
  const heading = document.createElement("h2");
  heading.classList.add("create-quiz-term");
  heading.innerHTML = '<span>New Definition:</span><br />';
  
  // Create input fields
  const titleInput = createInputElement("text", "Enter Term", "create-quiz-textinput2");
  console.log(termsAndDefArray);
  if(setValues) titleInput.value = String(termsAndDefArray[0]).trim();
  const textareaInput = createInputElement("textarea", "Enter Definition", "create-quiz-textarea");
  if(setValues) textareaInput.textContent = String(termsAndDefArray[1]).trim();

  // Create container for buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("create-quiz-container3");

  // Create buttons
  const moveUpButton = createButtonElement("Move Up", "create-quiz-button2", `moveUp_${definitionCount}`);
  const moveDownButton = createButtonElement("Move Down", "create-quiz-button2", `moveDown_${definitionCount}`);
  const deleteButton = createButtonElement("Delete", "create-quiz-button3", `delete_${definitionCount}`);

  // Add event listeners to buttons
  moveUpButton.addEventListener("click", () => moveDefinition(listItem, -1));
  moveDownButton.addEventListener("click", () => moveDefinition(listItem, 1));
  deleteButton.addEventListener("click", () => deleteDefinition(listItem));

  // Append elements to the container div
  containerDiv.appendChild(heading);
  containerDiv.appendChild(titleInput);
  containerDiv.appendChild(textareaInput);
  containerDiv.appendChild(buttonContainer);
  buttonContainer.appendChild(moveUpButton);
  buttonContainer.appendChild(moveDownButton);
  buttonContainer.appendChild(deleteButton);

  // Append the container div to the list item
  listItem.appendChild(containerDiv);

  // Append the new list item to the definitionList
  definitionList.appendChild(listItem);
}

// Function to create input elements with unique IDs
function createInputElement(type, placeholder, className) {
    const input = type.toLowerCase() === 'textarea' 
        ? document.createElement('textarea')
        : document.createElement('input');

    if (type.toLowerCase() === 'input') {
        input.type = 'text';
    }

    input.placeholder = placeholder;
    input.classList.add(className);
    input.id = `${type}_${definitionCount}`;
    return input;
}

// Function to create button elements with unique IDs
function createButtonElement(text, className, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.classList.add(className);
  button.id = id;
  return button;
}

// Function to move a definition up or down in the list
function moveDefinition(definition, direction) {
  const index = Array.from(definitionList.children).indexOf(definition);
  const newIndex = index + direction;

  if (newIndex >= 0 && newIndex < definitionList.children.length) {
    definitionList.removeChild(definition);
    definitionList.insertBefore(definition, definitionList.children[newIndex]);
  }
}

// Function to delete a definition from the list
function deleteDefinition(definition) {
  definitionList.removeChild(definition);
}

// Function to add the quiz to the database
async function addQuizToDatabase(user) {
    // Get data for the quiz
    let title = titleField.value.trim();
    //replace with safe characters, double checked by database
    title = title.replaceAll('<','\uFF1C');
    title = title.replaceAll('>','\uFF1E');
    //console.log(title);
    if (title === "") {
        showNotification("Title Required");
        console.log("Title is empty or contains only spaces");
        return;
    }
    const creatorUID = auth.currentUser.uid; // Assuming you are using Firebase authentication
    const creatorUsername = await getUsernameForUserUID(user.uid);
    const creationDate = new Date().toLocaleDateString("en-US"); // MM/DD/YY format
    const likeCount = 0; // Initial like count
    const genre = genreSelect.value;
    const visibility = visibilitySelect.value;

    // Structure the quiz data    
    let quizData = {
        title: title.trim(),
        creatorUID: creatorUID,
        creatorUsername: creatorUsername,
        creationDate: creationDate,
        likeCount: likeCount,
        genre: genre,
        leaderboards: [],
        quizContent: getQuizContent(),
        visibility: visibility,
    };    
    
    if(quizData.quizContent.length < 1)
    {
        console.log("Need at least one term");
        showNotification("Quiz Empty");
        return;
    }

    if(!quizCreated)
    {
        quizCreated = true;

        // If editting
        if(quizID!=null) {
            console.log("quizID is not null");
            const quizRef = ref(database, 'quizzes/' + quizID);
            const quizSnapshot = await get(quizRef); // Corrected this line
            quizData.creationDate = originalCreationDate;
            quizData.likeCount = originalLikeCount;
            if(auth.currentUser.uid == quizSnapshot.val().creatorUID)
            {
                set(quizRef, quizData);
                window.location.href = `quiz.html?quizID=${quizID}`;                            
            }
            else{
                console.log("Invalid user edit");
                window.location.href = "my-quizzes.html";         
            }

        }
        // If new quiz
        else{
            push(quizzesDB, quizData)
                .then((ref) => {
                    // Get the ID from the reference
                    const docID = ref.key;
                
                    console.log("Quiz added to the database with ID:", docID);
                    // Redirect or perform any other action after adding the quiz
                    // For example, you can redirect to another page
                    window.location.href = "my-quizzes.html";
                })
                .catch((error) => {
                console.error("Error adding quiz to the database:", error);
                quizCreated = false;
            });              
        }
        

      
    }

  }

  // Function to get quiz content from list items
function getQuizContent() {
    const quizContent = [];
    const listItems = definitionList.children;
  
    for (const listItem of listItems) {
      let termInput = listItem.querySelector(".create-quiz-textinput2");
      let definitionInput = listItem.querySelector(".create-quiz-textarea");

      let term = String(termInput.value.trim());
      let definition = String(definitionInput.value.trim());
      //replace with safe characters, double checked by data
      term = term.replaceAll('<','\uFF1C');
      term= term.replaceAll('>','\uFF1E');
      definition =  definition.replaceAll('<','\uFF1C');
      definition=  definition.replaceAll('>','\uFF1E');
  
      // Only add non-empty terms and definitions
      if (term !== "" && definition !== "") 
      {
        // Only add non-empty terms and definitions
        const spaceRegex = /^\s*$/; // Regular expression to match strings consisting of only spaces

        if (!spaceRegex.test(term) && !spaceRegex.test(definition)) {
            quizContent.push({ term, definition });
        }
        else
        {
            console.log("All spaces detected for a term or definition, ignored");
        }
      }
      else
      {
        console.log("Null input for a term or definition, ignored");
      }
    }
  
    return quizContent;
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

            return foundUsername;
        }
    } catch (error) {
        console.error("Error getting username for userUID:", error);
        return null;
    }
};

function uploadExcel() {
    console.log("upload excel called");
    const input = document.createElement('input');
    input.type = 'file';

    input.addEventListener('change', (event) => {
        const file = event.target.files[0];

        if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Assuming only one sheet in the workbook
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Convert sheet data to array
            const array = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Filter out rows with missing (or all spaces, empty string) elements in col 1 and col 2
            const filteredArray = array.filter(row => row[0] && row[1]
                                                   && String(row[0]).trim() != 0 
                                                   && String(row[1]).trim() != 0);

            filteredArray.forEach((row) => {// each element in array represents a row in the excel file
                row.length = 2; // trim excess columns
            });

            //console.log(filteredArray);
            setTermsAndDefinitions(filteredArray);
            } catch (error) {
            console.error('Error reading Excel file:', error);
            }
        };

        reader.readAsArrayBuffer(file);
        }
    });

    // Trigger the above file input
    input.click();
}

// Used to create definitions for both .xlsx files and editting quizzes
function setTermsAndDefinitions(termsAndDefinitionsArray) {

    //reset current definition list
    definitionList.innerHTML = '';

    termsAndDefinitionsArray.forEach((definition) => {
        createNewDefinition(definition, true);
    });

}

function showNotification(message) {
    // Set the text content of the notification
    notificationText.textContent = message;
    // Set display to "flex" to show the notification
    notification.style.display = 'flex';

    // After 3 seconds set display back to "none" to hide the notification
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

async function editQuizContent() {
    // Check if editting a quiz
    if(quizID != null) {
        fetchQuizData(quizID);
    }
}

// Fetch quiz data and update the page
const fetchQuizData = async (quizID) => {
    try {
        const quizRef = ref(database, 'quizzes/' + quizID);
        console.log("quiz ref: ", quizRef);

        const quizSnapshot = await get(quizRef); // Corrected this line

        if (quizSnapshot.exists()) {
            const quizData = quizSnapshot.val();
            console.log("quiz data: ", quizData);
            const termsAndDefinitions = quizData.quizContent;
            // convert into decimal index array
            let newArray = []
            for(let i = 0; i < termsAndDefinitions.length; i++) {
                newArray.push([termsAndDefinitions[i].term,termsAndDefinitions[i].definition]);
            }
            // Set quiz title
            titleField.value = quizData.title;
            // populate definitions list with quiz data
            setTermsAndDefinitions(newArray);
            //console.log(newArray);
            // If editting, we dont want to change the creation date so we keep a reference to the original
            originalCreationDate = quizData.creationDate;
            originalLikeCount = quizData.likeCount;
        } else {
            console.error("Quiz not found");
        }
    } catch (error) {
        console.error("Error fetching quiz data:", error);
        window.location.href = "index.html"; // Redirect to home page
    }
};

  
