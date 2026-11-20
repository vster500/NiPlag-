
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const ADMIN_UID = "hSrcvZLpvBSAY9RguhhsbulFrnF3";

// Hide the dashboard until the account is checked.
document.documentElement.style.visibility = "hidden";

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== ADMIN_UID) {
    if (user) await signOut(auth);

    window.location.replace("admin-login.html");
    return;
  }

  // Only the authorised administrator reaches this point.
  document.documentElement.style.visibility = "visible";

  const logoutButton = document.createElement("button");
  logoutButton.textContent = "Admin Logout";
  logoutButton.className = "btn btn-outline";
  logoutButton.style.margin = "12px";

  logoutButton.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("admin-login.html");
  });

  document.body.prepend(logoutButton);
});
