
/* =====================================
   NIPLAG - MAIN JAVASCRIPT
   Product page + Shopping basket
===================================== */

const NIPLAG_WHATSAPP = "254754058116";
const BASKET_KEY = "niplagBasket";

/* ---------- GENERAL HELPERS ---------- */

function getBasket() {
  try {
    return JSON.parse(localStorage.getItem(BASKET_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveBasket(items) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(items));
  updateBasketCount();
}

function formatKES(amount) {
  return "KES " + Number(amount).toLocaleString("en-KE", {
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function updateBasketCount() {
  const countElement = document.getElementById("basket-count");

  if (!countElement) return;

  const total = getBasket().reduce(
    (sum, item) => sum + Number(item.quantity || 0), 0
  );

  countElement.textContent = total;
}

/* ---------- PRODUCT DETAILS ---------- */

function getCurrentProduct() {
  const params = new URLSearchParams(window.location.search);

  const nameElement = document.getElementById("product-name");

  const name = params.get("product") ||
    (nameElement ? nameElement.textContent.trim() : "Product");

  const priceFromURL = Number(params.get("price"));
  const sellingFromURL = Number(params.get("selling"));

  const costElement = document.getElementById("product-price");
  const sellingElement = document.getElementById("suggested-price");

  const costText = costElement ? costElement.textContent : "";
  const sellingText = sellingElement ? sellingElement.textContent : "";

  const extractNumber = text =>
    Number(String(text).replace(/[^0-9.]/g, ""));

  const cost = priceFromURL > 0
    ? priceFromURL
    : extractNumber(costText);

  const sellingPrice = sellingFromURL > 0
    ? sellingFromURL
    : extractNumber(sellingText);

  const id = params.get("id") ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    id,
    name,
    price: cost > 0 ? cost : null,
    sellingPrice: sellingPrice > 0 ? sellingPrice : null
  };
}

/* ---------- ADD PRODUCT TO BASKET ---------- */

function addCurrentProduct() {
  const product = getCurrentProduct();

  const quantityInput = document.getElementById("estimate-quantity");
  const quantity = Math.max(
    1,
    Number(quantityInput?.value || 1)
  );

  const sellingInput = document.getElementById("estimate-selling");

  if (sellingInput && Number(sellingInput.value) > 0) {
    product.sellingPrice = Number(sellingInput.value);
  }

  const basket = getBasket();

  const existing = basket.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += quantity;

    if (product.price !== null) {
      existing.price = product.price;
    }

    if (product.sellingPrice !== null) {
      existing.sellingPrice = product.sellingPrice;
    }
  } else {
    basket.push({
      ...product,
      quantity
    });
  }

  saveBasket(basket);

  alert("Product added to your NiPlag basket.");
}

/* ---------- REMOVE AND UPDATE QUANTITY ---------- */

function changeQuantity(id, change) {
  const basket = getBasket();
  const item = basket.find(product => product.id === id);

  if (!item) return;

  item.quantity = Math.max(1, item.quantity + change);

  saveBasket(basket);
  renderBasket();
}

function removeBasketItem(id) {
  const basket = getBasket().filter(item => item.id !== id);

  saveBasket(basket);
  renderBasket();
}

/* ---------- BASKET DISPLAY ---------- */

function renderBasket() {
  const itemsContainer = document.getElementById("basket-items");
  if (!itemsContainer) return;

  const basket = getBasket();

  const emptyMessage = document.getElementById("basket-empty");
  const summary = document.getElementById("basket-summary");

  if (emptyMessage) {
    emptyMessage.style.display = basket.length ? "none" : "block";
  }

  if (summary) {
    summary.style.display = basket.length ? "block" : "none";
  }

  let totalCost = 0;
  let totalQuantity = 0;
  let totalProfit = 0;
  let allPricesKnown = true;
  let allSellingPricesKnown = true;

  itemsContainer.innerHTML = basket.map(item => {
    const quantity = Number(item.quantity || 1);
    const hasPrice = Number(item.price) > 0;
    const hasSelling = Number(item.sellingPrice) > 0;

    totalQuantity += quantity;

    if (hasPrice) {
      totalCost += item.price * quantity;
    } else {
      allPricesKnown = false;
    }

    if (hasPrice && hasSelling) {
      totalProfit += (item.sellingPrice - item.price) * quantity;
    } else {
      allSellingPricesKnown = false;
    }

    return `
      <div class="basket-item">
        <div>
          <h3>${escapeHTML(item.name)}</h3>
          <p>
            Unit price: ${
              hasPrice ? formatKES(item.price) : "To be confirmed"
            }
          </p>
          <p>
            Quantity: ${quantity}
          </p>
          <p>
            Item total: ${
              hasPrice
                ? formatKES(item.price * quantity)
                : "Price pending"
            }
          </p>

          <div class="quantity-controls">
            <button type="button"
              data-action="decrease"
              data-id="${escapeHTML(item.id)}">−</button>

            <strong>${quantity}</strong>

            <button type="button"
              data-action="increase"
              data-id="${escapeHTML(item.id)}">+</button>
          </div>
        </div>

        <button type="button"
          class="btn btn-outline"
          data-action="remove"
          data-id="${escapeHTML(item.id)}">
          Remove
        </button>
      </div>
    `;
  }).join("");

  const quantityElement = document.getElementById("basket-quantity");
  const totalElement = document.getElementById("basket-total");
  const profitElement = document.getElementById("basket-profit");

  if (quantityElement) {
    quantityElement.textContent = totalQuantity;
  }

  if (totalElement) {
    totalElement.textContent = allPricesKnown
      ? formatKES(totalCost)
      : formatKES(totalCost) + " + prices pending";
  }

  if (profitElement) {
    profitElement.textContent = allSellingPricesKnown
      ? formatKES(totalProfit)
      : "Some estimates pending";
  }

  updateBasketCount();
}

/* ---------- BASKET BUTTON ACTIONS ---------- */

function handleBasketActions(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "increase") changeQuantity(id, 1);
  if (action === "decrease") changeQuantity(id, -1);
  if (action === "remove") removeBasketItem(id);
}

/* ---------- PROFIT ESTIMATOR ---------- */

function calculateProductProfit() {
  const costInput = document.getElementById("estimate-cost");
  const sellingInput = document.getElementById("estimate-selling");
  const quantityInput = document.getElementById("estimate-quantity");

  const perItemElement = document.getElementById("profit-per-item");
  const totalElement = document.getElementById("profit-total");
  const wholesaleElement = document.getElementById("wholesale-total");

  if (!costInput || !sellingInput || !quantityInput) return;

  const cost = Number(costInput.value);
  const selling = Number(sellingInput.value);
  const quantity = Math.max(1, Number(quantityInput.value || 1));

  if (cost <= 0 || selling <= 0) {
    if (perItemElement) perItemElement.textContent = "Enter prices";
    if (totalElement) totalElement.textContent = "Enter prices";
    if (wholesaleElement) wholesaleElement.textContent = "Enter price";
    return;
  }

  const profitPerItem = selling - cost;
  const totalProfit = profitPerItem * quantity;
  const wholesaleTotal = cost * quantity;

  if (perItemElement) {
    perItemElement.textContent = formatKES(profitPerItem);
  }

  if (totalElement) {
    totalElement.textContent = formatKES(totalProfit);
  }

  if (wholesaleElement) {
    wholesaleElement.textContent = formatKES(wholesaleTotal);
  }
}

/* ---------- WHATSAPP MESSAGE ---------- */

function createShoppingMessage() {
  const basket = getBasket();

  if (!basket.length) {
    return "";
  }

  let total = 0;
  let pricesComplete = true;

  let message = "Hello NiPlag! I would like assistance purchasing these products:\n\n";

  basket.forEach((item, index) => {
    message += `${index + 1}. ${item.name}\n`;
    message += `Quantity: ${item.quantity}\n`;

    if (Number(item.price) > 0) {
      const lineTotal = item.price * item.quantity;
      total += lineTotal;
      message += `Unit price: ${formatKES(item.price)}\n`;
      message += `Estimated total: ${formatKES(lineTotal)}\n`;
    } else {
      pricesComplete = false;
      message += "Price: To be confirmed\n";
    }

    message += "\n";
  });

  message += "Estimated product cost: " +
    (pricesComplete ? formatKES(total) : formatKES(total) + " + prices pending");

  message += "\n\nPlease confirm stock, final prices, service fees and delivery charges before I make payment.";

  return message;
}

function sendBasketToWhatsApp() {
  const message = createShoppingMessage();

  if (!message) {
    alert("Your basket is empty. Add products first.");
    return;
  }

  const url = `https://wa.me/${NIPLAG_WHATSAPP}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}

/* ---------- SHARE WITH FRIENDS ---------- */

async function shareBasket() {
  const message = createShoppingMessage();

  if (!message) {
    alert("Add products to your basket before sharing.");
    return;
  }

  const shareText =
    "NiPlag group shopping list. Share your requested products and quantities so we can coordinate one order.\n\n" +
    message;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "NiPlag Shopping Basket",
        text: shareText
      });
    } catch (error) {
      // Sharing cancelled by user.
    }
    return;
  }

  const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(url, "_blank");
}

/* ---------- PRODUCT PAGE BUTTONS ---------- */

function setupProductPage() {
  const product = getCurrentProduct();

  const addButton = document.getElementById("add-to-basket");

  if (addButton) {
    addButton.addEventListener("click", addCurrentProduct);
  }

  const unlockButton = document.getElementById("unlock-button");

  if (unlockButton) {
    const params = new URLSearchParams(window.location.search);
    const query = new URLSearchParams({
      product: product.name,
      id: product.id,
      fee: params.get("fee") || ""
    });

    unlockButton.href = "unlock.html?" + query.toString();
  }

  const assistedButton = document.getElementById("assisted-button");

  if (assistedButton) {
    const message =
      `Hello NiPlag, I need help purchasing ${product.name}. Please confirm availability, final price and delivery arrangements.`;

    assistedButton.href =
      `https://wa.me/${NIPLAG_WHATSAPP}?text=${encodeURIComponent(message)}`;
  }

  const sellingInput = document.getElementById("estimate-selling");
  const quantityInput = document.getElementById("estimate-quantity");

  if (sellingInput) {
    sellingInput.addEventListener("input", calculateProductProfit);
  }

  if (quantityInput) {
    quantityInput.addEventListener("input", calculateProductProfit);
  }

  calculateProductProfit();
}

/* ---------- START ---------- */

document.addEventListener("DOMContentLoaded", () => {
  updateBasketCount();
  renderBasket();

  setupProductPage();

  const itemsContainer = document.getElementById("basket-items");

  if (itemsContainer) {
    itemsContainer.addEventListener("click", handleBasketActions);
  }

  const whatsappButton = document.getElementById("send-basket-whatsapp");

  if (whatsappButton) {
    whatsappButton.addEventListener("click", sendBasketToWhatsApp);
  }

  const shareButton = document.getElementById("share-basket");

  if (shareButton) {
    shareButton.addEventListener("click", shareBasket);
  }
});
