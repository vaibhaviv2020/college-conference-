import { collection, getDocs }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import { db } from "./firebase.js";

console.log("speaker.js loaded");
async function loadSpeakers() {

    console.log("Loading speakers...");
    const snapshot = await getDocs(
        collection(db, "speakers")
    );
    console.log(snapshot.size);

    let html = "";

    snapshot.forEach(doc => {
    console.log(doc.data());

    const speaker = doc.data();

    html += `
        <div>
            <h3>${speaker.name}</h3>
            <p>${speaker.title}</p>
            <p>${speaker.bio}</p>
        </div>
    `;
});

    document.getElementById("speakerList").innerHTML = html;
}

loadSpeakers();