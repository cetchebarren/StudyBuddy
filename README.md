# StudyBuddy — Customizable Study & Memorization Web App

StudyBuddy was created at the request of law students who couldn’t find a study tool that *quite* fit their needs — but it was designed to be useful for anyone.

Repetition is essential for retaining information and recalling it under pressure. StudyBuddy embraces that philosophy by giving learners the ability to study *their* way. With flexible quiz modes, Excel import, accuracy scoring, and leaderboards, users can drill material until it’s fully locked in. Good luck on your exams!

Project overview & showcase: **https://cetchebarren.github.io/projects/studybuddy.html**

Hosted at: **https://studybuddy-94158.web.app/**

---

## 🧰 Tech Stack

- **HTML5** — UI structure  
- **CSS3** — responsive layout, theming, and components  
- **JavaScript (ES Modules)** — quiz engine, timers, accuracy logic, Excel parsing  
- **Firebase Authentication** — secure login and user accounts  
- **Firebase Firestore** — quizzes, user data, scores, leaderboards  
- **Firebase Hosting** — deployment  
- **SheetJS (XLSX parsing)** — Excel import support  

---

## 🎯 Core Features

### Custom Quizzes
StudyBuddy allows users to create their own quizzes with a focus on convenience and flexibility.

- Fill out terms/definitions directly in the browser  
- **OR** upload a `.xlsx` spreadsheet to auto‑populate quiz content  
- Search, sort, and filter quizzes  
- Like quizzes for quick access  
- Share quizzes with classmates for collaborative studying  

### **Quiz Options**
Users can tailor each quiz to their preferred study style:

- Written or multiple‑choice format  
- Randomized or ordered questions  
- Choose whether to answer with the **term** or the **definition**  
- Shuffle distractors in multiple‑choice mode  
- Keep quizzes fresh to avoid memorizing the order instead of the content  

### **Quiz Features**
Each quiz includes:

- A built‑in timer  
- Immediate feedback after each question  
- Correct answer comparison  
- Accuracy‑based scoring for typed quizzes  
- Intelligent scoring that ignores non‑essential characters (punctuation, spacing)  
- Timer pauses during answer review to encourage reflection without penalty  

### **Leaderboards**
StudyBuddy includes two leaderboard systems:

- **Global Leaderboard** — ranks users by total study time  
- **Per‑Quiz Leaderboards** — each quiz tracks high scores for every combination of quiz options  

This lets users challenge themselves — or their friends — and see their progress over time.

---

## 📂 Project Structure
```
. 
├── index.html               # Landing page 
├── dashboard.html           # User dashboard 
├── quiz.html                # Quiz engine UI 
├── leaderboard.html         # Global leaderboard 
├── import.html              # Excel import workflow 
│ 
├── assets/ 
│   ├── css/ 
│   │   ├── global.css       # Global styles 
│   │   ├── layout.css       # Layout + responsive rules 
│   │   └── components.css   # Buttons, cards, modals, etc. 
│   │ 
│   ├── js/ 
│   │   ├── auth.js          # Firebase Auth logic 
│   │   ├── firestore.js     # Firestore reads/writes 
│   │   ├── quiz-engine.js   # Core quiz logic 
│   │   ├── import-xlsx.js   # Excel parsing 
│   │   ├── leaderboard.js   # Leaderboard logic 
│   │   └── ui.js            # UI helpers, animations 
│   │ 
│   └── images/              # Icons, logos, screenshots 
│ 
└── README.md 
```
---

## 🔧 Local Development

Because StudyBuddy uses Firebase services:
1. A Firebase project  
2. A valid `firebaseConfig` object  
3. Firebase Hosting or a local dev server  

Running locally:
npm install -g firebase-tools
firebase login
firebase init
firebase serve
Then open: http://localhost:5000


---

## 🎯 Goals of This Project

- Provide a flexible study tool for students  
- Support custom study workflows  
- Make importing and generating quizzes effortless  
- Track progress and improvement over time  
- Keep the UI clean, fast, and distraction‑free  

---

## 📬 Contact

- **Portfolio:** https://cetchebarren.github.io  
- **GitHub:** https://github.com/cetchebarren  
- **LinkedIn:** https://linkedin.com/in/chad-etchebarren/

---
