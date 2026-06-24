// admin.js - Controller for Admin Login & Dashboard

import { auth, db } from "../firebase.js";
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Global Toast System
function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
        toast.classList.add("toast-out");
        toast.addEventListener("animationend", () => {
            toast.remove();
        });
    }, 4000);
}

// Global Modal System
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
}

// Activity Log Helper
function logActivity(action, content, desc = "") {
    const logs = JSON.parse(localStorage.getItem("admin_activity_logs") || "[]");
    const newLog = {
        action, // 'create', 'edit', 'delete', 'system'
        content,
        desc,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    logs.unshift(newLog);
    // Keep last 10 logs
    if (logs.length > 10) logs.pop();
    localStorage.setItem("admin_activity_logs", JSON.stringify(logs));
    updateActivityPanel();
}

function updateActivityPanel() {
    const list = document.getElementById("activityTimeline");
    if (!list) return;

    const logs = JSON.parse(localStorage.getItem("admin_activity_logs") || "[]");
    
    if (logs.length === 0) {
        list.innerHTML = `
            <li class="timeline-item system">
                <div class="timeline-marker"></div>
                <div class="timeline-info">
                    <span class="timeline-time">Just Now</span>
                </div>
                <div class="timeline-content">No recent activity</div>
                <p class="timeline-desc">Perform CRUD operations to see logs here.</p>
            </li>
        `;
        return;
    }

    list.innerHTML = logs.map(log => `
        <li class="timeline-item ${log.action}">
            <div class="timeline-marker"></div>
            <div class="timeline-info">
                <span class="timeline-time">${log.timestamp}</span>
            </div>
            <div class="timeline-content">${log.content}</div>
            ${log.desc ? `<p class="timeline-desc">${log.desc}</p>` : ""}
        </li>
    `).join("");
}

// Prepopulate activity log if empty
if (!localStorage.getItem("admin_activity_logs")) {
    localStorage.setItem("admin_activity_logs", JSON.stringify([
        { action: "system", content: "Admin Panel initialized", desc: "Successfully loaded secure dashboard elements.", timestamp: "10:30 AM" },
        { action: "system", content: "Connected to Firebase", desc: "Established real-time sync with Cloud Firestore.", timestamp: "10:31 AM" }
    ]));
}

// Initialize Admin Panel Code Routing
document.addEventListener("DOMContentLoaded", () => {
    // Determine Page
    const loginForm = document.getElementById("loginForm");
    const dashboardBody = document.getElementById("dashboardBody");

    if (loginForm) {
        initLoginPage();
    } else if (dashboardBody) {
        initDashboardPage();
    }
});

/* ==========================================================================
   Login Page Logic
   ========================================================================== */
function initLoginPage() {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitBtn = document.getElementById("loginBtn");
    const togglePasswordBtn = document.getElementById("togglePassword");
    const errorBox = document.getElementById("errorBox");
    const errorText = document.getElementById("errorText");
    const rememberMe = document.getElementById("rememberMe");

    // Check pre-saved email
    if (localStorage.getItem("admin_remember_email")) {
        emailInput.value = localStorage.getItem("admin_remember_email");
        rememberMe.checked = true;
    }

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        togglePasswordBtn.querySelector("i").className = type === "password" ? "fas fa-eye" : "fas fa-eye-slash";
    });

    // Form Submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Hide previous errors
        errorBox.style.display = "none";
        
        // Form Validation
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showError("Please enter both email and password.");
            return;
        }

        // Show loading state
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            
            // Handle Remember Me
            if (rememberMe.checked) {
                localStorage.setItem("admin_remember_email", email);
            } else {
                localStorage.removeItem("admin_remember_email");
            }

            // Redirect to Dashboard
            window.location.href = "admin-dashboard.html";

        } catch (error) {
            console.error("Auth error:", error);
            let userFriendlyMsg = error.message;
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                userFriendlyMsg = "Invalid email or password. Please try again.";
            } else if (error.code === "auth/invalid-email") {
                userFriendlyMsg = "Please enter a valid email address.";
            }
            showError(userFriendlyMsg);
            submitBtn.classList.remove("loading");
            submitBtn.disabled = false;
        }
    });

    function showError(msg) {
        errorText.innerText = msg;
        errorBox.style.display = "flex";
    }
}

/* ==========================================================================
   Dashboard Page Logic
   ========================================================================== */
function initDashboardPage() {
    let speakersList = [];
    let editingSpeakerId = null;
    let deletingSpeakerId = null;

    // 1. Auth Guard
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "admin-login.html";
        } else {
            // Render Profile Info
            const nameEl = document.getElementById("adminProfileName");
            const avatarEl = document.getElementById("adminProfileAvatar");
            if (nameEl) nameEl.textContent = user.email.split("@")[0];
            if (avatarEl) avatarEl.textContent = user.email.charAt(0).toUpperCase();
            
            // Sync with DB
            syncSpeakers();
        }
    });

    // 2. Logout Action
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await signOut(auth);
                window.location.href = "admin-login.html";
            } catch (err) {
                showToast("Failed to sign out: " + err.message, "error");
            }
        });
    }

    // 3. Real-time Firestore Sync
    function syncSpeakers() {
        const tbody = document.getElementById("speakersTableBody");
        if (!tbody) return;

        // Show Skeleton Loader Initially
        tbody.innerHTML = `
            <tr class="skeleton-row"><td><div class="skeleton-text skeleton-name"></div><div class="skeleton-text skeleton-title"></div></td><td><div class="skeleton-text skeleton-bio"></div></td><td><div class="skeleton-text skeleton-actions"></div></td></tr>
            <tr class="skeleton-row"><td><div class="skeleton-text skeleton-name"></div><div class="skeleton-text skeleton-title"></div></td><td><div class="skeleton-text skeleton-bio"></div></td><td><div class="skeleton-text skeleton-actions"></div></td></tr>
            <tr class="skeleton-row"><td><div class="skeleton-text skeleton-name"></div><div class="skeleton-text skeleton-title"></div></td><td><div class="skeleton-text skeleton-bio"></div></td><td><div class="skeleton-text skeleton-actions"></div></td></tr>
        `;

        onSnapshot(collection(db, "speakers"), (snapshot) => {
            speakersList = [];
            snapshot.forEach(doc => {
                speakersList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Update Overview Cards
            updateOverviewStats();

            // Render Table Content
            renderSpeakersTable();
        }, (error) => {
            console.error("Firestore sync error:", error);
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--danger); padding: 20px;">Failed to sync data: ${error.message}</td></tr>`;
        });
    }

    // 4. Update Overview Stats
    function updateOverviewStats() {
        const totalSpeakersEl = document.getElementById("statTotalSpeakers");
        const totalUpdatesEl = document.getElementById("statTotalUpdates");
        const activePagesEl = document.getElementById("statActivePages");
        const recentChangesEl = document.getElementById("statRecentChanges");

        if (totalSpeakersEl) totalSpeakersEl.textContent = speakersList.length;
        
        // Compute mock analytics based on active pages and recent activity
        if (activePagesEl) activePagesEl.textContent = "12"; // index, cfp, committee, contact, publication, registrations, schedule, sessions, speaker, venue, awards, gallery
        
        const logs = JSON.parse(localStorage.getItem("admin_activity_logs") || "[]");
        if (recentChangesEl) recentChangesEl.textContent = logs.length;
        if (totalUpdatesEl) {
            // Compute lifetime edits
            let count = parseInt(localStorage.getItem("total_lifetime_edits") || "14");
            totalUpdatesEl.textContent = count;
        }
    }

    // Increments edit counter in localStorage
    function incrementEditCount() {
        let count = parseInt(localStorage.getItem("total_lifetime_edits") || "14");
        localStorage.setItem("total_lifetime_edits", count + 1);
    }

    // 5. Render Table with Search & Filters
    function renderSpeakersTable() {
        const tbody = document.getElementById("speakersTableBody");
        if (!tbody) return;

        const searchVal = document.getElementById("searchSpeaker").value.toLowerCase().trim();
        const filterVal = document.getElementById("filterTrack").value; // UI Filter

        // Filter local array
        let filtered = speakersList;

        if (searchVal) {
            filtered = filtered.filter(s => 
                (s.name && s.name.toLowerCase().includes(searchVal)) || 
                (s.title && s.title.toLowerCase().includes(searchVal)) ||
                (s.bio && s.bio.toLowerCase().includes(searchVal))
            );
        }

        // Render rows
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3">
                        <div class="empty-state">
                            <i class="fas fa-users-slash"></i>
                            <p>No speakers found matching the search criteria.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(speaker => `
            <tr>
                <td>
                    <div class="speaker-meta">
                        <span class="speaker-name-td">${speaker.name || "N/A"}</span>
                        <span class="speaker-title-td">${speaker.title || "No Title"}</span>
                    </div>
                </td>
                <td>
                    <div class="speaker-bio-td" title="${speaker.bio || ''}">${speaker.bio || "No bio entered."}</div>
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-icon preview btn-preview-speaker" data-id="${speaker.id}" title="Preview Card">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon edit btn-edit-speaker" data-id="${speaker.id}" title="Edit Speaker">
                            <i class="fas fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon delete btn-delete-speaker" data-id="${speaker.id}" title="Delete Speaker">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");

        // Attach Row Action Listeners
        document.querySelectorAll(".btn-preview-speaker").forEach(btn => {
            btn.addEventListener("click", () => {
                const sId = btn.getAttribute("data-id");
                showSpeakerPreview(sId);
            });
        });

        document.querySelectorAll(".btn-edit-speaker").forEach(btn => {
            btn.addEventListener("click", () => {
                const sId = btn.getAttribute("data-id");
                showEditForm(sId);
            });
        });

        document.querySelectorAll(".btn-delete-speaker").forEach(btn => {
            btn.addEventListener("click", () => {
                const sId = btn.getAttribute("data-id");
                showDeleteConfirm(sId);
            });
        });
    }

    // 6. Search & Filter Input Listeners
    const searchInput = document.getElementById("searchSpeaker");
    if (searchInput) {
        searchInput.addEventListener("input", renderSpeakersTable);
    }

    const filterSelect = document.getElementById("filterTrack");
    if (filterSelect) {
        filterSelect.addEventListener("change", renderSpeakersTable);
    }

    // 7. Modal Form Submit (Add/Edit)
    const speakerForm = document.getElementById("speakerForm");
    if (speakerForm) {
        speakerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("speakerName").value.trim();
            const title = document.getElementById("speakerTitle").value.trim();
            const bio = document.getElementById("speakerBio").value.trim();

            if (!name || !title || !bio) {
                showToast("Please fill in all speaker fields.", "error");
                return;
            }

            const submitBtn = speakerForm.querySelector("button[type='submit']");
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;

            try {
                if (editingSpeakerId) {
                    // Update CRUD
                    await updateDoc(doc(db, "speakers", editingSpeakerId), { name, title, bio });
                    showToast("Speaker updated successfully!");
                    logActivity("edit", `Edited speaker "${name}"`, `Updated profile details for speaker.`);
                    incrementEditCount();
                } else {
                    // Create CRUD
                    await addDoc(collection(db, "speakers"), { name, title, bio });
                    showToast("Speaker added successfully!");
                    logActivity("create", `Added speaker "${name}"`, `Registered new speaker to database.`);
                    incrementEditCount();
                }

                closeModal("speakerModal");
                speakerForm.reset();
                editingSpeakerId = null;

            } catch (error) {
                console.error("Save speaker error:", error);
                showToast("Failed to save speaker: " + error.message, "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // 8. Open Add Form Trigger
    const btnAddSpeaker = document.getElementById("btnAddSpeaker");
    if (btnAddSpeaker) {
        btnAddSpeaker.addEventListener("click", () => {
            editingSpeakerId = null;
            document.getElementById("modalTitle").textContent = "Add Speaker";
            speakerForm.reset();
            openModal("speakerModal");
        });
    }

    // 9. Load speaker data for Edit
    function showEditForm(id) {
        const speaker = speakersList.find(s => s.id === id);
        if (!speaker) return;

        editingSpeakerId = id;
        document.getElementById("modalTitle").textContent = "Edit Speaker Details";
        document.getElementById("speakerName").value = speaker.name || "";
        document.getElementById("speakerTitle").value = speaker.title || "";
        document.getElementById("speakerBio").value = speaker.bio || "";
        
        openModal("speakerModal");
    }

    // 10. Open Delete Confirmation Modal
    function showDeleteConfirm(id) {
        const speaker = speakersList.find(s => s.id === id);
        if (!speaker) return;

        deletingSpeakerId = id;
        document.getElementById("deleteSpeakerName").textContent = speaker.name;
        openModal("deleteConfirmModal");
    }

    // 11. Confirm Delete Action
    const btnConfirmDelete = document.getElementById("btnConfirmDelete");
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener("click", async () => {
            if (!deletingSpeakerId) return;

            const speaker = speakersList.find(s => s.id === deletingSpeakerId);
            const name = speaker ? speaker.name : "Speaker";

            btnConfirmDelete.disabled = true;
            btnConfirmDelete.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Deleting...`;

            try {
                await deleteDoc(doc(db, "speakers", deletingSpeakerId));
                showToast(`Deleted ${name} successfully.`);
                logActivity("delete", `Deleted speaker "${name}"`, `Removed speaker record from Firestore.`);
                incrementEditCount();
                closeModal("deleteConfirmModal");
            } catch (error) {
                console.error("Delete error:", error);
                showToast("Failed to delete speaker: " + error.message, "error");
            } finally {
                btnConfirmDelete.disabled = false;
                btnConfirmDelete.innerHTML = "Yes, Delete";
                deletingSpeakerId = null;
            }
        });
    }

    // 12. Show Speaker Card Preview
    function showSpeakerPreview(id) {
        const speaker = speakersList.find(s => s.id === id);
        if (!speaker) return;

        const container = document.getElementById("speakerPreviewContainer");
        if (!container) return;

        container.innerHTML = `
            <div class="preview-speaker-card">
                <div class="preview-speaker-avatar">
                    <i class="fas fa-user-tie"></i>
                </div>
                <h4 class="preview-speaker-name">${speaker.name}</h4>
                <div class="preview-speaker-title">${speaker.title}</div>
                <p class="preview-speaker-bio">${speaker.bio}</p>
            </div>
        `;

        openModal("previewModal");
    }

    // 13. Settings Form Submission (Simulated save / LocalStorage)
    const settingsForm = document.getElementById("settingsForm");
    if (settingsForm) {
        // Load settings values
        document.getElementById("siteTitle").value = localStorage.getItem("conf_site_title") || "VISTA 2027";
        document.getElementById("siteEmail").value = localStorage.getItem("conf_site_email") || "hvmhetre@bvucoep.edu.in";
        document.getElementById("siteVenue").value = localStorage.getItem("conf_site_venue") || "Bharti Vidyapeeth COE, Pune";

        settingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const title = document.getElementById("siteTitle").value.trim();
            const email = document.getElementById("siteEmail").value.trim();
            const venue = document.getElementById("siteVenue").value.trim();

            localStorage.setItem("conf_site_title", title);
            localStorage.setItem("conf_site_email", email);
            localStorage.setItem("conf_site_venue", venue);

            showToast("Settings saved successfully!");
            logActivity("system", "Updated website settings", "Saved general metadata settings to configuration.");
            incrementEditCount();
            updateOverviewStats();
        });
    }

    // 14. Sidebar Panel Switching
    const menuItems = document.querySelectorAll(".sidebar-item");
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const target = item.getAttribute("data-target");

            // Update sidebar active class
            menuItems.forEach(mi => mi.classList.remove("active"));
            item.classList.add("active");

            // Hide all panel sections
            document.querySelectorAll(".panel-section").forEach(sec => {
                sec.style.display = "none";
            });

            // Show active section
            const targetSec = document.getElementById(target);
            if (targetSec) targetSec.style.display = "block";
        });
    });

    // Modal Close Button handlers
    document.querySelectorAll(".btn-close-modal, .btn-cancel").forEach(btn => {
        btn.addEventListener("click", () => {
            closeModal("speakerModal");
            closeModal("deleteConfirmModal");
            closeModal("previewModal");
        });
    });

    // Initialize Activity Timeline
    updateActivityPanel();
}
