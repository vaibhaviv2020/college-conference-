import { signInWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import { auth } from "../firebase.js";

document
.getElementById("loginBtn")
.addEventListener("click", login);

async function login() {

    const email =
    document.getElementById("email").value;

    const password =
    document.getElementById("password").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        alert("Login Successful");

        window.location.href =
        "dashboard.html";

    } catch (error) {

        alert(error.message);

    }

}