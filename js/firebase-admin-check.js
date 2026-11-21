
import { db, auth } from "./firebase.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const status = document.getElementById("storage-status");

onAuthStateChanged(auth, async (user) => {
  if (!user || user.uid !== "hSrcvZLpvBSAY9RguhhsbulFrnF3") {
    status.textContent = "Admin authentication failed.";
    return;
  }

  try {
    const testRef = doc(
      db,
      "products",
      "website-connection-test-20261121"
    );

    await setDoc(testRef, {
      name: "NiPlag Connection Test",
      status: "draft",
      testDocument: true
    });

    const result = await getDoc(testRef);

    status.textContent = result.exists()
      ? "SUCCESS: Website can WRITE and READ Firestore. Project: " +
        db.app.options.projectId
      : "Write completed, but document could not be read.";

  } catch (error) {
    status.textContent =
      "ERROR: " + error.code + " — " + error.message;
    console.error(error);
  }
});
      
