let cart = JSON.parse(localStorage.getItem("cart")) || [];
let currentStock = 0;
let selectedSize = null;
let activeCard = null;

const API_URL = "https://sheetdb.io/api/v1/lfu8wdx2v48sg";

fetch(`${API_URL}?t=${Date.now()}`)
  .then(res => res.json())
  .then(products => {

    const container = document.getElementById("products-container");
    container.innerHTML = "";

    // GROUPING STEP (PUT HERE)
    const grouped = {};

    products.forEach(p => {

      if (!grouped[p.name]) {
        grouped[p.name] = {
          name: p.name,
          price: p.price,
          image: p.image,
          description: p.description,
          category: p.category,
          size: []
        };
      }

      grouped[p.name].size.push({
        size: p.size,
        stock: Number(p.stock)
      });

    });

    const groupedArray = Object.values(grouped);

    // RENDER STEP (PUT HERE)
    groupedArray.forEach(product => {

    const totalStock = product.size.reduce((a, b) => a + b.stock, 0);
    const disabled = totalStock <= 0;

    container.innerHTML += `
        <div class="col-6 col-md-4">

        <div
            class="minimal-card"
            data-bs-toggle="modal"
            data-bs-target="#productModal"

            data-name="${product.name}"
            data-price="${product.price}"
            data-image="${product.image}"
            data-description="${product.description}"

            data-size='${JSON.stringify(product.size)}'
        >

            <div class="product-image-wrap">
            <span class="floating-tag">${product.category}</span>
            <img src="${product.image}">
            </div>

            <div class="minimal-body">

            <h5>${product.name}</h5>

            <small class="text-muted">
                Stock: ${totalStock}
            </small>

            <div class="price-row">

                <span>฿${product.price}</span>

                <button
                class="add-cart-btn"
                ${disabled ? "disabled" : ""}
                style="${disabled ? "opacity:0.5;cursor:not-allowed;" : ""}"
                >
                ${disabled ? "Out of Stock" : "View"}
                </button>

            </div>

            </div>

        </div>

        </div>
    `;
    });

  });

document.querySelector(".product-modal .add-cart-btn")
.addEventListener("click", () => {

  const stockLimit = getStock();   // ✅ ALWAYS correct size stock

  const existing = cart.find(item =>
    item.name === document.getElementById("modal-name").textContent &&
    item.size === selectedSize
  );

  const currentQty = existing ? existing.quantity : 0;

  if (currentQty + modalQty > stockLimit) {
    showToast(`Only ${stockLimit} left in stock`, true);
    return;
  }

  addToCart({
    name: document.getElementById("modal-name").textContent,
    price: Number(document.getElementById("modal-price").textContent.replace("฿","")),
    image: document.getElementById("modal-image").src,
    size: selectedSize,
    quantity: modalQty,
    stock: stockLimit
  });

});

document.addEventListener("click", e => {

  const card = e.target.closest(".minimal-card");
  if (!card) return;

  activeCard = card;

  modalQty = 1;
  document.querySelector(".quantity-box span").textContent = modalQty;

  document.getElementById("modal-name").textContent = card.dataset.name;
  document.getElementById("modal-price").textContent = `฿${card.dataset.price}`;
  document.getElementById("modal-description").textContent = card.dataset.description;
  document.getElementById("modal-image").src = card.dataset.image;

  const sizes = JSON.parse(card.dataset.size);

  // default size = first with stock
  const firstAvailable = sizes.find(s => s.stock > 0);
  selectedSize = firstAvailable ? firstAvailable.size : sizes[0].size;

  updateStockDisplay();

  // render buttons
  const sizeContainer = document.querySelector(".size-options");
  sizeContainer.innerHTML = "";

  sizes.forEach(s => {
    sizeContainer.innerHTML += `
      <button class="size-btn ${s.size === selectedSize ? "active" : ""}"
        ${s.stock <= 0 ? "disabled" : ""}>
        ${s.size}
      </button>
    `;
  });

});

document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("size-btn")) return;

  selectedSize = e.target.textContent.trim();

  document.querySelectorAll(".size-btn").forEach(btn =>
    btn.classList.remove("active")
  );

  e.target.classList.add("active");

  updateStockDisplay();
});

/* ADD */

function addToCart(product) {

  const existing = cart.find(item =>
    item.name === product.name &&
    item.size === product.size
  );

  const currentQty = existing ? existing.quantity : 0;
  const stockLimit = Number(product.stock || 0);

  if (currentQty + product.quantity > stockLimit) {
    showToast(`Only ${stockLimit} left in stock`, true);
    return;
  }

  if (existing) {
    existing.quantity += product.quantity;
  } else {
    cart.push(product);
  }

  saveCart();
  updateCart();
  showToast("Added to cart successfully");
}

/* SAVE */

function saveCart() {

  localStorage.setItem("cart", JSON.stringify(cart));

}

/* UPDATE UI */

function updateCart() {

  renderCart();

  updateBadge();

}

/* BADGE */

function updateBadge() {

  const badge = document.querySelector(".cart-badge");

  let total = 0;

  cart.forEach(item => {

    total += item.quantity;

  });

  badge.textContent = total;

}

/* RENDER */

function renderCart() {

  const container = document.getElementById("cart-items");

  const totalElement = document.getElementById("cart-total");

  if (!container) return;

  container.innerHTML = "";

  let total = 0;

  cart.forEach(item => {

    const maxed = item.quantity >= item.stock;
    total += item.price * item.quantity;

    container.innerHTML += `

    <div class="cart-item">

        <img src="${item.image}">

        <div class="cart-info">

        <h6>${item.name}</h6>

        <p>฿${item.price}</p>

        <p>Size: ${item.size}</p>

        <p>Qty: ${item.quantity}</p>

        </div>

        <!-- REMOVE BUTTON -->
        <div class="cart-qty-controls">

        <button onclick="decreaseQty('${item.name}', '${item.size}')">

            <i class="bi bi-dash"></i>

        </button>

        <span>${item.quantity}</span>

        <button
        onclick="increaseQty('${item.name}', '${item.size}')"
        ${maxed ? "disabled" : ""}
        >
        <i class="bi bi-plus"></i>
        </button>

        </div>

    </div>

    `;

  });

  totalElement.textContent = `฿${total}`;

}

/* TOAST */

function showToast(message = "Added to cart successfully", isError = false) {

  const toastEl = document.getElementById("cartToast");

  const toastBody = toastEl.querySelector(".toast-body");

  toastBody.innerHTML = `
    <i class="bi ${isError ? "bi-x-circle-fill text-danger" : "bi-check-circle-fill text-success"} me-2"></i>
    ${message}
  `;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

/* INITIAL */

updateCart();


/* QUANTITY */

function increaseQty(name, size) {

  const item = cart.find(item =>
    item.name === name &&
    item.size === size
  );

  if (!item) return;

  const stockLimit = Number(item.stock ?? Infinity);

  if (item.quantity >= stockLimit) {
    showToast("No more stock available", true);
    return;
  }

  item.quantity++;

  saveCart();
  updateCart();
}

function decreaseQty(name, size) {

  const item = cart.find(item =>

    item.name === name &&
    item.size === size

  );

  if (!item) return;

  item.quantity--;

  if (item.quantity <= 0) {

    cart = cart.filter(item => !(

      item.name === name &&
      item.size === size

    ));

  }

  saveCart();

  updateCart();

}

let modalQty = 1;

document.addEventListener("click", (e) => {

  if (e.target.matches(".quantity-box button:first-child")) {
    modalQty = Math.max(1, modalQty - 1);
  }

  if (e.target.matches(".quantity-box button:last-child")) {

    const stock = getStock(); // 🔥 always correct

    if (modalQty >= stock) {
        showToast("No more stock available", true);
        return;
    }

    modalQty++;
  }

  const span = document.querySelector(".quantity-box span");
  if (span) span.textContent = modalQty;
});

/* CLEAR */

function clearCart() {

  cart = [];

  localStorage.removeItem("cart");

  updateCart();

}

function updateStockDisplay() {
  const stock = getStock();

  document.getElementById("modal-stock").innerHTML =
    stock > 0
      ? `Stock: <b>${stock}</b>`
      : `<span style="color:red;">Out of stock</span>`;
}

function getStock(card = activeCard, size = selectedSize) {
  if (!card) return 0;

  const sizes = JSON.parse(card.dataset.size);
  const found = sizes.find(s => s.size === size);

  return found ? found.stock : 0;
}