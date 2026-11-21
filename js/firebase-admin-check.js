
import { db, auth } from "./firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const status = document.getElementById("storage-status");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    status.textContent = "Not signed in.";
    return;
  }

  try {
    const productRef = doc(
      db,
      "products",
      "hHe3Blf79yi56cEBW6Fx"
    );

    const result = await getDoc(productRef);

    if (result.exists()) {
      const data = result.data();

      status.textContent =
        "DOCUMENT FOUND! Name: " + data.name +
        " | Status: [" + data.status + "]" +
        " | Project: " + db.app.options.projectId;
    } else {
      status.textContent =
        "DOCUMENT NOT FOUND at products/hHe3Blf79yi56cEBW6Fx" +
        " | Project: " + db.app.options.projectId;
    }

  } catch (error) {
    status.textContent =
      "ERROR: " + error.code + " — " + error.message;
  }
});
                   
