// Preset Color Gradients for Custom Books
const GRADIENT_PRESETS = [
  { value: "linear-gradient(135deg, #6366f1, #a855f7)", label: "Indigo Purple" },
  { value: "linear-gradient(135deg, #f59e0b, #e11d48)", label: "Amber Rose" },
  { value: "linear-gradient(135deg, #06b6d4, #3b82f6)", label: "Teal Blue" },
  { value: "linear-gradient(135deg, #10b981, #059669)", label: "Emerald Green" },
  { value: "linear-gradient(135deg, #ec4899, #f43f5e)", label: "Pink Crimson" },
  { value: "linear-gradient(135deg, #2563eb, #7c3aed)", label: "Royal Purple" }
];

// Application State
let state = {
  books: [],
  cart: [],
  activeCategory: 'all',
  searchQuery: '',
  activePaymentMethod: 'momo', // 'momo' or 'bank'
  currentCheckoutStep: 1, // 1: Delivery, 2: Payment, 3: Success
  selectedBookId: null,
  receiptUploaded: false,
  currentUser: null, // { id, email, username, role }
  activeView: 'store', // 'store', 'login', 'admin'
  authMode: 'login' // 'login' or 'signup'
};

// DOM Elements
const storeView = document.getElementById('store-view');
const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');

const booksGrid = document.getElementById('books-grid');
const booksCount = document.getElementById('books-count');
const currentCategoryTitle = document.getElementById('current-category-title');
const categoriesBar = document.getElementById('categories-bar');
const searchInput = document.getElementById('search-input');

// Auth DOM
const guestAuthBlock = document.getElementById('guest-auth-block');
const userAuthBlock = document.getElementById('user-auth-block');
const userDisplayName = document.getElementById('user-display-name');
const userRoleBadge = document.getElementById('user-role-badge');
const goLoginBtn = document.getElementById('go-login-btn');
const storeLogoutBtn = document.getElementById('store-logout-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Login Form DOM
const loginForm = document.getElementById('login-form');
const loginNameInput = document.getElementById('login-name');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginConfirmInput = document.getElementById('login-confirm-password');
const loginSubmitBtn = document.getElementById('login-submit-btn');

const toggleSignupMode = document.getElementById('toggle-signup-mode');
const loginBackToStore = document.getElementById('login-back-to-store');
const signupNameGroup = document.getElementById('signup-name-group');
const signupConfirmGroup = document.getElementById('signup-confirm-group');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const emailLabel = document.getElementById('email-label');

// Admin Controls DOM
const adminAddBookTrigger = document.getElementById('admin-add-book-trigger');
const adminAddBookModal = document.getElementById('admin-add-book-modal');
const closeAddBookBtn = document.getElementById('close-add-book-btn');
const adminAddBookForm = document.getElementById('admin-add-book-form');
const coverPresetsList = document.getElementById('cover-presets-list');
const addBookGradientVal = document.getElementById('add-book-gradient-val');
const adminInventoryList = document.getElementById('admin-inventory-list');

// Admin Stats DOM
const metricTotalBooks = document.getElementById('metric-total-books');
const metricOutOfStock = document.getElementById('metric-out-of-stock');
const metricTotalValue = document.getElementById('metric-total-value');

// Cart DOM
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartShipping = document.getElementById('cart-shipping');
const cartGrandTotal = document.getElementById('cart-grand-total');
const checkoutTriggerBtn = document.getElementById('checkout-trigger-btn');

// Modals DOM
const modalOverlay = document.getElementById('modal-overlay');
const detailsModal = document.getElementById('details-modal');
const closeDetailsBtn = document.getElementById('close-details-btn');
const detailsModalContent = document.getElementById('details-modal-content');

// Checkout DOM
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutBtn = document.getElementById('close-checkout-btn');
const checkoutForm = document.getElementById('checkout-form');
const prevStepBtn = document.getElementById('prev-step-btn');
const nextStepBtn = document.getElementById('next-step-btn');

const stepHeader1 = document.getElementById('step-header-1');
const stepHeader2 = document.getElementById('step-header-2');
const stepHeader3 = document.getElementById('step-header-3');

const stepContent1 = document.getElementById('checkout-step-1');
const stepContent2 = document.getElementById('checkout-step-2');
const stepContent3 = document.getElementById('checkout-step-3');

const payMomoTab = document.getElementById('pay-momo-tab');
const payBankTab = document.getElementById('pay-bank-tab');
const momoDetailsPanel = document.getElementById('momo-details-panel');
const bankDetailsPanel = document.getElementById('bank-details-panel');

const momoNumberInput = document.getElementById('momo-number');
const bankDepositorInput = document.getElementById('bank-depositor');
const bankRefInput = document.getElementById('bank-ref');
const bankReceiptInput = document.getElementById('bank-receipt');
const receiptUploadBtn = document.getElementById('receipt-upload-btn');
const receiptUploadText = document.getElementById('receipt-upload-text');

// Notification DOM
const notificationContainer = document.getElementById('notification-container');

// Load App
document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  // 1. Load Cart from localStorage
  const savedCart = localStorage.getItem('novelnest_cart');
  if (savedCart) {
    state.cart = JSON.parse(savedCart);
  }

  // 2. Setup Event Listeners
  setupEventListeners();

  // 3. Render Cover Presets in Modal
  renderCoverPresets();

  // 4. Bind real-time Auth state listener
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user) {
      const user = session.user;
      
      // Query profiles table for role
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id);
      
      const role = (profile && profile[0]) ? profile[0].role : 'customer';

      state.currentUser = {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.full_name || user.email.split('@')[0],
        role: role
      };

      if (state.currentUser.role === 'admin') {
        state.activeView = 'admin';
      } else {
        state.activeView = 'store';
      }
    } else {
      state.currentUser = null;
      if (state.activeView === 'admin') {
        state.activeView = 'store';
      }
    }

    switchView(state.activeView);
  });
}

// Loads Books dynamically from Supabase database
async function loadBooks() {
  const { data, error } = await supabaseClient
    .from('books')
    .select('*');

  if (error) {
    console.error("Error loading books:", error);
    showToast("Error loading catalog from online database.", "error");
    return;
  }

  state.books = data || [];
  
  if (state.activeView === 'store') {
    renderBooks();
  } else if (state.activeView === 'admin') {
    renderAdminDashboard();
  }
}

// Router view switcher
function switchView(viewName) {
  state.activeView = viewName;

  // Toggle DOM views
  storeView.classList.remove('active');
  loginView.classList.remove('active');
  adminView.classList.remove('active');

  closeCart();
  closeDetailsModal();
  closeAddBookModal();

  if (viewName === 'store') {
    storeView.classList.add('active');
    updateHeaderAuthUI();
    loadBooks(); // refresh list
    updateCartUI();
  } else if (viewName === 'login') {
    loginView.classList.add('active');
    setAuthMode('login');
  } else if (viewName === 'admin') {
    if (!state.currentUser || state.currentUser.role !== 'admin') {
      showToast('Unauthorized access. Please log in as admin.', 'error');
      switchView('login');
      return;
    }
    adminView.classList.add('active');
    loadBooks(); // refresh list
  }

  window.scrollTo(0, 0);
}

function updateHeaderAuthUI() {
  if (state.currentUser) {
    guestAuthBlock.style.display = 'none';
    userAuthBlock.style.display = 'flex';
    userDisplayName.textContent = state.currentUser.username;
    
    // Update badge styling
    userRoleBadge.textContent = state.currentUser.role;
    if (state.currentUser.role === 'admin') {
      userRoleBadge.style.backgroundColor = 'rgba(236, 72, 153, 0.1)';
      userRoleBadge.style.color = '#f472b6';
    } else {
      userRoleBadge.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
      userRoleBadge.style.color = 'var(--primary)';
    }
  } else {
    guestAuthBlock.style.display = 'block';
    userAuthBlock.style.display = 'none';
  }
}

function setAuthMode(mode) {
  state.authMode = mode;
  loginForm.reset();

  if (mode === 'login') {
    authTitle.textContent = "Welcome Back";
    authSubtitle.textContent = "Log in to manage orders or access the catalog";
    emailLabel.textContent = "Username or Email";
    loginUsernameInput.placeholder = "Enter username or email address";
    signupNameGroup.style.display = "none";
    signupConfirmGroup.style.display = "none";
    loginSubmitBtn.textContent = "Log In";
    toggleSignupMode.textContent = "Don't have an account? Sign Up";
  } else {
    authTitle.textContent = "Create Account";
    authSubtitle.textContent = "Register to order books and save your details";
    emailLabel.textContent = "Email Address";
    loginUsernameInput.placeholder = "name@example.com";
    signupNameGroup.style.display = "block";
    signupConfirmGroup.style.display = "block";
    loginSubmitBtn.textContent = "Sign Up";
    toggleSignupMode.textContent = "Already have an account? Log In";
  }
}

function setupEventListeners() {
  // Routing Switches
  goLoginBtn.addEventListener('click', () => switchView('login'));
  loginBackToStore.addEventListener('click', () => switchView('store'));

  // Toggle Login/Signup Modes
  toggleSignupMode.addEventListener('click', () => {
    if (state.authMode === 'login') {
      setAuthMode('signup');
    } else {
      setAuthMode('login');
    }
  });

  // Logout Buttons
  storeLogoutBtn.addEventListener('click', logoutUser);
  adminLogoutBtn.addEventListener('click', logoutUser);

  // Login/Signup Submit
  loginForm.addEventListener('submit', handleAuthSubmit);

  // Category Filtering
  categoriesBar.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-btn')) {
      document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      state.activeCategory = e.target.dataset.category;
      currentCategoryTitle.textContent = e.target.textContent;
      renderBooks();
    }
  });

  // Live Search
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim().toLowerCase();
    renderBooks();
  });

  // Cart Drawer toggles
  cartBtn.addEventListener('click', openCart);
  closeCartBtn.addEventListener('click', closeCart);
  modalOverlay.addEventListener('click', () => {
    closeCart();
    closeDetailsModal();
    closeAddBookModal();
    if (state.currentCheckoutStep !== 3) {
      closeCheckoutModal();
    }
  });

  // Details Modal close
  closeDetailsBtn.addEventListener('click', closeDetailsModal);

  // Add to cart click delegates
  booksGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.book-card');
    const addToCartBtn = e.target.closest('.add-to-cart-btn');

    if (addToCartBtn) {
      e.stopPropagation();
      const bookId = parseInt(addToCartBtn.dataset.id);
      addToCart(bookId);
    } else if (card) {
      const bookId = parseInt(card.dataset.id);
      openDetailsModal(bookId);
    }
  });

  // Detail Modal Add click
  detailsModalContent.addEventListener('click', (e) => {
    const detailAddBtn = e.target.closest('.details-btn');
    if (detailAddBtn) {
      const bookId = parseInt(detailAddBtn.dataset.id);
      addToCart(bookId);
      closeDetailsModal();
    }
  });

  // Cart Item list adjustments
  cartItemsContainer.addEventListener('click', (e) => {
    const qtyBtn = e.target.closest('.qty-btn');
    const removeBtn = e.target.closest('.remove-item-btn');

    if (qtyBtn) {
      const bookId = parseInt(qtyBtn.dataset.id);
      const delta = parseInt(qtyBtn.dataset.delta);
      updateQuantity(bookId, delta);
    } else if (removeBtn) {
      const bookId = parseInt(removeBtn.dataset.id);
      removeFromCart(bookId);
    }
  });

  // Checkout modal triggers
  checkoutTriggerBtn.addEventListener('click', () => {
    closeCart();
    openCheckoutModal();
  });

  closeCheckoutBtn.addEventListener('click', () => {
    if (state.currentCheckoutStep !== 3) {
      closeCheckoutModal();
    }
  });

  prevStepBtn.addEventListener('click', checkoutPrevStep);
  nextStepBtn.addEventListener('click', checkoutNextStep);

  // Payment Tabs Toggle
  payMomoTab.addEventListener('click', () => setPaymentMethod('momo'));
  payBankTab.addEventListener('click', () => setPaymentMethod('bank'));

  // Receipt File upload
  receiptUploadBtn.addEventListener('click', () => {
    bankReceiptInput.click();
  });

  bankReceiptInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const filename = e.target.files[0].name;
      receiptUploadText.textContent = `Receipt selected: ${filename}`;
      receiptUploadBtn.classList.add('has-file');
      state.receiptUploaded = true;
      showToast('Receipt file attached!', 'info');
    } else {
      receiptUploadText.textContent = 'Click to upload receipt image/PDF';
      receiptUploadBtn.classList.remove('has-file');
      state.receiptUploaded = false;
    }
  });

  // Admin Add Book Actions
  adminAddBookTrigger.addEventListener('click', openAddBookModal);
  closeAddBookBtn.addEventListener('click', closeAddBookModal);
  adminAddBookForm.addEventListener('submit', handleAddBook);

  // Admin Color Preset clicks
  coverPresetsList.addEventListener('click', (e) => {
    const option = e.target.closest('.color-preset-option');
    if (option) {
      document.querySelectorAll('.color-preset-option').forEach(el => el.classList.remove('active'));
      option.classList.add('active');
      addBookGradientVal.value = option.dataset.gradient;
    }
  });

  // Admin Inventory Table stock adjustments / deletions delegates
  adminInventoryList.addEventListener('click', (e) => {
    const adjustBtn = e.target.closest('.adjust-btn');
    const deleteBtn = e.target.closest('.table-btn-delete');

    if (adjustBtn) {
      const bookId = parseInt(adjustBtn.dataset.id);
      const delta = parseInt(adjustBtn.dataset.delta);
      adjustStockInline(bookId, delta);
    } else if (deleteBtn) {
      const bookId = parseInt(deleteBtn.dataset.id);
      deleteBook(bookId);
    }
  });

  // Inline input changes for stock
  adminInventoryList.addEventListener('change', (e) => {
    const input = e.target.closest('.stock-input');
    if (input) {
      const bookId = parseInt(input.dataset.id);
      let val = parseInt(input.value);
      if (isNaN(val) || val < 0) val = 0;
      setStockInline(bookId, val);
    }
  });
}

// User Sign in / Registration Handler
async function handleAuthSubmit(e) {
  e.preventDefault();
  
  const email = loginUsernameInput.value.trim();
  const password = loginPasswordInput.value.trim();

  // 1. SIGN IN MODE
  if (state.authMode === 'login') {
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Logging in...`;

    // Attempt Supabase email login
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = "Log In";

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Logged in successfully!', 'success');
      // Auth state listener handles routing and state setup
    }
  } 
  // 2. SIGN UP MODE
  else {
    const fullName = loginNameInput.value.trim();
    const confirmPassword = loginConfirmInput.value.trim();

    if (!fullName) {
      showToast('Please enter your full name.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    loginSubmitBtn.disabled = true;
    loginSubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;

    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = "Sign Up";

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Registration successful! Session active.', 'success');
      switchView('store');
    }
  }
}

async function logoutUser() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    showToast(error.message, 'error');
  } else {
    showToast('Logged out successfully.', 'info');
    switchView('store');
  }
}

// Render Book Cards for Customer
function renderBooks() {
  let filtered = state.books.filter(book => {
    const matchesCategory = state.activeCategory === 'all' || book.category === state.activeCategory;
    const matchesSearch = book.title.toLowerCase().includes(state.searchQuery) || 
                          book.author.toLowerCase().includes(state.searchQuery);
    return matchesCategory && matchesSearch;
  });

  booksCount.textContent = `${filtered.length} book${filtered.length !== 1 ? 's' : ''} found`;

  if (filtered.length === 0) {
    booksGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-book-bookmark"></i>
        <h3>No books found</h3>
        <p>Try searching for different terms or switching categories.</p>
      </div>
    `;
    return;
  }

  booksGrid.innerHTML = filtered.map(book => {
    const isOutOfStock = book.stock <= 0;
    return `
      <div class="book-card ${isOutOfStock ? 'out-of-stock' : ''}" data-id="${book.id}">
        ${isOutOfStock ? `<span class="card-out-of-stock-label">Out of stock</span>` : ''}
        <div class="book-cover-container">
          <div class="book-cover-mock" style="background: ${book.cover_gradient}">
            <div class="cover-title">${book.title}</div>
            <div class="cover-author">${book.author}</div>
          </div>
        </div>
        <div class="book-info">
          <span class="book-category">${book.category}</span>
          <h3 class="book-title" title="${book.title}">${book.title}</h3>
          <p class="book-author">by ${book.author}</p>
          <div class="book-rating">
            <i class="fa-solid fa-star"></i>
            <span>${Number(book.rating).toFixed(1)}</span>
            <span class="rating-num">(${book.published_year})</span>
          </div>
          <div class="book-footer">
            <span class="book-price">$${Number(book.price).toFixed(2)}</span>
            <button class="add-to-cart-btn" data-id="${book.id}" ${isOutOfStock ? 'disabled' : ''} aria-label="Add to Cart">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Add to Cart Logic with Stock checks
function addToCart(bookId) {
  const book = state.books.find(b => b.id === bookId);
  if (!book) return;

  if (book.stock <= 0) {
    showToast(`Sorry, "${book.title}" is currently out of stock.`, 'error');
    return;
  }

  const existing = state.cart.find(item => item.bookId === bookId);
  const currentQtyInCart = existing ? existing.quantity : 0;

  if (currentQtyInCart >= book.stock) {
    showToast(`Sorry, only ${book.stock} copy/copies available in stock.`, 'error');
    return;
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ bookId, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  showToast(`"${book.title}" added to cart!`, 'success');
}

function updateQuantity(bookId, delta) {
  const item = state.cart.find(item => item.bookId === bookId);
  const book = state.books.find(b => b.id === bookId);
  
  if (item && book) {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(bookId);
      return;
    }
    
    if (newQty > book.stock) {
      showToast(`Sorry, only ${book.stock} copy/copies available in stock.`, 'error');
      return;
    }

    item.quantity = newQty;
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(bookId) {
  const book = state.books.find(b => b.id === bookId);
  state.cart = state.cart.filter(item => item.bookId !== bookId);
  saveCart();
  updateCartUI();
  if (book) showToast(`"${book.title}" removed from cart.`, 'info');
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalCount;
  checkoutTriggerBtn.disabled = totalCount === 0;

  if (state.cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Your shopping cart is empty</p>
      </div>
    `;
    cartSubtotal.textContent = '$0.00';
    cartShipping.textContent = '$0.00';
    cartGrandTotal.textContent = '$0.00';
    return;
  }

  let subtotal = 0;
  cartItemsContainer.innerHTML = state.cart.map(item => {
    const book = state.books.find(b => b.id === item.bookId);
    if (!book) return '';
    
    const lineTotal = book.price * item.quantity;
    subtotal += lineTotal;

    return `
      <div class="cart-item">
        <div class="cart-item-cover" style="background: ${book.cover_gradient}">
          ${book.title}
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${book.title}</div>
          <div class="cart-item-author">${book.author}</div>
          <div class="cart-item-price">$${Number(book.price).toFixed(2)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="qty-btn" data-id="${book.id}" data-delta="-1" aria-label="Decrease quantity">
              <i class="fa-solid fa-minus"></i>
            </button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" data-id="${book.id}" data-delta="1" aria-label="Increase quantity">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          <button class="remove-item-btn" data-id="${book.id}">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  const shipping = 5.00;
  const grandTotal = subtotal + shipping;

  cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  cartShipping.textContent = `$${shipping.toFixed(2)}`;
  cartGrandTotal.textContent = `$${grandTotal.toFixed(2)}`;
}

// Dialog Toggles
function openCart() {
  cartDrawer.classList.add('open');
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartDrawer.classList.remove('open');
  if (!detailsModal.classList.contains('open') && !checkoutModal.classList.contains('open') && !adminAddBookModal.classList.contains('open')) {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function openDetailsModal(bookId) {
  state.selectedBookId = bookId;
  const book = state.books.find(b => b.id === bookId);
  if (!book) return;

  const isOutOfStock = book.stock <= 0;

  detailsModalContent.innerHTML = `
    <div class="details-cover-container">
      <div class="book-cover-mock" style="background: ${book.cover_gradient}; width: 160px; height: 240px; font-size: 1rem; padding: 1.5rem 1.25rem;">
        <div class="cover-title">${book.title}</div>
        <div class="cover-author">${book.author}</div>
      </div>
    </div>
    <div class="details-info">
      <span class="book-category">${book.category}</span>
      <h2 class="details-title">${book.title}</h2>
      <div class="details-author">by ${book.author}</div>
      <div class="details-meta">
        <div class="meta-item">
          <span class="meta-label">Rating</span>
          <span class="meta-value" style="color: #fbbf24;"><i class="fa-solid fa-star"></i> ${Number(book.rating).toFixed(1)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Stock Status</span>
          <span class="meta-value">
            ${isOutOfStock 
              ? `<span style="color: var(--danger); font-weight:700;"><i class="fa-solid fa-xmark"></i> Out of Stock</span>` 
              : `<span style="color: var(--accent); font-weight:700;"><i class="fa-solid fa-check"></i> In Stock (${book.stock})</span>`
            }
          </span>
        </div>
      </div>
      <p class="details-desc">${book.description}</p>
      <div class="details-action">
        <span class="details-price">$${Number(book.price).toFixed(2)}</span>
        <button class="details-btn" data-id="${book.id}" ${isOutOfStock ? 'disabled' : ''}>
          <i class="fa-solid fa-basket-shopping"></i> Add to Cart
        </button>
      </div>
    </div>
  `;

  detailsModal.classList.add('open');
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetailsModal() {
  detailsModal.classList.remove('open');
  if (!cartDrawer.classList.contains('open') && !checkoutModal.classList.contains('open') && !adminAddBookModal.classList.contains('open')) {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Checkout Flow
function openCheckoutModal() {
  state.currentCheckoutStep = 1;
  state.receiptUploaded = false;
  receiptUploadText.textContent = 'Click to upload receipt image/PDF';
  receiptUploadBtn.classList.remove('has-file');
  bankReceiptInput.value = '';
  updateCheckoutStepUI();
  
  // Prefill details if user logged in
  if (state.currentUser) {
    document.getElementById('checkout-name').value = state.currentUser.username;
    document.getElementById('checkout-email').value = state.currentUser.email;
  }

  checkoutModal.classList.add('open');
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  checkoutModal.classList.remove('open');
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function checkoutPrevStep() {
  if (state.currentCheckoutStep > 1) {
    state.currentCheckoutStep--;
    updateCheckoutStepUI();
  }
}

function checkoutNextStep() {
  if (!validateCurrentStep()) return;

  if (state.currentCheckoutStep === 1) {
    state.currentCheckoutStep = 2;
    updateCheckoutStepUI();
  } else if (state.currentCheckoutStep === 2) {
    submitOrder();
  }
}

function validateCurrentStep() {
  if (state.currentCheckoutStep === 1) {
    const name = document.getElementById('checkout-name').value.trim();
    const email = document.getElementById('checkout-email').value.trim();
    const address = document.getElementById('checkout-address').value.trim();
    const phone = document.getElementById('checkout-phone').value.trim();

    if (!name || !email || !address || !phone) {
      showToast('Please fill in all delivery details.', 'error');
      return false;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      showToast('Please enter a valid email address.', 'error');
      return false;
    }
    return true;
  }

  if (state.currentCheckoutStep === 2) {
    if (state.activePaymentMethod === 'momo') {
      const momoNum = momoNumberInput.value.trim();
      if (!momoNum) {
        showToast('Please enter your Mobile Money number.', 'error');
        return false;
      }
      if (momoNum.length < 8) {
        showToast('Please enter a valid Mobile Money number.', 'error');
        return false;
      }
    } else {
      const depositor = bankDepositorInput.value.trim();
      const ref = bankRefInput.value.trim();
      if (!depositor || !ref) {
        showToast("Please enter depositor name and reference transaction number.", "error");
        return false;
      }
    }
    return true;
  }
  return true;
}

function setPaymentMethod(method) {
  state.activePaymentMethod = method;
  if (method === 'momo') {
    payMomoTab.classList.add('active');
    payBankTab.classList.remove('active');
    momoDetailsPanel.classList.add('active');
    bankDetailsPanel.classList.remove('active');
  } else {
    payBankTab.classList.add('active');
    payMomoTab.classList.remove('active');
    bankDetailsPanel.classList.add('active');
    momoDetailsPanel.classList.remove('active');
  }
}

function updateCheckoutStepUI() {
  stepContent1.classList.remove('active');
  stepContent2.classList.remove('active');
  stepContent3.classList.remove('active');
  stepHeader1.className = 'step';
  stepHeader2.className = 'step';
  stepHeader3.className = 'step';

  if (state.currentCheckoutStep === 1) {
    stepContent1.classList.add('active');
    stepHeader1.className = 'step active';
    closeCheckoutBtn.style.display = 'flex';
    prevStepBtn.style.visibility = 'hidden';
    nextStepBtn.innerHTML = `Continue to Payment <i class="fa-solid fa-chevron-right"></i>`;
  } else if (state.currentCheckoutStep === 2) {
    stepContent2.classList.add('active');
    stepHeader1.className = 'step completed';
    stepHeader2.className = 'step active';
    closeCheckoutBtn.style.display = 'flex';
    prevStepBtn.style.visibility = 'visible';
    nextStepBtn.innerHTML = `Complete Order <i class="fa-solid fa-check"></i>`;
  } else if (state.currentCheckoutStep === 3) {
    stepContent3.classList.add('active');
    stepHeader1.className = 'step completed';
    stepHeader2.className = 'step completed';
    stepHeader3.className = 'step active';
    closeCheckoutBtn.style.display = 'none';
    document.getElementById('checkout-actions').style.display = 'none';
  }
}

// Submits the Order and saves it in Supabase orders database, deducting stock
async function submitOrder() {
  nextStepBtn.disabled = true;
  nextStepBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

  const orderRef = '#NN-' + Math.floor(10000 + Math.random() * 90000);
  const name = document.getElementById('checkout-name').value.trim();
  const email = document.getElementById('checkout-email').value.trim();
  const address = document.getElementById('checkout-address').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const notes = document.getElementById('checkout-notes').value.trim() || '';

  const orderPayment = state.activePaymentMethod === 'momo' ? 'Mobile Money (MoMo)' : 'Bank Transfer';
  const paymentDetails = state.activePaymentMethod === 'momo' 
    ? { provider: document.getElementById('momo-provider').value, number: momoNumberInput.value.trim() }
    : { depositor: bankDepositorInput.value.trim(), ref: bankRefInput.value.trim() };

  // Calculate total amount
  let totalAmt = 0;
  const cartItems = [];

  state.cart.forEach(item => {
    const book = state.books.find(b => b.id === item.bookId);
    if (book) {
      totalAmt += book.price * item.quantity;
      cartItems.push({
        bookId: book.id,
        title: book.title,
        quantity: item.quantity,
        price: book.price
      });
    }
  });

  const grandTotalVal = totalAmt + 5.00;

  // 1. Insert order to Supabase
  const { error: orderError } = await supabaseClient
    .from('orders')
    .insert({
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      delivery_address: address,
      order_notes: notes,
      payment_method: orderPayment,
      payment_details: paymentDetails,
      total_amount: grandTotalVal,
      items: cartItems
    });

  if (orderError) {
    console.error("Order submit failed:", orderError);
    showToast("Error processing order in online database.", "error");
    nextStepBtn.disabled = false;
    nextStepBtn.innerHTML = `Complete Order <i class="fa-solid fa-check"></i>`;
    return;
  }

  // 2. Decrement stock levels in Supabase
  for (const item of state.cart) {
    const book = state.books.find(b => b.id === item.bookId);
    if (book) {
      const newStock = Math.max(0, book.stock - item.quantity);
      await supabaseClient
        .from('books')
        .update({ stock: newStock })
        .eq('id', book.id);
    }
  }

  // Populate Success UI
  document.getElementById('summary-ref').textContent = orderRef;
  document.getElementById('summary-payment').textContent = orderPayment;
  document.getElementById('summary-total').textContent = `$${grandTotalVal.toFixed(2)}`;
  document.getElementById('summary-address').textContent = address;

  // Switch View
  state.currentCheckoutStep = 3;
  nextStepBtn.disabled = false;
  updateCheckoutStepUI();

  // Clear cart
  state.cart = [];
  saveCart();
  updateCartUI();

  showToast('Order placed successfully!', 'success');

  const checkoutActions = document.getElementById('checkout-actions');
  checkoutActions.innerHTML = `
    <button type="button" id="finish-checkout-btn" class="modal-btn btn-primary" style="margin-left: auto;">
      Continue Shopping <i class="fa-solid fa-cart-shopping"></i>
    </button>
  `;
  checkoutActions.style.display = 'flex';
  
  document.getElementById('finish-checkout-btn').addEventListener('click', () => {
    closeCheckoutModal();
    checkoutActions.innerHTML = `
      <button type="button" id="prev-step-btn" class="modal-btn btn-secondary" style="visibility: hidden;">
        <i class="fa-solid fa-chevron-left"></i> Back
      </button>
      <button type="button" id="next-step-btn" class="modal-btn btn-primary">
        Continue to Payment <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;
    document.getElementById('prev-step-btn').addEventListener('click', checkoutPrevStep);
    document.getElementById('next-step-btn').addEventListener('click', checkoutNextStep);
    switchView('store');
  });
}

// ================= ADMIN ACTIONS =================

function renderAdminDashboard() {
  // Stats Calculations
  const totalBooks = state.books.length;
  const outOfStock = state.books.filter(b => b.stock <= 0).length;
  const totalVal = state.books.reduce((sum, b) => sum + (b.price * b.stock), 0);

  metricTotalBooks.textContent = totalBooks;
  metricOutOfStock.textContent = outOfStock;
  metricTotalValue.textContent = `$${totalVal.toFixed(2)}`;

  if (state.books.length === 0) {
    adminInventoryList.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
          <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; opacity: 0.5; margin-bottom: 0.5rem; display:block;"></i>
          No books in database. Click "Add New Book" to start.
        </td>
      </tr>
    `;
    return;
  }

  // Populate Table
  adminInventoryList.innerHTML = state.books.map(book => {
    let stockClass = 'stock-in';
    let stockLabel = 'In Stock';
    if (book.stock === 0) {
      stockClass = 'stock-out';
      stockLabel = 'Out of Stock';
    } else if (book.stock < 5) {
      stockClass = 'stock-low';
      stockLabel = 'Low Stock';
    }

    return `
      <tr>
        <td>
          <div class="admin-table-book">
            <div class="admin-table-cover" style="background: ${book.cover_gradient}">
              ${book.title}
            </div>
            <div>
              <div class="admin-table-title">${book.title}</div>
              <div class="admin-table-author">${book.author}</div>
            </div>
          </div>
        </td>
        <td><span class="user-badge" style="background-color: #f1f5f9; color: var(--text-main);">${book.category}</span></td>
        <td><strong style="font-weight:750;">$${Number(book.price).toFixed(2)}</strong></td>
        <td>
          <div style="display:flex; flex-direction:column; gap: 0.4rem;">
            <div>
              <span class="stock-badge ${stockClass}">${stockLabel} (${book.stock})</span>
            </div>
            <div class="stock-adjuster">
              <button class="adjust-btn" data-id="${book.id}" data-delta="-1" aria-label="Decrease stock">-</button>
              <input type="number" class="stock-input" data-id="${book.id}" value="${book.stock}" min="0">
              <button class="adjust-btn" data-id="${book.id}" data-delta="1" aria-label="Increase stock">+</button>
            </div>
          </div>
        </td>
        <td>
          <button class="table-btn-delete" data-id="${book.id}" title="Remove Book">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// In table stock adjustments
async function adjustStockInline(bookId, delta) {
  const book = state.books.find(b => b.id === bookId);
  if (book) {
    const newStock = Math.max(0, book.stock + delta);
    
    // Save to database
    const { error } = await supabaseClient
      .from('books')
      .update({ stock: newStock })
      .eq('id', bookId);

    if (error) {
      showToast(error.message, 'error');
    } else {
      book.stock = newStock;
      renderAdminDashboard();
    }
  }
}

async function setStockInline(bookId, newVal) {
  const book = state.books.find(b => b.id === bookId);
  if (book) {
    const { error } = await supabaseClient
      .from('books')
      .update({ stock: newVal })
      .eq('id', bookId);

    if (error) {
      showToast(error.message, 'error');
    } else {
      book.stock = newVal;
      renderAdminDashboard();
    }
  }
}

// Delete book
async function deleteBook(bookId) {
  const book = state.books.find(b => b.id === bookId);
  if (!book) return;

  if (confirm(`Are you sure you want to remove "${book.title}" from the catalog?`)) {
    const { error } = await supabaseClient
      .from('books')
      .delete()
      .eq('id', bookId);

    if (error) {
      showToast(error.message, 'error');
    } else {
      state.books = state.books.filter(b => b.id !== bookId);
      state.cart = state.cart.filter(item => item.bookId !== bookId);
      saveCart();
      renderAdminDashboard();
      showToast(`"${book.title}" has been deleted.`, 'info');
    }
  }
}

// Add Book Modal Operations
function openAddBookModal() {
  adminAddBookForm.reset();
  document.querySelectorAll('.color-preset-option').forEach(el => el.classList.remove('active'));
  const firstPreset = coverPresetsList.querySelector('.color-preset-option');
  if (firstPreset) {
    firstPreset.classList.add('active');
    addBookGradientVal.value = firstPreset.dataset.gradient;
  }

  adminAddBookModal.classList.add('open');
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAddBookModal() {
  adminAddBookModal.classList.remove('open');
  if (!cartDrawer.classList.contains('open') && !detailsModal.classList.contains('open') && !checkoutModal.classList.contains('open')) {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function renderCoverPresets() {
  coverPresetsList.innerHTML = GRADIENT_PRESETS.map((p, idx) => {
    return `
      <div class="color-preset-option" 
           data-gradient="${p.value}" 
           title="${p.label}" 
           style="background: ${p.value}">
      </div>
    `;
  }).join('');
}

async function handleAddBook(e) {
  e.preventDefault();
  
  const title = document.getElementById('add-book-title').value.trim();
  const author = document.getElementById('add-book-author').value.trim();
  const category = document.getElementById('add-book-category').value;
  const published_year = parseInt(document.getElementById('add-book-published').value);
  const price = parseFloat(document.getElementById('add-book-price').value);
  const stock = parseInt(document.getElementById('add-book-stock').value);
  const description = document.getElementById('add-book-desc').value.trim();
  const cover_gradient = addBookGradientVal.value || GRADIENT_PRESETS[0].value;

  if (!title || !author || !category || isNaN(price) || isNaN(stock) || !description) {
    showToast('Please fill out all fields correctly.', 'error');
    return;
  }

  const { data, error } = await supabaseClient
    .from('books')
    .insert({
      title,
      author,
      price,
      rating: 4.5,
      category,
      published_year,
      cover_gradient,
      description,
      stock
    })
    .select();

  if (error) {
    showToast(error.message, 'error');
  } else {
    if (data && data[0]) {
      state.books.push(data[0]);
    }
    closeAddBookModal();
    renderAdminDashboard();
    showToast(`"${title}" successfully added!`, 'success');
  }
}

// Toast System
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `notification`;
  
  let icon = '<i class="fa-solid fa-circle-info"></i>';
  if (type === 'success') {
    icon = '<i class="fa-solid fa-circle-check" style="color: var(--accent);"></i>';
  } else if (type === 'error') {
    icon = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i>';
  }

  toast.innerHTML = `${icon} <span>${message}</span>`;
  notificationContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInUp 0.3s reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}
