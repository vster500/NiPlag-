
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
  if (!user || user.uid !== ADMIN_UID) {
    status.textContent = "Admin authentication failed.";
    return;
  }

  try {
    const result = await getDocs(collection(db, "products"));

    status.textContent =
      "SUCCESS. Products found: " + result.size +
      ". IDs: " +
      result.docs.map(item => item.id).join(", ");

  } catch (error) {
    status.textContent =
      "ERROR: " + error.code + " — " + error.message;
    console.error(error);
  }
});
      
