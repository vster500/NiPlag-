
import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

"use strict";

const dealsContainer = document.getElementById("deals-products");

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
  const image = String(value || "").trim();

  if (
    /^images\/products\/[a-zA-Z0-9._/-]+\.(jpg|jpeg|png|webp)$/i.test(image) ||
    /^https:\/\/[^\s]+$/i.test(image)
  ) {
    return image;
  }

  return "";
}

function renderDeals(products) {
  if (!products.length) {
    dealsContainer.innerHTML = `
      <div class="deal-empty">
        <div class="deal-empty-icon">🔥</div>
        <h3>No special offers available yet.</h3>
        <p class="muted">
          New wholesale offers will appear here when they are published.
          Check back soon.
        </p>
        <a href="search.html" class="btn">
          Browse wholesale products
        </a>
      </div>
    `;
    return;
  }

  dealsContainer.innerHTML = products.map(product => {
    const image = safeImage(product.imageUrl);

    return `
      <article class="product-card">

        <div style="position:relative;">
  ${image ? `
    <img
      src="${escapeHTML(image)}"
      alt="${escapeHTML(product.name)}"
      loading="lazy"
      style="width:100%; aspect-ratio:4/3; object-fit:contain; display:block;"
    >
  ` : ""}

  <span style="
    position:absolute;
    top:10px;
    left:10px;
    background:#e84920;
    color:white;
    padding:6px 11px;
    border-radius:20px;
    font-size:12px;
    font-weight:bold;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);
  ">🔥 HOT DEAL</span>
</div>

        <div class="product-info">

          <div class="admin-product-tags">
            <span class="admin-tag">🔥 Special Offer</span>

            ${product.verified === true
              ? '<span class="admin-tag">Verified</span>'
              : ""}
          </div>

          <h3>${escapeHTML(product.name)}</h3>

          <p class="muted">
            ${escapeHTML(product.category || "")}
          </p>

          <p>
            Wholesale price:
            <strong>${money(product.wholesalePrice)}</strong>
          </p>

          <p>
            Suggested selling:
            <strong>
              ${Number(product.suggestedRetailPrice) > 0
                ? money(product.suggestedRetailPrice)
                : "Not set"}
            </strong>
          </p>

          <p class="muted">
            Location: ${escapeHTML(product.supplierLocation || "Not specified")}
          </p>

          <p class="muted">
            Minimum order: ${escapeHTML(product.moq || 1)}
          </p>

          <a
            href="product.html?id=${encodeURIComponent(product.id)}"
            class="btn btn-accent"
          >
            View deal
          </a>

        </div>
      </article>
    `;
  }).join("");
}

async function loadDeals() {
  dealsContainer.innerHTML = `
    <div class="notice">Loading special offers...</div>
  `;

  try {
    const dealsQuery = query(
      collection(db, "products"),
      where("status", "==", "published"),
      where("featuredDeal", "==", true)
    );

    const snapshot = await getDocs(dealsQuery);

    const deals = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    renderDeals(deals);

  } catch (error) {
    console.error("Deals loading error:", error);

    dealsContainer.innerHTML = `
      <div class="notice">
        <h3>Unable to load special offers.</h3>
        <p>
          Please refresh the page or try again later.
        </p>
      </div>
    `;
  }
}

loadDeals();
