import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import { auth } from "../firebase.js";

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
    }

});

import { collection, addDoc }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import { db } from "../firebase.js";

document
.getElementById("saveSpeaker")
.addEventListener("click", async () => {

    try {

        await addDoc(collection(db, "speakers"), {
            name: document.getElementById("speakerName").value,
            title: document.getElementById("speakerTitle").value,
            bio: document.getElementById("speakerBio").value
        });

        document.getElementById("message").innerText =
            "Speaker saved successfully!";

    } catch (error) {
        console.error(error);
        document.getElementById("message").innerText =
            error.message;
    }

});