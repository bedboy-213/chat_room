// firebase.js
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require("firebase/auth");
const { getDatabase, ref, set } = require("firebase/database");

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDLbKgsSz2GzZ-FPBNkl7LqtbdvbcsBqHA",
  authDomain: "hackers-700.firebaseapp.com",
  databaseURL: "https://hackers-700-default-rtdb.firebaseio.com",
  projectId: "hackers-700",
  storageBucket: "hackers-700.firebasestorage.app",
  messagingSenderId: "979338443796",
  appId: "1:979338443796:web:278e5ccde0486e71c23b01",
  measurementId: "G-81PH8GE8BE"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

module.exports = { auth, database, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, ref, set };
