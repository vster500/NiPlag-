
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
  if (!user || user.uid !== ADMIN_UID) return;

  status.textContent = "Connecting to NiPlag database...";

  try {
    const result = await getDocs(collection(db, "products"));

    status.textContent =
      "Firebase connected successfully. Products found: " +
      result.size;
  } catch (error) {
    console.error("Firebase connection error:", error);

    status.textContent =
      "Firebase connection failed: " + error.message;
  }
});
