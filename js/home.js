
import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where,
  limit
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const productsContainer = document.getElementById("home-products");

const bucketButton = document.getElementById("bucket-button");
const bucketPanel = document.getElementById("bucket-panel");
const bucketClose = document.getElementById("bucket-close");
const bucketCount = document.getElementById("bucket-count");
const bucketItems = document.getElementById("bucket-items");

const BUCKET_KEY = "niplagShoppingBucketV1";

let bucket = loadBucket();
let publishedProducts = [];

function escapeHTML(value) {
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

function safeImage(value) {
  const path = String(value || "");

  if (
    /^https:\/\/[^\s"'<>]+$/i.test(path) ||
    /^images\/products\/[a-zA-Z0-9._/-]+\.(jpg|jpeg|png|webp)$/i.test(path)
  ) {
    return path;
  }

  return "";
}

// LOAD PUBLISHED PRODUCTS
async function loadHomeProducts() {
  productsContainer.innerHTML =
    '<div class="notice">Loading wholesale products...</div>';

  try {
    const productsQuery = query(
      collection(db, "products"),
      where("status", "==", "published"),
      limit(8)
    );

    const snapshot = await getDocs(productsQuery);

    publishedProducts = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    renderHomeProducts();

  } catch (error) {
    console.error("Product loading error:", error);

    productsContainer.innerHTML = `
      <div class="notice">
        Products are temporarily unavailable.
        Please try again later.
      </div>`;
  }
}

// DISPLAY PRODUCTS
function renderHomeProducts() {
  if (!publishedProducts.length) {
    productsContainer.innerHTML = `
      <div class="notice">
        No published products yet.
        Check back for new wholesale discoveries.
      </div>`;
    return;
  }

  productsContainer.innerHTML = publishedProducts.map(product => {
    const image = safeImage(product.imageUrl);
    const detailsLink =
      `product.html?id=${encodeURIComponent(product.id)}`;

    return `
      <article class="product-card home-product-card">

        <div class="product-info">

          <a href="${detailsLink}" class="product-open-link">

            ${image ? `
              <img
                class="home-product-image"
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.name)}"
                loading="lazy">
            ` : `
              <div class="notice">📦 Product image</div>
            `}

            <h3>${escapeHTML(product.name)}</h3>

          </a>

          ${product.verified === true
            ? '<span class="home-verified">✓ VERIFIED</span>'
            : ""}

          <p class="muted">
            ${escapeHTML(product.category || "Other")}
          </p>

          <p class="muted">
            ${escapeHTML(product.description || "")}
          </p>

<p class="home-location">
  📍 ${escapeHTML(
    String(product.supplierLocation || "To be confirmed")
      .replace(/^\s*📍?\s*wholesaler\s*:\s*/i, "")
  )}
</p>

          <p class="home-product-price">
            ${money(product.wholesalePrice)}
          </p>

          <p class="home-moq">
  📦 MOQ: ${escapeHTML(product.moq || 1)} units
</p>

          <a href="${detailsLink}" class="btn btn-outline">
            View product details
          </a>

          <button
            type="button"
            class="btn btn-accent add-to-bucket"
            data-id="${escapeHTML(product.id)}">
            + Add to bucket
          </button>

        </div>
      </article>
    `;
  }).join("");
}

// LOAD SAVED BUCKET
function loadBucket() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(BUCKET_KEY) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

// SAVE BUCKET
function saveBucket() {
  try {
    localStorage.setItem(BUCKET_KEY, JSON.stringify(bucket));
    return true;
  } catch (error) {
    alert("Could not save your bucket on this device.");
    return false;
  }
}

// UPDATE BUCKET
function renderBucket() {
  const totalItems = bucket.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  bucketCount.textContent = totalItems;

  if (!bucket.length) {
    bucketItems.innerHTML = `
      <p class="bucket-empty">Your bucket is empty.</p>`;
    return;
  }

  bucketItems.innerHTML = bucket.map(item => `
    <div class="bucket-item">
      <strong>${escapeHTML(item.name)}</strong>

      <p class="muted">
        ${money(item.price)} × ${item.quantity}
      </p>

      <button
        type="button"
        class="btn btn-outline remove-from-bucket"
        data-id="${escapeHTML(item.id)}">
        Remove
      </button>
    </div>
  `).join("");
}

// ADD PRODUCT TO BUCKET
productsContainer.addEventListener("click", function(event) {
  const button = event.target.closest(".add-to-bucket");
  if (!button) return;

  const product = publishedProducts.find(
    item => item.id === button.dataset.id
  );

  if (!product) return;

  const existing = bucket.find(
    item => item.id === product.id
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    bucket.push({
      id: product.id,
      name: product.name || "Product",
      price: Number(product.wholesalePrice || 0),
      quantity: 1
    });
  }

  if (saveBucket()) {
    renderBucket();

    button.textContent = "✓ Added";
    setTimeout(() => {
      button.textContent = "+ Add to bucket";
    }, 1200);
  }
});

// REMOVE PRODUCT
bucketItems.addEventListener("click", function(event) {
  const button = event.target.closest(".remove-from-bucket");
  if (!button) return;

  bucket = bucket.filter(
    item => item.id !== button.dataset.id
  );

  if (saveBucket()) {
    renderBucket();
  }
});

// OPEN AND CLOSE BUCKET
bucketButton.addEventListener("click", function() {
  bucketPanel.hidden = !bucketPanel.hidden;
});

bucketClose.addEventListener("click", function() {
  bucketPanel.hidden = true;
});

// INITIALIZE
renderBucket();
loadHomeProducts();
  
