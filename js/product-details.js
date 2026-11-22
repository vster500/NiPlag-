
import { db } from "./firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const loading = document.getElementById("product-loading");
const errorBox = document.getElementById("product-error");
const content = document.getElementById("product-content");

const NIPLAG_WHATSAPP = "254754058116";

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

function showError() {
  loading.hidden = true;
  content.hidden = true;
  errorBox.hidden = false;
}

async function loadProduct() {
  if (!productId) {
    showError();
    return;
  }

  try {
    const productRef = doc(db, "products", productId);
    const productSnapshot = await getDoc(productRef);

    if (!productSnapshot.exists()) {
      showError();
      return;
    }

    const product = {
      id: productSnapshot.id,
      ...productSnapshot.data()
    };

    if (product.status !== "published") {
      showError();
      return;
    }

    displayProduct(product);

  } catch (error) {
    console.error("Product details error:", error);
    showError();
  }
}

function displayProduct(product) {
  document.title = `${product.name || "Product"} | NiPlag`;

  document.getElementById("product-name").textContent =
    product.name || "Unnamed product";

  document.getElementById("product-category").textContent =
    product.category || "Other";

  document.getElementById("product-description").textContent =
    product.description || "No product description available.";

  document.getElementById("product-price").textContent =
    money(product.wholesalePrice);

  document.getElementById("suggested-price").textContent =
    product.suggestedRetailPrice
      ? money(product.suggestedRetailPrice)
      : "Not provided";

  document.getElementById("product-moq").textContent =
    product.moq || 1;

  document.getElementById("product-location").textContent =
    product.supplierLocation || "To be confirmed";

  const verified = document.getElementById("product-verification");

  verified.hidden = product.verified !== true;

  document.getElementById("verification-description").textContent =
    product.verified === true
      ? "This listing has been reviewed by NiPlag."
      : "This listing has not been marked as verified by NiPlag.";

  const imagePath = safeImage(product.imageUrl);
  const image = document.getElementById("product-image");
  const placeholder = document.getElementById("image-placeholder");
  const caption = document.getElementById("image-caption");

  if (imagePath) {
    image.src = imagePath;
    image.alt = product.name || "Product image";
    image.hidden = false;
    placeholder.hidden = true;
    caption.textContent = product.name || "Product image";
  } else {
    image.hidden = true;
    placeholder.hidden = false;
    caption.textContent = "No product image available";
  }

  // PROFIT ESTIMATOR
  const costInput = document.getElementById("estimate-cost");
  const sellingInput = document.getElementById("estimate-selling");

  costInput.value = Number(product.wholesalePrice || 0);

  sellingInput.value =
    Number(product.suggestedRetailPrice || 0);

  costInput.dispatchEvent(new Event("input", { bubbles: true }));
  sellingInput.dispatchEvent(new Event("input", { bubbles: true }));

  // SUPPLIER CONTACT ACCESS
  const unlockButton = document.getElementById("unlock-button");

  unlockButton.href =
    `unlock.html?id=${encodeURIComponent(product.id)}`;

  if (product.contactAccess === "free") {
    unlockButton.textContent = "🔓 Get free supplier contact";
  } else if (
    product.contactAccess === "paid" &&
    Number(product.unlockFee) > 0
  ) {
    unlockButton.textContent =
      `🔒 Unlock supplier contact — ${money(product.unlockFee)}`;
  } else {
    unlockButton.textContent = "Contact NiPlag for supplier access";
    unlockButton.href =
      `https://wa.me/${NIPLAG_WHATSAPP}?text=${encodeURIComponent(
        "Hello NiPlag, please help me with supplier access for product " +
        product.name + " (Reference: " + product.id + ")."
      )}`;
  }

  // ORDER THROUGH NIPLAG
  const assistedButton = document.getElementById("assisted-button");

  const message =
    `Hello NiPlag. I want to order through NiPlag.\n\n` +
    `Product: ${product.name || "Product"}\n` +
    `Product ID: ${product.id}\n` +
    `Wholesale price shown: ${money(product.wholesalePrice)}\n` +
    `Minimum order: ${product.moq || 1}\n\n` +
    `Please confirm current stock, final price and delivery arrangements.`;

  assistedButton.href =
    `https://wa.me/${NIPLAG_WHATSAPP}?text=${encodeURIComponent(message)}`;

  assistedButton.target = "_blank";
  assistedButton.rel = "noopener";

  // ADD TO BUCKET
  const addButton = document.getElementById("add-to-basket");

  addButton.addEventListener("click", function() {
    if (
      !window.NiPlagBasket ||
      typeof window.NiPlagBasket.addProduct !== "function"
    ) {
      alert("Bucket is temporarily unavailable. Please refresh the page.");
      return;
    }

    const quantity = Math.max(
      1,
      Number(document.getElementById("estimate-quantity").value || 1)
    );

    const sellingPrice = Number(
      document.getElementById("estimate-selling").value || 0
    );

    window.NiPlagBasket.addProduct(
      product,
      quantity,
      sellingPrice
    );

    addButton.textContent = "✓ Added to bucket";

    setTimeout(() => {
      addButton.textContent = "🛒 Add to bucket";
    }, 1500);
  });

  loading.hidden = true;
  errorBox.hidden = true;
  content.hidden = false;
}

loadProduct();
