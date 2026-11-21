
import { db, auth } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const status = document.getElementById("storage-status");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    status.textContent = "No user signed in.";
    return;
  }

  status.textContent = "Checking published products...";

  try {
    const q = query(
      collection(db, "products"),
      where("status", "==", "published")
    );

    const result = await getDocs(q);

    status.textContent =
      "Published products found: " + result.size +
      " | IDs: " +
      result.docs.map(item => item.id).join(", ") +
      " | Signed-in UID: " + user.uid;

  } catch (error) {
    status.textContent =
      "ERROR: " + error.code + " — " + error.message;
  }
});
