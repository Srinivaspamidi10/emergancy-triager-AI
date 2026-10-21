    import { initializeApp } from "firebase/app";
    import { getAnalytics } from "firebase/analytics";
    import { getFirestore } from "firebase/firestore"; // 1. Import Firestore

    const firebaseConfig = {
    apiKey: "AIzaSyCmQeoa7twUb9iN6onSnN3MDIXvy17So1A",
    authDomain: "emergency-triage-app.firebaseapp.com",
    projectId: "emergency-triage-app",
    storageBucket: "emergency-triage-app.firebasestorage.app",
    messagingSenderId: "742995988474",
    appId: "1:742995988474:web:ca24ab565425dbf23a1e43",
    measurementId: "G-CK2RWXV3FH"
    };

    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);

    // 2. Initialize and export the database so you can use it in App.jsx
    export const db = getFirestore(app);