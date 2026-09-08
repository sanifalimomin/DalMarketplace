// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
 apiKey: "AIzaSyBKeqx2loev_lU0zt9gsojJqfvRj06b0zw",
 authDomain: "dalmarketplace.firebaseapp.com",
 databaseURL: "https://dalmarketplace-default-rtdb.firebaseio.com",
 projectId: "dalmarketplace",
 storageBucket: "dalmarketplace.firebasestorage.app",
 messagingSenderId: "35941424638",
 appId: "1:35941424638:web:eea61967196d60486eb4af",
 measurementId: "G-VB341HE0FY"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
