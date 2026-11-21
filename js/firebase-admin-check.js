
import { db, auth } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  getDoc
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

  status.textContent = "Running Firestore document tests...";

  try {
    const exactDoc = await getDoc(
      doc(db, "products", "hHe3Blf79yi56cEBW6Fx")
    );

    const lower = await getDocs(collection(db, "products"));
    const upper = await getDocs(collection(db, "Products"));

    status.textContent =
      "Exact document exists: " + exactDoc.exists() +
      " | lowercase products: " + lower.size +
      " | uppercase Products: " + upper.size;

  } catch (error) {
    status.textContent =
      "ERROR: " + error.code + " — " + error.message;
    console.error(error);
  }
});
      
