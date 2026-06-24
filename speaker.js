import { collection, getDocs }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import { db } from "./firebase.js";

console.log("speaker.js loaded");
async function loadSpeakers() {
    console.log("Loading speakers...");
    const statusEl = document.getElementById("speakerStatus");
    const listEl = document.getElementById("speakerList");

    try {
        const snapshot = await getDocs(collection(db, "speakers"));
        console.log("Loaded speakers count:", snapshot.size);

        if (snapshot.empty) {
            statusEl.style.display = "flex";
            listEl.style.display = "none";
            return;
        }

        let html = "";
        snapshot.forEach(doc => {
            const speaker = doc.data();
            const avatarHtml = speaker.photoUrl 
                ? `<img src="${speaker.photoUrl}" alt="${speaker.name}" class="keynote-img">`
                : `<div class="keynote-img-placeholder" style="width: 120px; height: 120px; border-radius: 8px; background: var(--grey-medium); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;"><i class="fas fa-user" style="font-size: 50px; color: var(--text-light);"></i></div>`;

            html += `
                <div class="keynote-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                    <div>
                        ${avatarHtml}
                        <h3 class="keynote-name" style="margin-top: 10px;">${speaker.name || 'Speaker'}</h3>
                        <p class="keynote-desc" style="color: var(--orange); font-size: 12px; margin-bottom: 12px;">${speaker.title || 'Keynote Speaker'}</p>
                        <p style="font-size: 13.5px; color: var(--text-light); line-height: 1.6; text-align: justify; margin: 0;">${speaker.bio || ''}</p>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = html;
        statusEl.style.display = "none";
        listEl.style.display = "grid";
    } catch (error) {
        console.error("Error loading speakers from Firebase:", error);
        // Fallback to showing TBA if load fails (e.g. offline, connection block)
        statusEl.style.display = "flex";
        listEl.style.display = "none";
    }
}

loadSpeakers();