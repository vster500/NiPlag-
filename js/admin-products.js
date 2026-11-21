
import { db, auth } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

"use strict";

const ADMIN_UID = "hSrcvZLpvBSAY9RguhhsbulFrnF3";
const PRODUCTS_COLLECTION = "products";

const form = document.getElementById("product-form");
const imageInput = document.getElementById("product-image-file");
const previewImage = document.getElementById("product-image-preview");
const previewMessage = document.getElementById("image-preview-message");
const imageStatus = document.getElementById("image-status");
const removeImageButton = document.getElementById("remove-image");
const accessSelect = document.getElementById("contact-access");
const feeWrap = document.getElementById("unlock-fee-wrap");
const feeInput = document.getElementById("unlock-fee");
const productList = document.getElementById("admin-product-list");
const formMessage = document.getElementById("form-message");
const storageStatus = document.getElementById("storage-status");

let products = [];
let editingId = null;
let currentImage = "";

function setStatus(message) {
  if (storageStatus) storageStatus.textContent = message;
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function money(value) {
  return "KES " + Number(value || 0).toLocaleString("en-KE");
}

function normalizeProduct(id, data) {
  return {
    id,
    name: data.name || "",
    category: data.category || "",
    description: data.description || "",
    image: data.imageUrl || "",
    wholesale: Number(data.wholesalePrice || 0),
    retail: Number(data.suggestedRetailPrice || 0),
    moq: Number(data.moq || 1),
    location: data.supplierLocation || "",
    verified: data.verified === true,
    access: data.contactAccess || "paid",
    fee: Number(data.unlockFee || 0),
    status: data.status || "draft"
  };
}

function firestoreProduct(product) {
  return {
    name: product.name,
    category: product.category,
    description: product.description,
    imageUrl: product.image,
    wholesalePrice: product.wholesale,
    suggestedRetailPrice: product.retail,
    moq: product.moq,
    supplierLocation: product.location,
    verified: product.verified,
    contactAccess: product.access,
    unlockFee: product.fee,
    status: product.status,
    updatedAt: serverTimestamp()
  };
}

async function loadProducts() {
  setStatus("Loading products from Firebase...");

  try {
    const snapshot = await getDocs(
      collection(db, PRODUCTS_COLLECTION)
    );

    products = snapshot.docs.map(item =>
      normalizeProduct(item.id, item.data())
    );

    renderProducts();
    setStatus("Connected to Firebase. Products loaded: " + products.length);
  } catch (error) {
    console.error(error);
    setStatus("Could not load products: " + error.message);
  }
}

function updateFeeVisibility() {
  const isFree = accessSelect.value === "free";
  feeWrap.style.display = isFree ? "none" : "block";
  feeInput.disabled = isFree;
}

function validImagePath(value) {
  return /^images\/products\/[a-zA-Z0-9._/-]+\.(jpg|jpeg|png|webp)$/i.test(value)
    || /^https:\/\/[^\s]+$/i.test(value);
}

function showImagePreview(imagePath) {
  if (!imagePath) {
    previewImage.hidden = true;
    previewImage.removeAttribute("src");
    previewMessage.hidden = false;
    previewMessage.textContent = "No product image selected yet.";
    removeImageButton.hidden = true;
    imageStatus.textContent = "An image is required before publishing.";
    return;
  }

  previewImage.src = imagePath;
  previewImage.hidden = false;
  previewMessage.hidden = true;
  removeImageButton.hidden = false;
  imageStatus.textContent = "Image path entered. Check the preview.";
}

function updateStats() {
  document.getElementById("total-products").textContent = products.length;

  document.getElementById("published-products").textContent =
    products.filter(item => item.status === "published").length;

  document.getElementById("draft-products").textContent =
    products.filter(item => item.status === "draft").length;
}

function renderProducts() {
  const search = document.getElementById("product-search").value
    .trim().toLowerCase();

  const category = document.getElementById("category-filter").value;
  const status = document.getElementById("status-filter").value;

  const filtered = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.location.toLowerCase().includes(search);

    return matchesSearch &&
      (!category || product.category === category) &&
      (!status || product.status === status);
  });

  if (!filtered.length) {
    productList.innerHTML = `
      <div class="admin-empty">
        <strong>No matching products.</strong>
        <p>Try another search or category filter.</p>
      </div>`;

    updateStats();
    return;
  }

  productList.innerHTML = filtered.map(product => `
    <article class="admin-product-card">
      <img src="${safe(product.image)}"
        alt="${safe(product.name)} product image">

      <div class="admin-product-top">
        <div>
          <h3>${safe(product.name)}</h3>
          <p class="muted">
            ${safe(product.category)} · ${safe(product.location)}
          </p>
        </div>

        <span class="admin-status ${safe(product.status)}">
          ${product.status === "published" ? "Published" : "Draft"}
        </span>
      </div>

      <p>${safe(product.description)}</p>

      <div class="admin-product-details">
        <span>Wholesale: <strong>${money(product.wholesale)}</strong></span>
        <span>Suggested selling:
          <strong>${product.retail ? money(product.retail) : "Not set"}</strong>
        </span>
        <span>MOQ: <strong>${safe(product.moq)}</strong></span>
      </div>

      <div class="admin-product-tags">
        <span class="admin-tag">
          ${product.verified ? "Verified" : "Not verified"}
        </span>

        <span class="admin-tag">
          ${product.access === "free"
            ? "Free contact"
            : "Locked · " + money(product.fee)}
        </span>
      </div>

      <div class="admin-product-actions">
        <button type="button" class="btn btn-outline"
          data-action="edit" data-id="${safe(product.id)}">Edit</button>

        <button type="button" class="btn btn-outline"
          data-action="toggle" data-id="${safe(product.id)}">
          ${product.status === "published" ? "Move to Draft" : "Publish"}
        </button>

        <button type="button" class="btn admin-delete"
          data-action="delete" data-id="${safe(product.id)}">Delete</button>
      </div>
    </article>
  `).join("");

  updateStats();
}

function resetForm() {
  form.reset();
  editingId = null;
  currentImage = "";
  imageInput.value = "";

  document.getElementById("minimum-quantity").value = 1;
  feeInput.value = 50;

  document.getElementById("form-heading").textContent = "Add New Product";
  document.getElementById("save-product").textContent = "Save Product";
  document.getElementById("cancel-edit").hidden = true;

  formMessage.textContent = "";
  showImagePreview("");
  updateFeeVisibility();
}

function editProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  editingId = id;
  currentImage = product.image || "";

  document.getElementById("product-name").value = product.name;
  document.getElementById("product-category").value = product.category;
  document.getElementById("product-description").value = product.description;
  document.getElementById("wholesale-price").value = product.wholesale;
  document.getElementById("retail-price").value = product.retail || "";
  document.getElementById("minimum-quantity").value = product.moq;
  document.getElementById("supplier-location").value = product.location;

  document.getElementById("verified-status").value =
    product.verified ? "yes" : "no";

  accessSelect.value = product.access;
  feeInput.value = product.fee;
  document.getElementById("product-status").value = product.status;

  imageInput.value = currentImage;

  document.getElementById("form-heading").textContent = "Edit Product";
  document.getElementById("save-product").textContent = "Update Product";
  document.getElementById("cancel-edit").hidden = false;

  showImagePreview(currentImage);
  updateFeeVisibility();

  document.getElementById("add-product").scrollIntoView({
    behavior: "smooth"
  });
}

async function deleteProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (!confirm("Permanently delete " + product.name + " from Firebase?")) {
    return;
  }

  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));

    if (editingId === id) resetForm();

    await loadProducts();
    formMessage.textContent = "Product deleted from Firebase.";
  } catch (error) {
    console.error(error);
    alert("Could not delete product: " + error.message);
  }
}

form.addEventListener("submit", async function(event) {
  event.preventDefault();

  const status = document.getElementById("product-status").value;

  const product = {
    name: document.getElementById("product-name").value.trim(),
    category: document.getElementById("product-category").value,
    description: document.getElementById("product-description").value.trim(),
    image: imageInput.value.trim(),
    wholesale: Number(document.getElementById("wholesale-price").value),
    retail: Number(document.getElementById("retail-price").value || 0),
    moq: Number(document.getElementById("minimum-quantity").value),
    location: document.getElementById("supplier-location").value.trim(),
    verified: document.getElementById("verified-status").value === "yes",
    access: accessSelect.value,
    fee: accessSelect.value === "free" ? 0 : Number(feeInput.value),
    status
  };

  if (
    !product.name ||
    !product.category ||
    !product.description ||
    !product.location ||
    product.wholesale < 0 ||
    product.retail < 0 ||
    product.moq < 1 ||
    !Number.isFinite(product.wholesale) ||
    !Number.isFinite(product.retail) ||
    !Number.isFinite(product.moq) ||
    (product.access === "paid" &&
      (!Number.isFinite(product.fee) || product.fee < 0))
  ) {
    formMessage.textContent = "Please check all required fields.";
    return;
  }

  if (product.image && !validImagePath(product.image)) {
    formMessage.textContent =
      "Use a valid image path, e.g. images/products/led-bulb.jpg";
    return;
  }

  if (status === "published" && !product.image) {
    formMessage.textContent =
      "An image path is required before publishing.";
    return;
  }

  const saveButton = document.getElementById("save-product");
  saveButton.disabled = true;
  formMessage.textContent = "Saving product to Firebase...";

  try {
    const data = firestoreProduct(product);

    if (editingId) {
      await updateDoc(
        doc(db, PRODUCTS_COLLECTION, editingId),
        data
      );
    } else {
      data.createdAt = serverTimestamp();

      await addDoc(
        collection(db, PRODUCTS_COLLECTION),
        data
      );
    }

    await loadProducts();

    formMessage.textContent = "Product saved successfully in Firebase.";
    resetForm();
  } catch (error) {
    console.error(error);
    formMessage.textContent = "Save failed: " + error.message;
  } finally {
    saveButton.disabled = false;
  }
});

productList.addEventListener("click", async function(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    editProduct(id);
  }

  if (action === "delete") {
    await deleteProduct(id);
  }

  if (action === "toggle") {
    const product = products.find(item => item.id === id);
    if (!product) return;

    if (product.status === "draft" && !product.image) {
      alert("Add a valid product image before publishing.");
      return;
    }

    try {
      const newStatus =
        product.status === "published" ? "draft" : "published";

      await updateDoc(
        doc(db, PRODUCTS_COLLECTION, id),
        {
          status: newStatus,
          updatedAt: serverTimestamp()
        }
      );

      await loadProducts();
    } catch (error) {
      console.error(error);
      alert("Could not change product status: " + error.message);
    }
  }
});

removeImageButton.addEventListener("click", function() {
  currentImage = "";
  imageInput.value = "";
  showImagePreview("");
});

imageInput.addEventListener("input", function() {
  currentImage = imageInput.value.trim();
  showImagePreview(currentImage);
});

imageInput.addEventListener("change", function() {
  currentImage = imageInput.value.trim();
  showImagePreview(currentImage);
});

previewImage.addEventListener("error", function() {
  imageStatus.textContent = "Image could not be loaded. Check the image path.";
});

previewImage.addEventListener("load", function() {
  imageStatus.textContent = "Image preview loaded successfully.";
});

accessSelect.addEventListener("change", updateFeeVisibility);

document.getElementById("cancel-edit").addEventListener("click", resetForm);

document.getElementById("product-search").addEventListener(
  "input", renderProducts
);

document.getElementById("category-filter").addEventListener(
  "change", renderProducts
);

document.getElementById("status-filter").addEventListener(
  "change", renderProducts
);

function waitForAdmin() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();

      if (!user || user.uid !== ADMIN_UID) {
        reject(new Error("Administrator authentication failed."));
        return;
      }

      resolve(user);
    }, reject);
  });
}

async function startAdminProducts() {
  try {
    await waitForAdmin();

    // Replace the old file picker with a GitHub image-path field.
    const imageLabel = document.querySelector(
      'label[for="product-image-file"]'
    );

    imageInput.type = "text";
    imageInput.accept = "";
    imageInput.placeholder = "images/products/led-bulb.jpg";

    if (imageLabel) {
      imageLabel.textContent = "Product image path";
    }

    const imageHelp = imageInput.parentElement;

    if (imageHelp) {
      imageInput.title =
        "Enter a path to an image already uploaded to GitHub.";
    }

    updateFeeVisibility();
    showImagePreview("");
    await loadProducts();

  } catch (error) {
    console.error(error);
    setStatus(error.message);
  }
}

startAdminProducts();
  
