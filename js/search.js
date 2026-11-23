
import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const resultsContainer =
  document.getElementById("search-results-grid");

const searchInput = document.getElementById("search-input");
const searchHeading = document.getElementById("search-heading");
const searchCount = document.getElementById("search-count");

const BUCKET_KEY = "niplagShoppingBucketV1";

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


 // DISPLAY PRODUCTS
function renderProducts(products) {
  if (!products.length) {
    resultsContainer.innerHTML = `
      <div class="notice">
        No matching products found.
        Try another search or request the product from NiPlag.
      </div>`;

    searchCount.textContent = "0 products found";
    return;
  }

  searchCount.textContent =
    `${products.length} product(s) found`;

  resultsContainer.innerHTML = products.map(product => {
    const image = safeImage(product.imageUrl);
    const detailsLink =
      `product.html?id=${encodeURIComponent(product.id)}`;

    return `
      <article class="product-card search-product-card">

        <div class="product-info">

          <a href="${detailsLink}" class="product-open-link">

            ${image ? `
              <img
                class="home-product-image search-product-image"
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.name)}"
                loading="lazy">
            ` : `
              <div class="search-image-placeholder">
                📦 Product image
              </div>
            `}

            <h3>${escapeHTML(product.name || "Unnamed product")}</h3>

          </a>

          ${product.verified === true
            ? '<span class="home-verified">✓ VERIFIED</span>'
            : ""}

          <p class="search-product-category">
            ${escapeHTML(product.category || "Others")}
          </p>

          
<div class="search-product-meta-row">

  <p class="search-product-meta">
    📍 ${escapeHTML(product.supplierLocation || "Location to be confirmed")}
  </p>

  <p class="search-product-meta">
    📦 MOQ: ${escapeHTML(product.moq || 1)}
  </p>

</div>


          
${Number(product.suggestedRetailPrice) > Number(product.wholesalePrice)
  ? `
    <div class="search-profit-preview">

      <span class="search-retail-label">
        Suggested retail
      </span>

      <strong class="search-retail-price">
        ${money(product.suggestedRetailPrice)}
      </strong>

      <span class="search-profit-label">
        Profit
      </span>

      <strong class="search-profit-value">
        ${money(
          Number(product.suggestedRetailPrice) -
          Number(product.wholesalePrice)
        )}
      </strong>

      <small>Before transport and other expenses</small>

    </div>
  `
  : ""}
  

          <a href="${detailsLink}" class="btn btn-outline search-details-btn">
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
                                            

// SEARCH AND CATEGORY FILTER
function filterProducts() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category") || "";
  const term = searchInput.value.trim().toLowerCase();

  let filtered = publishedProducts;

  // FILTER BY EXACT CATEGORY
  if (category) {
    filtered = filtered.filter(product =>
      String(product.category || "").trim().toLowerCase() ===
      category.trim().toLowerCase()
    );

    searchHeading.textContent = category;
  } else if (term) {
    searchHeading.textContent = `Search for: ${searchInput.value}`;

    filtered = filtered.filter(product => {
      const searchableText = [
        product.name,
        product.category,
        product.description,
        product.supplierLocation
      ].join(" ").toLowerCase();

      return searchableText.includes(term);
    });
  } else {
    searchHeading.textContent = "Wholesale products";
  }

  renderProducts(filtered);
                       }


// ADD TO BUCKET
resultsContainer.addEventListener("click", function(event) {
  const button = event.target.closest(".add-to-bucket");
  if (!button) return;

  const product = publishedProducts.find(
    item => item.id === button.dataset.id
  );

  if (!product) return;

  let bucket = [];

  try {
    bucket = JSON.parse(
      localStorage.getItem(BUCKET_KEY) || "[]"
    );

    if (!Array.isArray(bucket)) bucket = [];

  } catch (error) {
    bucket = [];
  }

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

  try {
    localStorage.setItem(BUCKET_KEY, JSON.stringify(bucket));

    button.textContent = "✓ Added";

    const counter = document.getElementById("basket-count");

    if (counter) {
      counter.textContent = bucket.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      );
    }

    setTimeout(() => {
      button.textContent = "+ Add to bucket";
    }, 1200);

  } catch (error) {
    alert("Could not save your bucket on this device.");
  }
});

// LOAD PRODUCTS FROM FIREBASE
async function loadProducts() {
  try {
    const productsQuery = query(
      collection(db, "products"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(productsQuery);

    publishedProducts = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    filterProducts();

  } catch (error) {
    console.error("Search loading error:", error);

    resultsContainer.innerHTML = `
      <div class="notice">
        Products could not be loaded.
        Please refresh and try again.
      </div>`;

    searchCount.textContent = "";
  }
}


// INITIALIZE
const params = new URLSearchParams(window.location.search);
const initialQuery = params.get("q") || "";
const initialCategory = params.get("category") || "";

searchInput.value = initialQuery;

searchInput.addEventListener("input", filterProducts);

if (initialCategory) {
  searchHeading.textContent = initialCategory;
}

loadProducts();

/* NIPLAG SEARCH CARD VISUAL UPGRADE */

/* Card appearance */
#search-results-grid .search-product-card {
  background: #ffffff;
  border: 1px solid #dce3e8;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(20, 35, 50, 0.06);
}

/* Product image background */
#search-results-grid .search-product-image,
#search-results-grid .search-image-placeholder {
  background: #edf2f6;
  border-radius: 8px;
}

/* Wholesale price */
#search-results-grid .home-product-price {
  color: #13804a;
  font-size: 17px;
  font-weight: 800;
}

/* Location and MOQ on one line */
#search-results-grid .search-product-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
}

#search-results-grid .search-product-meta-row p {
  font-size: 10px;
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

/* Profit panel */
#search-results-grid .search-profit-preview {
  background: #eef5f2;
  border: 1px solid #d7e8df;
  border-radius: 8px;
  padding: 9px;
  margin-top: 10px;
}

#search-results-grid .search-retail-label,
#search-results-grid .search-retail-price {
  font-size: 10px;
  color: #66736c;
  font-weight: 500;
}

#search-results-grid .search-profit-label {
  font-size: 12px;
  font-weight: 700;
  color: #263b32;
}

#search-results-grid .search-profit-value {
  font-size: 16px;
  font-weight: 800;
  color: #13804a;
}

/* View details - black with white text */
#search-results-grid .search-details-btn {
  background: #17211d !important;
  color: #ffffff !important;
  border: 1px solid #17211d !important;
  border-radius: 6px;
  font-weight: 700;
}

#search-results-grid .search-details-btn:hover {
  background: #30443a !important;
  color: #ffffff !important;
}

/* Add to bucket - contrasting blue-grey */
#search-results-grid .add-to-bucket {
  background: #e9eff4;
  color: #243746;
  border: 1px solid #d4dfe7;
  border-radius: 6px;
  font-weight: 700;
    }
      
  
