
function getBasket() {
  try {
    return JSON.parse(localStorage.getItem("niplagBasket")) || [];
  } catch {
    return [];
  }
}

function saveBasket(items) {
  localStorage.setItem("niplagBasket", JSON.stringify(items));
  updateBasketCount();
}

function updateBasketCount() {
  const countElement = document.getElementById("basket-count");
  if (!countElement) return;

  const count = getBasket().reduce((total, item) => total + item.quantity, 0);
  countElement.textContent = count;
}

function getProductDetails() {
  const params = new URLSearchParams(window.location.search);

  const name = params.get("product") ||
    document.getElementById("product-name")?.textContent ||
    "Product";

  const id = params.get("id") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const priceParam = params.get("price");
  const price = priceParam && Number(priceParam) > 0
    ? Number(priceParam)
    : null;

  return { id, name, price };
}

function addCurrentProduct() {
  const product = getProductDetails();
  const basket = getBasket();

  const existing = basket.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    basket.push({
      ...product,
      quantity: 1
    });
  }

  saveBasket(basket);
  alert(product.name + " added to your NiPlag basket.");
}

function removeBasketItem(id) {
  const updated = getBasket().filter(item => item.id !== id);
  saveBasket(updated);
  renderBasket();
}

function renderBasket() {
  const list = document.getElementById("basket-items");
  const totalElement = document.getElementById("basket-total");
  const emptyMessage = document.getElementById("basket-empty");

  if (!list || !totalElement) return;

  const basket = getBasket();
  list.innerHTML = "";

  let total = 0;
  let hasUnknownPrice = false;

  basket.forEach(item => {
    const row = document.createElement("div");
    row.className = "basket-item";

    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.name;

    const quantity = document.createElement("p");
    quantity.textContent = "Quantity: " + item.quantity;

    const price = document.createElement("p");
    if (item.price) {
      price.textContent = "KES " + item.price.toLocaleString() + " each";
      total += item.price * item.quantity;
    } else {
      price.textContent = "Price to be confirmed";
      hasUnknownPrice = true;
    }

    details.append(title, quantity, price);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-outline";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeBasketItem(item.id));

    row.append(details, remove);
    list.appendChild(row);
  });

  totalElement.textContent = hasUnknownPrice
    ? "KES " + total.toLocaleString() + " + prices to be confirmed"
    : "KES " + total.toLocaleString();

  if (emptyMessage) {
    emptyMessage.hidden = basket.length > 0;
  }

  updateBasketCount();
}

function createShoppingMessage() {
  const basket = getBasket();

  if (!basket.length) {
    alert("Your basket is empty.");
    return null;
  }

  let message = "Hello NiPlag. I would like assistance with this shopping list:\n\n";

  basket.forEach((item, index) => {
    message += (index + 1) + ". " + item.name +
      " | Quantity: " + item.quantity +
      " | Price: " + (item.price ? "KES " + item.price : "To be confirmed") +
      "\n";
  });

  message += "\nPlease confirm availability, wholesale prices, service fees and delivery costs.";

  return message;
}

function sendBasketToWhatsApp() {
  const message = createShoppingMessage();
  if (!message) return;

  window.open(
    "https://wa.me/254754058116?text=" + encodeURIComponent(message),
    "_blank"
  );
}

async function shareBasket() {
  const message = createShoppingMessage();
  if (!message) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "My NiPlag Shopping List",
        text: message
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        alert("Sharing was not completed. You can use WhatsApp instead.");
      }
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(message);
      alert("Shopping list copied. You can now paste and share it.");
    } catch {
      alert("Please use the WhatsApp option to share your list.");
    }
  } else {
    alert("Please use the WhatsApp option to share your list.");
  }
}

document.addEventListener("DOMContentLoaded", function() {
  updateBasketCount();

  const addButton = document.getElementById("add-to-basket");
  if (addButton) {
    addButton.addEventListener("click", addCurrentProduct);
  }

  const unlockButton = document.getElementById("unlock-button");
  const assistedButton = document.getElementById("assisted-button");

  const product = getProductDetails();
  const query = new URLSearchParams({
    product: product.name,
    id: product.id
  });

  if (product.price) query.set("price", product.price);

  if (unlockButton) {
    unlockButton.href = "unlock.html?" + query.toString();
  }

  if (assistedButton) {
    const message = "Hello NiPlag. I am interested in: " +
      product.name + ". Please help me buy this product.";

    assistedButton.href =
      "https://wa.me/254754058116?text=" + encodeURIComponent(message);
    assistedButton.target = "_blank";
    assistedButton.rel = "noopener";
  }

  renderBasket();

  const whatsappButton = document.getElementById("send-basket-whatsapp");
  if (whatsappButton) {
    whatsappButton.addEventListener("click", sendBasketToWhatsApp);
  }

  const shareButton = document.getElementById("share-basket");
  if (shareButton) {
    shareButton.addEventListener("click", shareBasket);
  }

});
      
