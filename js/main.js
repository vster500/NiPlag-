
/* =====================================
   NIPLAG - MAIN JAVASCRIPT
   Shared Shopping Bucket + Basket
===================================== */

const NIPLAG_WHATSAPP = "254754058116";
const BUCKET_KEY = "niplagShoppingBucketV1";
const OLD_BASKET_KEY = "niplagBasket";
const BUCKET_EXPENSE_KEY = "niplagBucketExpenses";

/* ---------- GENERAL HELPERS ---------- */

function formatKES(amount) {
  return "KES " + Number(amount || 0).toLocaleString("en-KE", {
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

/* ---------- SHARED BUCKET STORAGE ---------- */

function getBasket() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(BUCKET_KEY) || "null"
    );

    if (Array.isArray(saved)) return saved;

    // Migrate products from the old basket if necessary.
    const oldSaved = JSON.parse(
      localStorage.getItem(OLD_BASKET_KEY) || "[]"
    );

    if (Array.isArray(oldSaved) && oldSaved.length) {
      localStorage.setItem(BUCKET_KEY, JSON.stringify(oldSaved));
      return oldSaved;
    }

    return [];

  } catch (error) {
    console.error("Could not load shopping bucket:", error);
    return [];
  }
}

function saveBasket(items) {
  try {
    localStorage.setItem(BUCKET_KEY, JSON.stringify(items));
    updateBasketCount();
    return true;
  } catch (error) {
    alert("Could not save your shopping bucket on this device.");
    return false;
  }
}

function updateBasketCount() {
  const countElement = document.getElementById("basket-count");

  if (!countElement) return;

  const total = getBasket().reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  countElement.textContent = total;
}

/* ---------- ADD PRODUCT TO SHARED BUCKET ---------- */

function addProductToBucket(product, quantity = 1, sellingPrice = null) {
  if (!product || !product.id) {
    alert("Product information is missing.");
    return false;
  }

  const basket = getBasket();

  const existing = basket.find(
    item => item.id === product.id
  );

  const amount = Math.max(1, Number(quantity) || 1);
  const price = Number(product.wholesalePrice ?? product.price ?? 0);

  if (existing) {
    existing.quantity = Number(existing.quantity || 0) + amount;
    existing.price = price;

    if (sellingPrice !== null && Number(sellingPrice) > 0) {
      existing.sellingPrice = Number(sellingPrice);
    }

  } else {
    basket.push({
      id: product.id,
      name: product.name || "Product",
      price: price,
      sellingPrice: Number(sellingPrice || product.suggestedRetailPrice || 0),
      quantity: amount
    });
  }

  return saveBasket(basket);
}

/* Expose shared basket functions for other NiPlag pages. */
window.NiPlagBasket = {
  getItems: getBasket,
  addProduct: addProductToBucket,
  saveItems: saveBasket,
  formatKES: formatKES
};

/* ---------- REMOVE AND UPDATE QUANTITY ---------- */

function changeQuantity(id, change) {
  const basket = getBasket();
  const item = basket.find(product => product.id === id);

  if (!item) return;

  item.quantity = Math.max(
    1,
    Number(item.quantity || 1) + change
  );

  if (saveBasket(basket)) renderBasket();
}

function removeBasketItem(id) {
  const basket = getBasket().filter(
    item => item.id !== id
  );

  if (saveBasket(basket)) renderBasket();
}

/* ---------- BASKET DISPLAY ---------- */

function updateBasketCalculator() {
  const basket = getBasket();

  let totalCost = 0;
  let totalSales = 0;
  let totalQuantity = 0;

  let allCostsKnown = true;
  let allSellingPricesKnown = true;

  basket.forEach(item => {
    const quantity = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const sellingPrice = Number(item.sellingPrice || 0);

    totalQuantity += quantity;

    if (price > 0) {
      totalCost += price * quantity;
    } else {
      allCostsKnown = false;
    }

    if (sellingPrice > 0) {
      totalSales += sellingPrice * quantity;
    } else {
      allSellingPricesKnown = false;
    }
  });

  const expenses = Math.max(
    0,
    Number(localStorage.getItem(BUCKET_EXPENSE_KEY) || 0)
  );

  const quantityElement = document.getElementById("basket-quantity");
  const totalElement = document.getElementById("basket-total");
  const salesElement = document.getElementById("basket-sales");
  const expensesElement = document.getElementById("basket-expenses-display");
  const profitElement = document.getElementById("basket-net-profit");

  if (quantityElement) {
    quantityElement.textContent = totalQuantity;
  }

  if (totalElement) {
    totalElement.textContent = allCostsKnown
      ? formatKES(totalCost)
      : formatKES(totalCost) + " + prices pending";
  }

  if (salesElement) {
    salesElement.textContent = allSellingPricesKnown
      ? formatKES(totalSales)
      : "Enter selling prices";
  }

  if (expensesElement) {
    expensesElement.textContent = formatKES(expenses);
  }

  if (profitElement) {
    if (allCostsKnown && allSellingPricesKnown) {
      const profit = totalSales - totalCost - expenses;

      profitElement.textContent = formatKES(profit);
      profitElement.style.color = profit < 0 ? "#b83d3d" : "#13733b";
    } else {
      profitElement.textContent = "Complete prices";
    }
  }
}
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
  let totalSales = 0;
  let totalQuantity = 0;
  let allCostsKnown = true;
  let allSellingPricesKnown = true;

  itemsContainer.innerHTML = basket.map(item => {
    const quantity = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const sellingPrice = Number(item.sellingPrice || 0);

    totalQuantity += quantity;

    if (price > 0) {
      totalCost += price * quantity;
    } else {
      allCostsKnown = false;
    }

    if (sellingPrice > 0) {
      totalSales += sellingPrice * quantity;
    } else {
      allSellingPricesKnown = false;
    }

    return `
      <div class="basket-item">
        <div>
          <h3>${escapeHTML(item.name)}</h3>

          <p>
            Wholesale price:
            ${price > 0 ? formatKES(price) : "To be confirmed"}
          </p>

          <label>
            Your expected selling price (KES)
            <input
              type="number"
              min="0"
              step="1"
              value="${sellingPrice || ""}"
              placeholder="Enter selling price"
              data-selling-price="${escapeHTML(item.id)}"
              style="width:100%;padding:9px;margin:6px 0 10px;box-sizing:border-box;"
            >
          </label>

          <p>Quantity: ${quantity}</p>

          <p>
            Wholesale total:
            ${price > 0 ? formatKES(price * quantity) : "Price pending"}
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

    updateBasketCalculator();
  updateBasketCount();
}

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

  if (!basket.length) return "";

  let total = 0;
  let pricesComplete = true;

  let message =
    "Hello NiPlag! I would like assistance purchasing these products:\n\n";

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
    (pricesComplete
      ? formatKES(total)
      : formatKES(total) + " + prices pending");

  message +=
    "\n\nPlease confirm stock, final prices, service fees and delivery charges before I make payment.";

  return message;
}

function sendBasketToWhatsApp() {
  const message = createShoppingMessage();

  if (!message) {
    alert("Your basket is empty. Add products first.");
    return;
  }

  const url =
    `https://wa.me/${NIPLAG_WHATSAPP}?text=${encodeURIComponent(message)}`;

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

/* ---------- INITIALIZE ---------- */

document.addEventListener("DOMContentLoaded", () => {
  updateBasketCount();
  renderBasket();

  const itemsContainer = document.getElementById("basket-items");

  if (itemsContainer) {
  itemsContainer.addEventListener("click", handleBasketActions);

  itemsContainer.addEventListener("input", function(event) {
    const input = event.target.closest("input[data-selling-price]");
    if (!input) return;

    const id = input.dataset.sellingPrice;
    const basket = getBasket();

    const item = basket.find(
      product => String(product.id) === String(id)
    );

    if (!item) return;

    item.sellingPrice = Math.max(0, Number(input.value) || 0);

    saveBasket(basket);
    updateBasketCalculator();
  });
  }

  const whatsappButton =
    document.getElementById("send-basket-whatsapp");

  if (whatsappButton) {
    whatsappButton.addEventListener("click", sendBasketToWhatsApp);
  }

  const shareButton = document.getElementById("share-basket");

  if (shareButton) {
    shareButton.addEventListener("click", shareBasket);
  }

  const costInput = document.getElementById("estimate-cost");
  const sellingInput = document.getElementById("estimate-selling");
  const quantityInput = document.getElementById("estimate-quantity");

  [costInput, sellingInput, quantityInput].forEach(input => {
    if (input) {
      input.addEventListener("input", calculateProductProfit);
    }
  });

  calculateProductProfit();
});
     
