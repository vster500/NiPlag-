
import { db, auth } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const ADMIN_UID = "hSrcvZLpvBSAY9RguhhsbulFrnF3";
const status = document.getElementById("storage-status");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    status.textContent = "No authenticated user detected.";
    return;
  }

  status.textContent =
    "Signed in. Checking administrator identity...";

  if (user.uid !== ADMIN_UID) {
    status.textContent = "Wrong administrator UID: " + user.uid;
    return;
  }

  status.textContent = "Admin confirmed. Reading products...";

  try {
    const result = await getDocs(collection(db, "products"));

    status.textContent =
      "SUCCESS: Admin confirmed. Project: niplag-637d1. " +
      "Products found: " + result.size +
      ". Document IDs: " +
      result.docs.map(doc => doc.id).join(", ");
  } catch (error) {
    console.error("Firebase diagnostic error:", error);

    status.textContent =
      "ERROR: " + error.code + " — " + error.message;
  }
});
      
