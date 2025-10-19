const firebaseConfig = {
    apiKey: "AIzaSyBQ866cQlmVXThfwN9SnHQYOBX7BvzjTmM",
    authDomain: "alterga-transport.firebaseapp.com",
    projectId: "alterga-transport",
    storageBucket: "alterga-transport.firebasestorage.app",
    messagingSenderId: "463464540409",
    appId: "1:463464540409:web:93eeff6db565435d1c9a28"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
