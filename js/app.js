/* Glow Theory Skin demo store logic. One delegated click listener, bound once. */
(function () {
  "use strict";
  var GT = window.GT;
  var byId = {};
  GT.products.forEach(function (p) { byId[p.id] = p; });
  function money(n) { return "$" + n; }
  function minPrice(p) { return Math.min.apply(null, p.sizes.map(function (s) { return s.price; })); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  /* ---------- cart state ---------- */
  var KEY = "gtcart.v1";
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function saveCart(c) {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    updateCount();
  }
  function cartCount() { return loadCart().reduce(function (a, l) { return a + l.qty; }, 0); }
  function cartSubtotal() {
    return loadCart().reduce(function (a, l) { return a + l.price * l.qty; }, 0);
  }
  function shippingFor(subtotal) { return subtotal === 0 ? 0 : (subtotal > 60 ? 0 : 5); }
  function updateCount() {
    var n = cartCount();
    document.querySelectorAll(".cart-count").forEach(function (el) {
      el.textContent = n; el.style.display = n ? "inline-flex" : "none";
    });
  }
  function addToCart(id, sizeLabel, qty) {
    var p = byId[id]; if (!p) return;
    var size = p.sizes.filter(function (s) { return s.label === sizeLabel; })[0] || p.sizes[0];
    var cart = loadCart();
    var line = cart.filter(function (l) { return l.id === id && l.size === size.label; })[0];
    if (line) { line.qty += qty || 1; }
    else { cart.push({ id: id, size: size.label, price: size.price, qty: qty || 1 }); }
    saveCart(cart);
    toast(p.name + " (" + size.label + ") added to your cart.");
  }
  function toast(msg) {
    var t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  /* ---------- product cards ---------- */
  function priceLabel(p) {
    if (p.sizes.length > 1) return "from " + money(minPrice(p));
    return money(p.sizes[0].price);
  }
  function cardHTML(p) {
    var tags = p.concerns.map(function (c) { return '<span class="tag">' + esc(c) + "</span>"; }).join("");
    return '<article class="card">' +
      '<a class="card-img" href="product.html?id=' + p.id + '"><img src="' + p.img + '" alt="' + esc(p.name) + '"></a>' +
      '<div class="card-body">' +
      '<h3><a href="product.html?id=' + p.id + '">' + esc(p.name) + "</a></h3>" +
      '<p class="card-line">' + esc(p.line) + "</p>" +
      (tags ? '<p class="tags">' + tags + "</p>" : "") +
      '<p class="card-foot"><span class="price">' + priceLabel(p) + "</span>" +
      '<button type="button" class="btn btn-small" data-add="' + p.id + '">Add to Cart</button></p>' +
      "</div></article>";
  }
  function renderInto(sel, list) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.innerHTML = list.map(cardHTML).join("");
    });
  }

  /* ---------- shop page ---------- */
  function shopState() {
    var q = new URLSearchParams(location.search);
    return {
      concern: q.get("concern") || "all",
      type: q.get("type") || "all",
      sort: q.get("sort") || "featured"
    };
  }
  function renderShop() {
    var grid = document.getElementById("shop-grid"); if (!grid) return;
    var cs = document.getElementById("filter-concern"), ts = document.getElementById("filter-type"), ss = document.getElementById("filter-sort");
    var concern = cs.value, type = ts.value, sort = ss.value;
    var list = GT.products.filter(function (p) {
      if (concern !== "all" && p.concerns.indexOf(concern) === -1) return false;
      if (type !== "all" && p.type !== type) return false;
      return true;
    });
    if (sort === "low") list = list.slice().sort(function (a, b) { return minPrice(a) - minPrice(b); });
    if (sort === "high") list = list.slice().sort(function (a, b) { return minPrice(b) - minPrice(a); });
    grid.innerHTML = list.length ? list.map(cardHTML).join("") :
      '<p class="empty-note">No products match that combination. Try clearing a filter.</p>';
    var count = document.getElementById("shop-count");
    if (count) count.textContent = "Showing " + list.length + " of " + GT.products.length + " products";
  }
  function initShop() {
    var cs = document.getElementById("filter-concern"); if (!cs) return;
    var st = shopState();
    cs.value = st.concern; document.getElementById("filter-type").value = st.type;
    document.getElementById("filter-sort").value = st.sort;
    ["filter-concern", "filter-type", "filter-sort"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", renderShop);
    });
    renderShop();
  }

  /* ---------- product page ---------- */
  function initProduct() {
    var wrap = document.getElementById("product-detail"); if (!wrap) return;
    var id = new URLSearchParams(location.search).get("id") || "vitc";
    var p = byId[id] || GT.products[0];
    document.title = p.name + " · Glow Theory Skin";
    var sizeBtns = p.sizes.map(function (s, i) {
      return '<button type="button" class="size-btn' + (i === 0 ? " active" : "") + '" data-size="' + esc(s.label) + '" data-price="' + s.price + '">' + esc(s.label) + " · " + money(s.price) + "</button>";
    }).join("");
    var contents = "";
    if (p.contents) {
      contents = '<h2>What is inside the set</h2><ul class="contents-list">' + p.contents.map(function (c) {
        return '<li><a href="product.html?id=' + c.id + '">' + esc(c.note) + "</a></li>";
      }).join("") + "</ul>" +
      '<p class="save-note">Set price ' + money(p.sizes[0].price) + ". Bought separately: " + money(p.separately) + ". You save " + money(p.separately - p.sizes[0].price) + ".</p>";
    }
    var related = GT.products.filter(function (r) {
      return r.id !== p.id && !r.set && r.concerns.some(function (c) { return p.concerns.indexOf(c) > -1; });
    }).slice(0, 4);
    if (!related.length) related = GT.products.filter(function (r) { return r.bestseller && r.id !== p.id; }).slice(0, 4);
    wrap.innerHTML =
      '<div class="pd-grid"><div class="pd-img"><img src="' + p.img + '" alt="' + esc(p.name) + '"></div>' +
      '<div class="pd-info"><p class="pd-type">' + esc(p.type) + "</p><h1>" + esc(p.name) + "</h1>" +
      '<p class="pd-line">' + esc(p.line) + "</p>" +
      '<p class="pd-price" id="pd-price">' + money(p.sizes[0].price) + "</p>" +
      (p.sizes.length > 1 ? '<p class="pd-label">Size</p><p class="size-row" id="size-row">' + sizeBtns + "</p>" : '<p class="pd-label">Size: ' + esc(p.sizes[0].label) + "</p>") +
      '<p class="pd-label">Quantity</p><p class="qty-row"><button type="button" class="qty-btn" id="qty-minus" aria-label="Decrease quantity">−</button>' +
      '<span id="qty-val">1</span><button type="button" class="qty-btn" id="qty-plus" aria-label="Increase quantity">+</button></p>' +
      '<p><button type="button" class="btn btn-big" id="pd-add" data-add-current="' + p.id + '">Add to Cart</button></p>' +
      '<p class="ship-note">Shipping is a flat $5 per order, and free on orders above $60.</p>' +
      "</div></div>" +
      '<div class="pd-sections"><section><h2>What it does</h2><p>' + esc(p.does) + "</p></section>" +
      '<section><h2>Who it suits</h2><p>' + esc(p.suits) + "</p></section>" +
      '<section><h2>How to use</h2><ol class="steps">' + p.use.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></section>" +
      '<section><h2>How long it lasts</h2><p>' + esc(p.lasts) + "</p></section>" +
      (p.warning ? '<section class="warning"><h2>Please note</h2><p>' + esc(p.warning) + "</p></section>" : "") +
      contents + "</div>" +
      '<section class="related"><h2>You may also need</h2><div class="grid grid-4">' + related.map(cardHTML).join("") + "</div></section>";
    var qty = 1, curSize = p.sizes[0];
    document.getElementById("qty-minus").addEventListener("click", function () { qty = Math.max(1, qty - 1); document.getElementById("qty-val").textContent = qty; });
    document.getElementById("qty-plus").addEventListener("click", function () { qty = Math.min(9, qty + 1); document.getElementById("qty-val").textContent = qty; });
    var sizeRow = document.getElementById("size-row");
    if (sizeRow) {
      sizeRow.addEventListener("click", function (e) {
        var b = e.target.closest("[data-size]"); if (!b) return;
        sizeRow.querySelectorAll(".size-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        curSize = p.sizes.filter(function (s) { return s.label === b.getAttribute("data-size"); })[0];
        document.getElementById("pd-price").textContent = money(curSize.price);
      });
    }
    document.getElementById("pd-add").addEventListener("click", function () { addToCart(p.id, curSize.label, qty); });
  }

  /* ---------- cart page ---------- */
  function renderCart() {
    var wrap = document.getElementById("cart-lines"); if (!wrap) return;
    var cart = loadCart();
    var sumEl = document.getElementById("cart-summary");
    if (!cart.length) {
      wrap.innerHTML = '<p class="empty-note">Your cart is empty. <a href="shop.html">Browse the range</a> and add something simple.</p>';
      if (sumEl) { sumEl.innerHTML = ""; sumEl.style.display = "none"; }
      return;
    }
    if (sumEl) sumEl.style.display = "block";
    wrap.innerHTML = cart.map(function (l, i) {
      var p = byId[l.id];
      return '<div class="cart-line"><img src="' + p.img + '" alt="' + esc(p.name) + '">' +
        '<div class="cl-info"><h3><a href="product.html?id=' + p.id + '">' + esc(p.name) + "</a></h3>" +
        "<p>Size: " + esc(l.size) + "</p><p>" + money(l.price) + " each</p></div>" +
        '<p class="qty-row"><button type="button" class="qty-btn" data-dec="' + i + '" aria-label="Decrease">−</button><span>' + l.qty + '</span>' +
        '<button type="button" class="qty-btn" data-inc="' + i + '" aria-label="Increase">+</button></p>' +
        '<p class="cl-total">' + money(l.price * l.qty) + "</p>" +
        '<button type="button" class="remove-btn" data-remove="' + i + '">Remove</button></div>';
    }).join("");
    var sub = cartSubtotal(), ship = shippingFor(sub);
    if (sumEl) {
      sumEl.innerHTML = '<p><span>Subtotal</span><strong>' + money(sub) + "</strong></p>" +
        '<p><span>Shipping</span><strong>' + (ship === 0 ? "Free" : money(ship)) + "</strong></p>" +
        (ship > 0 ? '<p class="ship-hint">Add ' + money(61 - sub) + " more for free shipping (free above $60).</p>" : '<p class="ship-hint">Your order ships free.</p>') +
        '<p class="grand"><span>Total</span><strong>' + money(sub + ship) + "</strong></p>" +
        '<a class="btn btn-big" href="checkout.html">Go to Checkout</a>';
    }
  }

  /* ---------- checkout ---------- */
  function renderSummary() {
    var el = document.getElementById("order-summary"); if (!el) return false;
    var cart = loadCart();
    if (!cart.length) { el.innerHTML = '<p class="empty-note">Your cart is empty.</p>'; return false; }
    var sub = cartSubtotal(), ship = shippingFor(sub);
    el.innerHTML = "<h2>Order summary</h2>" + cart.map(function (l) {
      var p = byId[l.id];
      return '<p class="os-line"><span>' + esc(p.name) + " (" + esc(l.size) + ") × " + l.qty + "</span><strong>" + money(l.price * l.qty) + "</strong></p>";
    }).join("") +
      '<p class="os-line"><span>Subtotal</span><strong>' + money(sub) + "</strong></p>" +
      '<p class="os-line"><span>Shipping</span><strong>' + (ship === 0 ? "Free" : money(ship)) + "</strong></p>" +
      '<p class="os-line grand"><span>Total</span><strong>' + money(sub + ship) + "</strong></p>";
    return true;
  }
  function initCheckout() {
    var form = document.getElementById("checkout-form"); if (!form) return;
    renderSummary();
    var payRadios = form.querySelectorAll('input[name="pay"]');
    function syncPay() {
      var card = form.querySelector('input[name="pay"]:checked').value === "card";
      document.getElementById("card-fields").style.display = card ? "block" : "none";
      form.querySelectorAll("#card-fields input").forEach(function (i) { i.required = card; });
    }
    payRadios.forEach(function (r) { r.addEventListener("change", syncPay); }); syncPay();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!loadCart().length) { toast("Your cart is empty."); return; }
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) {
        var bad = !f.value.trim() || (f.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
        f.classList.toggle("field-error", bad); if (bad) ok = false;
      });
      if (!ok) { toast("Please fill in the highlighted fields."); return; }
      var num = "GT-" + Math.floor(100000 + Math.random() * 900000);
      saveCart([]);
      document.getElementById("checkout-main").innerHTML =
        '<div class="success-box"><h1>Thank you, your order is placed.</h1>' +
        "<p>Your demo order number is <strong>" + num + "</strong>.</p>" +
        "<p>This is a demo store, so nothing has been charged and nothing will be posted. In a real store, a confirmation email would now be on its way to you.</p>" +
        '<p><a class="btn" href="shop.html">Keep browsing</a></p></div>';
      window.scrollTo(0, 0);
    });
  }

  /* ---------- contact form ---------- */
  function initContact() {
    var form = document.getElementById("contact-form"); if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) {
        var bad = !f.value.trim() || (f.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
        f.classList.toggle("field-error", bad); if (bad) ok = false;
      });
      if (!ok) { toast("Please fill in the highlighted fields."); return; }
      document.getElementById("contact-done").style.display = "block";
      form.reset();
    });
  }

  /* ---------- one delegated click listener (bound once) ---------- */
  if (!window.__gtBound) {
    window.__gtBound = true;
    document.addEventListener("click", function (e) {
      var add = e.target.closest("[data-add]");
      if (add) { addToCart(add.getAttribute("data-add"), null, 1); return; }
      var inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]"), rem = e.target.closest("[data-remove]");
      if (inc || dec || rem) {
        var cart = loadCart(), idx = parseInt((inc || dec || rem).getAttribute("data-inc") || (inc || dec || rem).getAttribute("data-dec") || (inc || dec || rem).getAttribute("data-remove"), 10);
        if (inc) cart[idx].qty = Math.min(9, cart[idx].qty + 1);
        if (dec) { cart[idx].qty -= 1; if (cart[idx].qty < 1) cart.splice(idx, 1); }
        if (rem) cart.splice(idx, 1);
        saveCart(cart); renderCart();
        return;
      }
      var faqBtn = e.target.closest(".faq-q");
      if (faqBtn) {
        var item = faqBtn.parentElement, ans = item.querySelector(".faq-a"), open = item.classList.contains("open");
        item.parentElement.querySelectorAll(".faq-item.open").forEach(function (o) {
          o.classList.remove("open"); o.querySelector(".faq-a").style.maxHeight = null;
          o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        });
        if (!open) { item.classList.add("open"); ans.style.maxHeight = ans.scrollHeight + "px"; faqBtn.setAttribute("aria-expanded", "true"); }
        return;
      }
      var navBtn = e.target.closest(".nav-toggle");
      if (navBtn) {
        var nav = document.getElementById("main-nav");
        var isOpen = nav.classList.toggle("open");
        navBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }
    });
  }

  /* ---------- page init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    updateCount();
    renderInto("[data-best]", GT.products.filter(function (p) { return p.bestseller; }).slice(0, 4));
    renderInto("[data-set-cards]", GT.products.filter(function (p) { return p.set; }));
    document.querySelectorAll("[data-concern-grid]").forEach(function (el) {
      var c = el.getAttribute("data-concern-grid");
      el.innerHTML = GT.products.filter(function (p) { return p.concerns.indexOf(c) > -1; }).map(cardHTML).join("");
    });
    var ing = document.getElementById("ingredient-list");
    if (ing) {
      ing.innerHTML = GT.ingredients.map(function (g) {
        var links = g.products.map(function (pid) {
          var p = byId[pid];
          return '<a class="chip-link" href="product.html?id=' + p.id + '">' + esc(p.name) + "</a>";
        }).join("");
        return '<article class="ing-card" id="ing-' + g.id + '"><h2>' + esc(g.name) + "</h2>" +
          "<p><strong>What it does:</strong> " + esc(g.does) + "</p>" +
          "<p><strong>Who should be careful:</strong> " + esc(g.careful) + "</p>" +
          '<p class="ing-links">Find it in: ' + links + "</p></article>";
      }).join("");
    }
    initShop(); initProduct(); renderCart(); initCheckout(); initContact();
  });
})();
