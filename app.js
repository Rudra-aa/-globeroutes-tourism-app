/**
 * GlobeRoutes Main Application Engine
 * Manages SPA state routing, mock authorization, subscription locks,
 * Leaflet maps integration, autocomplete searches, procedural generations, and gamified achievements.
 */

// --- GLOBAL APPLICATION STATE ---
const BACKEND_URL = 'http://localhost:5001';
let currentUser = null;
let map = null;
let activeMarkers = [];
let activeSingleMarker = null;
let activeRouteLine = null;
let routingControl = null;
let activeCountryId = null;
let activeCityId = null;
let activePoiId = null;
let currentCountry = null;
let currentCity = null;
let activeCategory = 'all';

// Modes for India
let currentIndiaViewMode = 'city'; // 'city', 'state', 'top_hits'
let travelHopCount = 0;

// Auto-Plot Map Feature Toggle (persisted in localStorage)
let autoPlotEnabled = localStorage.getItem('globeroutes_autoplot') !== 'false';

// Filter States
let activeFilters = {
  tiers: { red: true, orange: true, yellow: true, green: true, blue: true },
  category: 'all'
};

// --- TIER COLOR REPRESENTATION LOOKUP ---
function getTierRepresentation(tier) {
  const t = (tier || '').toLowerCase();
  switch (t) {
    case 'red': return 'World Icon';
    case 'orange': return 'National Landmark';
    case 'yellow': return 'Regional Star';
    case 'green': return 'Locally Famous';
    case 'blue': return 'Hidden Gem';
    default: return tier;
  }
}

// --- DYNAMICALLY RESOLVE TEMPLES AND METADATA ON INITIALIZATION ---
function initializeTemplesMetadata() {
  if (!window.SEED_ATTRACTIONS) return;

  const charDhamKeywords = ["badrinath", "kedarnath", "gangotri", "yamunotri", "jagannath", "dwarka", "rameswaram", "ramanthaswamy"];
  const jyotirlingaKeywords = ["kashi vishwanath", "somnath", "kedarnath", "trimbakeshwar", "mahakaleshwar", "ramanthaswamy", "rameswaram", "grishneshwar", "bhimashankar", "mallikarjuna", "omkareshwar", "nageshwar", "vaidyanath"];

  const stateOverrides = {
    haridwar: "Uttarakhand",
    rishikesh: "Uttarakhand",
    kedarnath: "Uttarakhand",
    badrinath: "Uttarakhand",
    gangotri: "Uttarakhand",
    yamunotri: "Uttarakhand",
    mathura: "Uttar Pradesh",
    vrindavan: "Uttar Pradesh",
    ayodhya: "Uttar Pradesh",
    ujjain: "Madhya Pradesh",
    shirdi: "Maharashtra",
    somnath: "Gujarat",
    dwarka: "Gujarat",
    nashik: "Maharashtra",
    tirupati: "Andhra Pradesh",
    puri: "Odisha",
    rameswaram: "Tamil Nadu",
    madurai: "Tamil Nadu",
    kanchipuram: "Tamil Nadu",
    pushkar: "Rajasthan",
    katra: "Jammu and Kashmir"
  };

  window.SEED_ATTRACTIONS.forEach(a => {
    const nameLower = a.name.toLowerCase();
    const idLower = a.id.toLowerCase();
    const isTempleKeyword = nameLower.includes("temple") || 
                            nameLower.includes("mandir") || 
                            nameLower.includes("monastery") || 
                            nameLower.includes("gurdwara") || 
                            nameLower.includes("shrine") || 
                            nameLower.includes("nenbutsu-ji") ||
                            idLower.includes("temple") ||
                            idLower.includes("monastery") ||
                            idLower.includes("rumtek") ||
                            idLower.includes("goldentemple");

    const isSpecificTemple = nameLower.includes("vishwanath") || 
                             nameLower.includes("somnath") || 
                             nameLower.includes("kedarnath") || 
                             nameLower.includes("badrinath") || 
                             nameLower.includes("gangotri") || 
                             nameLower.includes("yamunotri") || 
                             nameLower.includes("balaji") || 
                             nameLower.includes("meenakshi") ||
                             nameLower.includes("tungnath") ||
                             nameLower.includes("matrimandir");

    // Dynamic state lookup for any attraction having cityId
    if (a.cityId) {
      if (window.SEED_CITIES && window.SEED_CITIES[a.cityId]) {
        const city = window.SEED_CITIES[a.cityId];
        if (!city.state && stateOverrides[a.cityId]) {
          city.state = stateOverrides[a.cityId];
        }
        if (!a.state) {
          a.state = city.state;
        }
      }
      if (!a.state && stateOverrides[a.cityId]) {
        a.state = stateOverrides[a.cityId];
      }
    }

    if (a.countryId === 'india' && (isTempleKeyword || isSpecificTemple)) {
      a.category = 'temple';
      
      // Assign Char Dham
      const isCharDham = charDhamKeywords.some(kw => nameLower.includes(kw) || idLower.includes(kw));
      if (isCharDham) {
        a.isCharDham = true;
      }
      
      // Assign Jyotirlinga
      const isJyotirlinga = jyotirlingaKeywords.some(kw => nameLower.includes(kw) || idLower.includes(kw));
      if (isJyotirlinga) {
        a.isJyotirlinga = true;
      }
    }
  });
}

// --- INITIALIZE ON PAGE LOAD ---
window.addEventListener('DOMContentLoaded', () => {
  // Initialize temples categories and metadata dynamically
  initializeTemplesMetadata();

  // Initialize Lucide Icons
  lucide.createIcons();
  
  // Ensure default users are initialized in local storage fallback
  ensureDefaultUsers();

  // Load session or check Auth
  checkAuthSession();
  
  // Trigger pricing overlay if requested by URL query
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('triggerUpgrade') === 'true') {
    setTimeout(() => { openPricingOverlay(); }, 800);
  }
  
  // Set up Map
  initMap();
  
  // Render Flagship Countries on Home panel
  renderFlagshipCountries();
  
  // Set up random daily spotlight POI
  setDailySpotlight();
  
  // Sync the Auto-Plot toggle pill to saved preference
  syncAutoPlotUI();
  
  // Hook up global events
  document.getElementById('globalSearchInput').addEventListener('focus', () => {
    handleGlobalSearch(document.getElementById('globalSearchInput').value);
  });
  
  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      document.getElementById('searchAutocomplete').style.display = 'none';
    }
  });
});

/// ================= AUTHENTICATION SERVICES =================


let loginAttempts = 0;
const maxAttempts = 5;
let lockoutUntil = 0;
let captchaState = {};

const AUTH_SALT = "globeroutes_secure_salt_2026_!!";
function secureHash(str) {
  let salted = str + AUTH_SALT;
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    hash = (hash << 5) - hash + salted.charCodeAt(i);
    hash |= 0;
  }
  return 'sha256_sim_' + Math.abs(hash).toString(16);
}

function ensureDefaultUsers() {
  let db = localStorage.getItem('globeroutes_users_db');
  if (!db) {
    const defaults = [
      { email: 'rudratheadmin@123', pass: secureHash('password123'), name: 'Rudra The Admin', isAdmin: true },
      { email: 'rudratheadmin123', pass: secureHash('password123'), name: 'Rudra The Admin', isAdmin: true },
      { email: 'traveler@world.com', pass: secureHash('password123'), name: 'Traveler Pro', isAdmin: false }
    ];
    localStorage.setItem('globeroutes_users_db', JSON.stringify(defaults));
  }
}

function toggleVis(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  const showing = inp.type === 'text';
  inp.type = showing ? 'password' : 'text';
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = showing ? 'ti ti-eye' : 'ti ti-eye-off';
  }
}

function toggleCaptcha(id) {
  const row = document.getElementById(id);
  if (!row) return;
  const box = row.querySelector('.captcha-box i');
  const checked = row.classList.toggle('checked');
  if (box) box.style.display = checked ? 'block' : 'none';
  captchaState[id] = checked;
}

function resetCaptcha(id) {
  captchaState[id] = false;
  const row = document.getElementById(id);
  if (row) {
    row.classList.remove('checked');
    const box = row.querySelector('.captcha-box i');
    if (box) box.style.display = 'none';
  }
}

function checkStrength(val) {
  const bar = document.getElementById('strengthBar');
  const lbl = document.getElementById('strengthLabel');
  if (!bar || !lbl) return;
  let s = 0;
  if (val.length >= 8) s++;
  if (/[A-Z]/.test(val) && /[a-z]/.test(val)) s++;
  if (/\d/.test(val)) s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  bar.className = 'strength-bar' + (s ? ' s' + s : '');
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  lbl.textContent = val.length ? labels[s] || 'Weak' : '';
}

function showToast(msg, type) {
  const t = document.getElementById('toastMsg');
  if (!t) {
    showNotification(msg, type === 'err' ? 'error' : 'success');
    return;
  }
  t.textContent = msg;
  t.style.background = type === 'err' ? 'rgba(162,45,45,0.15)' : 'rgba(29,158,117,0.15)';
  t.style.borderColor = type === 'err' ? 'rgba(162,45,45,0.45)' : 'rgba(29,158,117,0.4)';
  t.style.color = type === 'err' ? '#f09595' : '#5dcaa5';
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); }, 3000);
}

function sanitize(s) {
  return s.replace(/[<>"'&]/g, '');
}

async function checkAuthSession() {
  let session = localStorage.getItem('globeroutes_user');
  if (!session) {
    currentUser = null;
    document.getElementById('authOverlay').style.display = 'flex';
    setTimeout(() => { if (window.initializeGoogleAuth) window.initializeGoogleAuth(); }, 500);
  } else {
    currentUser = JSON.parse(session);
    document.getElementById('authOverlay').style.display = 'none';
    updateHeaderUserBadge();
    
    // Attempt syncing data with backend MongoDB if online
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          visitedPois: currentUser.visitedPois || [],
          travelHops: currentUser.travelHops || 0
        })
      });
      if (response.ok) {
        const data = await response.json();
        currentUser = data.user;
        saveUserSession();
        updateHeaderUserBadge();
      }
    } catch (e) {
      console.log("GlobeRoutes backend offline. Using local session fallback.");
    }
    
    syncUserJournalData();
  }
}

function showLandingWebsite() {
  window.location.href = 'index.html';
}

function switchAuthMode(mode) {
  const isLogin = mode === 'login';
  const tabLogin = document.getElementById('tabLogin');
  const tabReg = document.getElementById('tabReg');
  const panelLogin = document.getElementById('panelLogin');
  const panelReg = document.getElementById('panelReg');
  const heading = document.getElementById('modalHeading');
  const sub = document.getElementById('modalSub');
  
  if (tabLogin) tabLogin.className = 'tab' + (isLogin ? ' active' : '');
  if (tabReg) tabReg.className = 'tab' + (!isLogin ? ' active' : '');
  if (panelLogin) panelLogin.className = 'form-panel' + (isLogin ? ' active' : '');
  if (panelReg) panelReg.className = 'form-panel' + (!isLogin ? ' active' : '');
  if (heading) heading.textContent = isLogin ? 'Welcome back' : 'Create your account';
  if (sub) sub.textContent = isLogin ? 'Sign in to continue your exploration journey' : 'Join thousands of explorers worldwide';
}

async function handleLogin() {
  const now = Date.now();
  if (now < lockoutUntil) {
    const secs = Math.ceil((lockoutUntil - now) / 1000);
    const warn = document.getElementById('attemptsWarn');
    if (warn) warn.textContent = 'Too many attempts. Try again in ' + secs + 's.';
    return;
  }

  if (!captchaState['captchaLogin']) {
    showToast('Please confirm you\'re not a robot.', 'err');
    return;
  }

  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPass');
  if (!emailInput || !passInput) return;

  const email = sanitize(emailInput.value.trim());
  const pass = passInput.value;

  if (!email || !pass) {
    showToast('Please fill in all fields.', 'err');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email !== 'rudratheadmin@123' && email !== 'rudratheadmin123') {
    showToast('Enter a valid email address.', 'err');
    return;
  }

  if (pass.length < 6) {
    showToast('Password too short.', 'err');
    return;
  }

  // Check login attempts
  loginAttempts++;
  const warn = document.getElementById('attemptsWarn');
  if (warn) {
    warn.textContent = loginAttempts >= 3 ? (maxAttempts - loginAttempts) + ' attempts remaining.' : '';
  }

  if (loginAttempts >= maxAttempts) {
    lockoutUntil = Date.now() + 30000;
    loginAttempts = 0;
    if (warn) warn.textContent = 'Account temporarily locked. Try again in 30s.';
    const btn = document.getElementById('loginBtn');
    if (btn) btn.disabled = true;
    setTimeout(() => {
      if (btn) btn.disabled = false;
      if (warn) warn.textContent = '';
    }, 30000);
    return;
  }

  showToast('Signing you in…', 'ok');

  // Attempt backend API login first
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      saveUserSession();
      loginAttempts = 0;
      if (warn) warn.textContent = '';
      resetCaptcha('captchaLogin');

      setTimeout(() => {
        document.getElementById('authOverlay').style.display = 'none';
        updateHeaderUserBadge();
        syncUserJournalData();
        
        if (currentUser.isPremium) {
          showNotification("Admin Access Granted! All premium features unlocked.", "success");
        } else {
          showNotification(`Welcome back, ${currentUser.name}!`);
        }
      }, 1000);
      return;
    } else {
      const data = await response.json();
      showToast(data.error || 'Invalid credentials.', 'err');
      return;
    }
  } catch (err) {
    console.log("Backend offline. Using secure local fallback database.");
  }

  // Secure Local Database Fallback!
  let db = JSON.parse(localStorage.getItem('globeroutes_users_db') || '[]');
  const user = db.find(u => u.email.toLowerCase() === email.toLowerCase());
  const hashedInput = secureHash(pass);

  if (!user || user.pass !== hashedInput) {
    showToast('Invalid credentials entered. Please try again.', 'err');
    return;
  }

  const name = user.name || email.split('@')[0];
  const isAdmin = email.toLowerCase() === 'rudratheadmin123' || 
                  email.toLowerCase() === 'rudratheadmin@123' ||
                  email.toLowerCase().startsWith('rudratheadmin123@');

  currentUser = {
    name: isAdmin ? "Rudra The Admin" : (name.charAt(0).toUpperCase() + name.slice(1)),
    email: email,
    isPremium: isAdmin || user.isAdmin,
    membershipTier: (isAdmin || user.isAdmin) ? "Pro Explorer (Admin)" : "Free Explorer",
    visitedPois: [],
    travelHops: 0
  };

  saveUserSession();
  loginAttempts = 0;
  if (warn) warn.textContent = '';
  resetCaptcha('captchaLogin');

  setTimeout(() => {
    document.getElementById('authOverlay').style.display = 'none';
    updateHeaderUserBadge();
    syncUserJournalData();
    if (currentUser.isPremium) {
      showNotification("Admin Access Granted! All premium features unlocked.", "success");
    } else {
      showNotification(`Welcome back, ${currentUser.name}!`);
    }
  }, 1000);
}

async function handleRegister() {
  if (!captchaState['captchaReg']) {
    showToast('Please confirm you\'re not a robot.', 'err');
    return;
  }

  const nameInput = document.getElementById('regName');
  const emailInput = document.getElementById('regEmail');
  const passInput = document.getElementById('regPass');
  const confirmInput = document.getElementById('regConfirm');
  
  if (!nameInput || !emailInput || !passInput || !confirmInput) return;

  const name = sanitize(nameInput.value.trim());
  const email = sanitize(emailInput.value.trim());
  const pass = passInput.value;
  const confirm = confirmInput.value;

  if (!name || !email || !pass || !confirm) {
    showToast('Please fill in all fields.', 'err');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Enter a valid email address.', 'err');
    return;
  }

  if (pass.length < 8) {
    showToast('Password must be at least 8 characters.', 'err');
    return;
  }

  if (pass !== confirm) {
    showToast('Passwords do not match.', 'err');
    return;
  }

  let strength = 0;
  if (/[A-Z]/.test(pass)) strength++;
  if (/\d/.test(pass)) strength++;
  if (/[^A-Za-z0-9]/.test(pass)) strength++;

  if (strength < 1) {
    showToast('Use uppercase letters, numbers, or symbols.', 'err');
    return;
  }

  showToast('Creating account…', 'ok');

  // Attempt backend API registration
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      saveUserSession();
      resetCaptcha('captchaReg');

      setTimeout(() => {
        document.getElementById('authOverlay').style.display = 'none';
        updateHeaderUserBadge();
        syncUserJournalData();
        showNotification(`Welcome to GlobeRoutes, ${currentUser.name}!`);
      }, 1000);
      return;
    } else {
      const data = await response.json();
      showToast(data.error || 'Registration failed.', 'err');
      return;
    }
  } catch (err) {
    console.log("Backend offline. Using secure local fallback database.");
  }

  // Secure Local Fallback registration!
  let db = JSON.parse(localStorage.getItem('globeroutes_users_db') || '[]');
  if (db.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    showToast('Email is already registered.', 'err');
    return;
  }

  const isAdmin = email.toLowerCase() === 'rudratheadmin123' || 
                  email.toLowerCase() === 'rudratheadmin@123' ||
                  email.toLowerCase().startsWith('rudratheadmin123@');

  const newUser = {
    email: email.toLowerCase(),
    pass: secureHash(pass),
    name: isAdmin ? "Rudra The Admin" : name,
    isAdmin: isAdmin
  };

  db.push(newUser);
  localStorage.setItem('globeroutes_users_db', JSON.stringify(db));

  currentUser = {
    name: newUser.name,
    email: email,
    isPremium: isAdmin,
    membershipTier: isAdmin ? "Pro Explorer (Admin)" : "Free Explorer",
    visitedPois: [],
    travelHops: 0
  };

  saveUserSession();
  resetCaptcha('captchaReg');

  setTimeout(() => {
    document.getElementById('authOverlay').style.display = 'none';
    updateHeaderUserBadge();
    syncUserJournalData();
    showNotification(`Welcome to GlobeRoutes, ${currentUser.name}!`);
  }, 1000);
}

async function handleGoogleAuthCallback(response) {
  showToast('Authenticating via Google…', 'ok');
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: response.credential })
    });

    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      saveUserSession();

      setTimeout(() => {
        document.getElementById('authOverlay').style.display = 'none';
        updateHeaderUserBadge();
        syncUserJournalData();
        if (currentUser.isPremium) {
          showNotification("Admin Access Granted via Google! All premium features unlocked.", "success");
        } else {
          showNotification(`Welcome to GlobeRoutes, ${currentUser.name}!`);
        }
      }, 1000);
    } else {
      const data = await res.json();
      showToast(data.error || 'Google login failed.', 'err');
    }
  } catch (err) {
    console.log("Backend offline. Google authentication is unavailable offline.");
    showToast("Google login is unavailable offline. Please use standard email/password.", "err");
  }
}

window.initializeGoogleAuth = function() {
  if (typeof google === 'undefined') return;
  try {
    google.accounts.id.initialize({
      client_id: "1068565154388-75kh9rmsk8c8a14qfg1plvgr59gbfn3a.apps.googleusercontent.com",
      callback: handleGoogleAuthCallback
    });
    const wraps = document.querySelectorAll('.google-signin-btn-wrap');
    wraps.forEach(wrap => {
      google.accounts.id.renderButton(wrap, { theme: "filled_blue", size: "large", shape: "pill", width: 348 });
    });
  } catch (e) {
    console.error("GIS Google Initialization error: ", e);
  }
};

async function payWithRazorpay() {
  showNotification("Razorpay payment gateway is coming soon! Please use the UPI QR Code for instant activation.", "info");
  switchPaymentMethod('upi');
}

// Logout functionality removed as requested

// Bind utilities to window
window.toggleVis = toggleVis;
window.toggleCaptcha = toggleCaptcha;
window.checkStrength = checkStrength;
window.switchAuthMode = switchAuthMode;
window.payWithRazorpay = payWithRazorpay;

function saveUserSession() {
  if (currentUser) {
    localStorage.setItem('globeroutes_user', JSON.stringify(currentUser));
  }
}

function updateHeaderUserBadge() {
  if (!currentUser) return;
  document.getElementById('userBadgeAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('userBadgeName').textContent = currentUser.name;
  document.getElementById('userBadgeTier').textContent = currentUser.membershipTier;
  
  const upgradeBtn = document.getElementById('upgradeHeaderBtn');
  if (currentUser.isPremium) {
    document.getElementById('userBadgeTier').style.color = '#ffd700';
    if (upgradeBtn) upgradeBtn.style.display = 'none';
  } else {
    document.getElementById('userBadgeTier').style.color = 'var(--text-secondary)';
    if (upgradeBtn) upgradeBtn.style.display = 'inline-flex';
  }
}

// ================= PRICING & SUBSCRIPTION SYSTEM =================

function openPricingOverlay() {
  document.getElementById('pricingOverlay').style.display = 'flex';
  document.getElementById('pricingTierScreen').style.display = 'flex';
  document.getElementById('checkoutScreen').style.display = 'none';
}

function closePricingOverlay() {
  document.getElementById('pricingOverlay').style.display = 'none';
}

let selectedPlan = 'pro';

function selectPricingPlan(plan) {
  if (plan === 'free') {
    closePricingOverlay();
    return;
  }
  selectedPlan = plan;
  
  const totalDueEl = document.getElementById('checkoutTotalCost');
  const planLabelEl = document.getElementById('checkoutPlanLabel');
  const planCostEl = document.getElementById('checkoutPlanCost');
  const orderTitleEl = document.getElementById('checkoutOrderTitle');
  
  const upiSubmitBtn = document.getElementById('upiSubmitBtn');
  
  const costStr = plan === 'standard' ? "₹199" : "₹599";
  const nameStr = plan === 'standard' ? "Standard Explorer (Monthly)" : "Pro Explorer (Monthly)";
  const titleStr = plan === 'standard' ? "Order Summary (Standard Plan)" : "Order Summary (Pro Plan)";
  
  if (totalDueEl) totalDueEl.textContent = costStr;
  if (planLabelEl) planLabelEl.textContent = nameStr;
  if (planCostEl) planCostEl.textContent = costStr;
  if (orderTitleEl) orderTitleEl.textContent = titleStr;
  
  if (upiSubmitBtn) upiSubmitBtn.textContent = `Verify & Pay ${costStr}`;
  
  // Update the QR code image dynamically with the correct price, custom UPI, and plan context
  const upiQrImg = document.getElementById('upiQrCodeImg');
  const upiQrLoader = document.getElementById('upiQrCodeLoader');
  if (upiQrImg) {
    upiQrImg.style.opacity = '0';
    if (upiQrLoader) upiQrLoader.style.display = 'flex';
    const amountVal = plan === 'standard' ? 199 : 599;
    const planName = plan === 'standard' ? 'Standard' : 'Pro';
    const upiUri = `upi://pay?pa=8717815602@ibl&pn=Rudra Pratap Singh Parmar&am=${amountVal}&cu=INR&tn=GlobeRoutes ${planName} Plan`;
    upiQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  }
  
  // Reset payment method tabs back to UPI
  switchPaymentMethod('upi');
  
  // Switch to checkout screen
  document.getElementById('pricingTierScreen').style.display = 'none';
  document.getElementById('checkoutScreen').style.display = 'grid';
}

function switchPaymentMethod(method) {
  const upiVis = document.getElementById('upiVisualizer');
  const razorpayVis = document.getElementById('razorpayVisualizer');
  const upiForm = document.getElementById('upiPaymentForm');
  const razorpayForm = document.getElementById('razorpayPaymentForm');
  
  const tabUpi = document.getElementById('tabPayUpi');
  const tabRazorpay = document.getElementById('tabPayRazorpay');
  
  if (method === 'upi') {
    if (upiVis) upiVis.style.display = 'block';
    if (razorpayVis) razorpayVis.style.display = 'none';
    if (upiForm) upiForm.style.display = 'flex';
    if (razorpayForm) razorpayForm.style.display = 'none';
    
    if (tabUpi) {
      tabUpi.style.background = 'rgba(59,127,255,0.2)';
      tabUpi.style.color = '#6dabff';
      tabUpi.style.fontWeight = '700';
    }
    if (tabRazorpay) {
      tabRazorpay.style.background = 'transparent';
      tabRazorpay.style.color = 'var(--text-secondary)';
      tabRazorpay.style.fontWeight = '600';
    }
  } else if (method === 'razorpay') {
    if (upiVis) upiVis.style.display = 'none';
    if (razorpayVis) razorpayVis.style.display = 'block';
    if (upiForm) upiForm.style.display = 'none';
    if (razorpayForm) razorpayForm.style.display = 'flex';
    
    if (tabUpi) {
      tabUpi.style.background = 'transparent';
      tabUpi.style.color = 'var(--text-secondary)';
      tabUpi.style.fontWeight = '600';
    }
    if (tabRazorpay) {
      tabRazorpay.style.background = 'rgba(59,127,255,0.2)';
      tabRazorpay.style.color = '#6dabff';
      tabRazorpay.style.fontWeight = '700';
    }
  }
}
window.switchPaymentMethod = switchPaymentMethod;

function cancelCheckout() {
  document.getElementById('pricingTierScreen').style.display = 'flex';
  document.getElementById('checkoutScreen').style.display = 'none';
}


function processPremiumPayment() {
  if (!currentUser) return;
  
  // Trigger cool success animation
  showNotification("Processing payment securely...", "info");
  
  setTimeout(() => {
    if (selectedPlan === 'standard') {
      currentUser.isPremium = false;
      currentUser.membershipTier = "Standard Explorer";
      showNotification("Standard Explorer Unlocked! Access all temples and Tiers 1-3.", "success");
    } else {
      currentUser.isPremium = true;
      currentUser.membershipTier = "Pro Explorer";
      showNotification("Pro Explorer Unlocked! Welcome to global discovery.", "success");
    }
    
    saveUserSession();
    updateHeaderUserBadge();
    syncUserJournalData();
    
    // Close payment gates and pricing
    closePricingOverlay();
    
    // Remove locks on current views
    if (activeCountryId) {
      navigateCountry(activeCountryId);
    }
    
    // Refresh city view if active to unlock standard/pro gems
    if (activeCityId) {
      navigateCity(activeCityId);
    }
  }, 2500);
}

// ================= TEMPLE NAVIGATION & FILTERING =================

let currentTempleFilter = 'all'; // 'all', 'chardham', 'jyotirlinga'

function navigateTemples(filter) {
  currentTempleFilter = filter || 'all';
  // Switch to temple panel
  const panels = document.querySelectorAll('.panel');
  panels.forEach(p => p.classList.remove('active'));
  const templePanel = document.getElementById('panelTemples');
  if (templePanel) templePanel.classList.add('active');
  renderTemplesList(filter);
  switchTempleTab(filter);
}

function switchTempleTab(tab) {
  currentTempleFilter = tab;
  const tabIds = { all: 'tabAll', chardham: 'tabCharDham', jyotirlinga: 'tabJyotirlinga' };
  Object.keys(tabIds).forEach(key => {
    const el = document.getElementById(tabIds[key]);
    if (!el) return;
    if (key === tab) {
      el.style.background = 'rgba(255,140,0,0.3)';
      el.style.color = '#ffa940';
      el.style.fontWeight = '700';
    } else {
      el.style.background = 'transparent';
      el.style.color = 'var(--text-secondary)';
      el.style.fontWeight = '600';
    }
  });
  renderTemplesList(tab);
  plotCurrentTempleFilter();
}

function plotCurrentTempleFilter() {
  const temples = getFilteredTemples(currentTempleFilter);
  if (!temples.length) {
    showNotification('No temples found for this filter.', 'warning');
    return;
  }
  activeMarkers.forEach(m => map.removeLayer(m));
  activeMarkers = [];
  
  // ── FREE TEMPLE ACCESS (temples, Char Dham & Jyotirlingas are free for all plans) ──
  // To re-enable paywall, uncomment the lines marked [PAYWALL] below
  // const tierName = currentUser ? currentUser.membershipTier : "Free Explorer"; // [PAYWALL]
  // const isFree = !tierName.includes("Standard") && !tierName.includes("Pro") && !tierName.includes("Admin"); // [PAYWALL]
  
  let plottedCount = 0;
  temples.forEach(t => {
    if (!t.lat || !t.lng) return;
    plottedCount++;
    // const isLocked = isFree && (plottedCount > 3); // [PAYWALL] — commented out for free access
    const isLocked = false; // All temples freely accessible
    
    let color;
    if (isLocked) {
      color = '#3b82f6'; // locked pin color
    } else {
      color = t.isCharDham ? '#FFD700' : t.isJyotirlinga ? '#FF8C00' : '#ffa940';
    }
    
    const marker = L.circleMarker([t.lat, t.lng], {
      radius: 8, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.9
    }).addTo(map);
    
    if (isLocked) {
      marker.bindPopup(`<b>${t.name} (🔒 Locked)</b><br>Upgrade to Standard or Pro to unlock all pilgrimage sights!`);
      marker.on('click', () => {
        openPricingOverlay();
      });
    } else {
      marker.bindPopup(`<b>${t.name}</b><br>${t.state || ''}`);
    }
    activeMarkers.push(marker);
  });
  if (temples.length > 0) map.setView([20.5937, 78.9629], 5);
  showNotification(`📍 Plotted temples on map!`, 'success');
}

function getFilteredTemples(filter) {
  let temples = window.SEED_ATTRACTIONS.filter(a =>
    a.countryId === 'india' && a.category === 'temple'
  );
  if (filter === 'chardham') {
    temples = temples.filter(t => t.isCharDham);
  } else if (filter === 'jyotirlinga') {
    temples = temples.filter(t => t.isJyotirlinga);
  }
  return temples;
}

function renderTemplesList(filter) {
  const container = document.getElementById('templeListContainer');
  if (!container) return;
  const temples = getFilteredTemples(filter);
  container.innerHTML = '';
  if (!temples.length) {
    container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">No temples found.</p>';
    return;
  }
  
  // ── FREE TEMPLE ACCESS (temples, Char Dham & Jyotirlingas are free for all plans) ──
  // To re-enable paywall, uncomment the lines marked [PAYWALL] below
  // const tierName = currentUser ? currentUser.membershipTier : "Free Explorer"; // [PAYWALL]
  // const isFree = !tierName.includes("Standard") && !tierName.includes("Pro") && !tierName.includes("Admin"); // [PAYWALL]
  
  const byState = {};
  temples.forEach(t => {
    const state = t.state || 'Other';
    if (!byState[state]) byState[state] = [];
    byState[state].push(t);
  });
  
  let renderedCount = 0;
  Object.keys(byState).sort().forEach(state => {
    const stateHeader = document.createElement('div');
    stateHeader.style.cssText = 'padding:8px 12px;margin:12px 0 6px;background:rgba(255,140,0,0.1);border-left:3px solid #ffa940;border-radius:4px;font-weight:700;color:#ffa940;font-size:0.82rem;text-transform:uppercase;letter-spacing:1px;';
    stateHeader.textContent = state;
    container.appendChild(stateHeader);
    
    byState[state].sort((a, b) => b.fameScore - a.fameScore).forEach(temple => {
      renderedCount++;
      // const isLocked = isFree && (renderedCount > 3); // [PAYWALL] — commented out for free access
      const isLocked = false; // All temples freely accessible
      
      const badges = [];
      if (temple.isCharDham) badges.push('<span style="font-size:0.6rem;background:rgba(255,215,0,0.2);color:#FFD700;border:1px solid rgba(255,215,0,0.4);padding:2px 6px;border-radius:10px;">🕍 Char Dham</span>');
      if (temple.isJyotirlinga) badges.push('<span style="font-size:0.6rem;background:rgba(255,140,0,0.2);color:#FF8C00;border:1px solid rgba(255,140,0,0.4);padding:2px 6px;border-radius:10px;">🔱 Jyotirlinga</span>');
      if (temple.isUnesco) badges.push('<span style="font-size:0.6rem;background:rgba(30,144,255,0.2);color:#1E90FF;border:1px solid rgba(30,144,255,0.4);padding:2px 6px;border-radius:10px;">🏛️ UNESCO</span>');
      
      if (isLocked) {
        badges.push('<span style="font-size:0.6rem;background:rgba(255,215,0,0.15);color:#ffd700;border:1px solid rgba(255,215,0,0.3);padding:2px 6px;border-radius:10px;font-weight:700;"><i data-lucide="lock" style="width:8px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> PRO/STANDARD locked</span>');
      }
      
      const scoreColor = temple.fameScore >= 90 ? '#FF0000' : temple.fameScore >= 70 ? '#FF8C00' : '#FFD700';
      const el = document.createElement('div');
      el.style.cssText = 'display:flex;gap:12px;align-items:flex-start;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,140,0,0.15);border-radius:10px;margin-bottom:8px;cursor:pointer;transition:all 0.2s;';
      el.onmouseover = () => el.style.background = 'rgba(255,140,0,0.07)';
      el.onmouseout = () => el.style.background = 'rgba(255,255,255,0.03)';
      el.innerHTML = `
        <div style="font-size:1.6rem;flex-shrink:0;">🛕</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:0.9rem;margin-bottom:3px;">${temple.name}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:5px;">${state}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">${badges.join('')}</div>
        </div>
        <div style="font-size:0.75rem;font-weight:700;color:${scoreColor};flex-shrink:0;">${temple.fameScore}</div>
      `;
      
      if (isLocked) {
        el.onclick = () => {
          openPricingOverlay();
        };
      } else if (temple.lat && temple.lng) {
        el.onclick = () => {
          map.flyTo([temple.lat, temple.lng], 16, { animate: true, duration: 1.5 });
          plotSinglePoiMarker(temple);
          showNotification(`📍 Navigated to ${temple.name}`, 'info');
        };
      }
      container.appendChild(el);
    });
  });
  lucide.createIcons();
}

// ================= AUTO-PLOT MAP TOGGLE =================

/**
 * Syncs the toggle pill UI to the current autoPlotEnabled state.
 * Called on init and after every toggle.
 */
function syncAutoPlotUI() {
  const pill  = document.getElementById('autoPlotToggle');
  const dot   = document.getElementById('autoPlotDot');
  const label = document.getElementById('autoPlotLabel');
  if (!pill) return;

  if (autoPlotEnabled) {
    dot.className   = 'toggle-dot toggle-dot-on';
    label.textContent = 'Auto-Plot ON';
    pill.classList.remove('pill-off');
  } else {
    dot.className   = 'toggle-dot toggle-dot-off';
    label.textContent = 'Auto-Plot OFF';
    pill.classList.add('pill-off');
  }
  lucide.createIcons();
}

/**
 * Flips the auto-plot preference, saves it, and updates UI.
 */
function toggleAutoPlot() {
  autoPlotEnabled = !autoPlotEnabled;
  localStorage.setItem('globeroutes_autoplot', autoPlotEnabled ? 'true' : 'false');
  syncAutoPlotUI();

  if (autoPlotEnabled) {
    showNotification('🗺️ Auto-Plot enabled — map will show places when you select a country or city.', 'success');
  } else {
    // Clear any existing markers when turning off
    clearMarkers();
    showNotification('🗺️ Auto-Plot disabled — map stays clean until you manually plot a place.', 'info');
  }
}

// ================= GEOSPATIAL MAP CONTROLLERS =================

function initMap() {
  // Light layer for zoomed out view (max zoom 11)
  const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 11
  });

  // Detailed OSM layer for zoomed in view (min zoom 12)
  const detailLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 12,
    maxZoom: 20
  });

  // Standard initialization
  map = L.map('map', {
    zoomControl: false,
    layers: [lightLayer, detailLayer]
  }).setView([20.0, 10.0], 3);
  
  // Mount customized zoom tools on the bottom-right corner to clear left sidebar
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);
  
  // Initialize Leaflet Routing Machine with Geocoder
  routingControl = L.Routing.control({
    waypoints: [],
    routeWhileDragging: true,
    geocoder: L.Control.Geocoder.nominatim(),
    // Keep it tucked in the top right
    position: 'topright',
    createMarker: function() { return null; }, // Disable duplicate routing markers
    show: false, // Hide turn-by-turn text box on map completely
    addWaypoints: false, // Disable dragging to add intermediate waypoints
    lineOptions: {
      styles: [
        { color: '#0f172a', opacity: 0.35, weight: 11 }, // outer soft border shadow
        { color: '#3b82f6', opacity: 0.85, weight: 6 },  // thick primary route line
        { color: '#93c5fd', opacity: 0.95, weight: 2, dashArray: '6, 6' } // glowing inner dash line
      ]
    },
    showAlternatives: true,
    altLineOptions: {
      styles: [
        { color: '#0f172a', opacity: 0.35, weight: 9 },
        { color: '#f59e0b', opacity: 0.75, weight: 5 },
        { color: '#fef08a', opacity: 0.9, weight: 1.5, dashArray: '6, 6' }
      ]
    }
  }).addTo(map);

  routingControl.on('routesfound', function(e) {
    if (currentTravelMode !== 'road') return; // Bypass Leaflet Routing Machine updates if not in road travel mode
    const routes = e.routes;
    const summary = routes[0].summary;
    activeRouteCoordinates = routes[0].coordinates;
    updateRouteStats(summary.totalDistance, summary.totalTime);
    generateAmenitiesAlongRoute(activeRouteCoordinates);
  });
}

function clearMarkers() {
  activeMarkers.forEach(marker => map.removeLayer(marker));
  activeMarkers = [];
  if (activeSingleMarker) {
    map.removeLayer(activeSingleMarker);
    activeSingleMarker = null;
  }
}

function clearRouteLine() {
  if (activeRouteLine) {
    map.removeLayer(activeRouteLine);
    activeRouteLine = null;
  }
}

/**
 * Plots Points of Interest on Leaflet Map
 * @param {Array} pois - Array of attraction objects
 * @param {string} [mode] - 'country' for overview mode, 'city' for detail mode
 */
function plotPOIMarkers(pois, mode = 'city') {
  clearMarkers();
  
  const bounds = [];
  const isCountryMode = mode === 'country';
  
  pois.forEach((poi, idx) => {
    // Check if free user is looking at a premium locked gem
    const isLockedForFree = isAttractionLocked(poi.fameTier, poi.category === 'temple');
    
    // In country overview mode, size by fame tier
    const tierSizeMap = { red: 22, orange: 18, yellow: 15, green: 12, blue: 11 };
    const baseSize = isCountryMode ? (tierSizeMap[poi.fameTier] || 14) : 18;
    
    // Build pulsing marker HTML
    let markerHtml;
    if (isLockedForFree) {
      markerHtml = `
        <div class="custom-marker marker-blue" style="display:flex;align-items:center;justify-content:center;width:${baseSize}px;height:${baseSize}px;">
          <i data-lucide="lock" style="width:8px;height:8px;stroke-width:3;color:white;"></i>
        </div>`;
    } else {
      const pulseRing = isCountryMode && poi.fameTier === 'red'
        ? `<div class="marker-pulse-ring" style="border-color:var(--tier-${poi.fameTier});"></div>`
        : '';
      markerHtml = `
        <div style="position:relative;width:${baseSize}px;height:${baseSize}px;">
          ${pulseRing}
          <div class="custom-marker marker-${poi.fameTier}" style="width:${baseSize}px;height:${baseSize}px;"></div>
        </div>`;
    }
    
    const customIcon = L.divIcon({
      html: markerHtml,
      className: 'leaflet-custom-div-icon',
      iconSize: [baseSize, baseSize],
      iconAnchor: [baseSize / 2, baseSize / 2]
    });
    
    const marker = L.marker([poi.lat, poi.lng], { icon: customIcon }).addTo(map);
    
    // Popup content
    const premiumLockAlert = isLockedForFree
      ? `<div style="color:#ffd700;font-size:0.75rem;margin-top:4px;">🔒 Pro Exclusive</div>`
      : '';
    
    // In country mode show persistent tooltip label under icon
    if (isCountryMode && poi.fameTier !== 'blue') {
      marker.bindTooltip(
        `<span style="font-size:0.7rem;font-weight:700;color:white;text-shadow:0 1px 4px #000;white-space:nowrap;">${poi.name}</span>`,
        { permanent: false, direction: 'top', offset: [0, -baseSize / 2 - 2], opacity: 0.95, className: 'poi-label-tooltip' }
      );
    }
    
    const popupContent = `
      <div style="font-family:'Inter';padding:4px;min-width:130px;">
        <h4 style="margin:0 0 4px 0;font-size:0.85rem;color:white;font-weight:600;">${poi.name}</h4>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:0.65rem;padding:2px 6px;border-radius:4px;background:var(--tier-${poi.fameTier});opacity:0.85;text-transform:uppercase;font-weight:bold;color:white;">${getTierRepresentation(poi.fameTier).toUpperCase()}</span>
          <span style="font-size:0.65rem;color:#ffd700;">★ ${poi.rating}</span>
        </div>
        <div style="font-size:0.65rem;color:rgba(255,255,255,0.65);margin-top:4px;">${poi.tagline}</div>
        ${premiumLockAlert}
      </div>
    `;
    
    marker.bindPopup(popupContent, { closeButton: false, maxWidth: 180 });
    
    marker.on('click', () => {
      if (isLockedForFree) {
        openPricingOverlay();
      } else {
        showPoiDetails(poi.id);
      }
    });
    
    activeMarkers.push(marker);
    bounds.push([poi.lat, poi.lng]);
  });
  
  // Fit map to all markers
  if (bounds.length > 0) {
    const padding = isCountryMode ? [60, 60] : [50, 50];
    const maxZ = isCountryMode ? 10 : 14;
    map.fitBounds(bounds, { padding, maxZoom: maxZ, animate: true, duration: 0.8 });
  }
}

function plotSinglePoiMarker(poi) {
  if (activeSingleMarker) {
    map.removeLayer(activeSingleMarker);
  }
  
  const fTier = poi.fameTier || 'orange';
  const markerHtml = `
    <div style="position:relative;width:24px;height:24px;">
      <div class="marker-pulse-ring" style="border-color:#fff;width:30px;height:30px;top:-3px;left:-3px;"></div>
      <div class="custom-marker marker-${fTier}" style="width:24px;height:24px;border:3px solid #fff;box-shadow:0 0 15px var(--tier-${fTier});"></div>
    </div>`;
  
  const customIcon = L.divIcon({
    html: markerHtml,
    className: 'leaflet-custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
  
  activeSingleMarker = L.marker([poi.lat, poi.lng], { icon: customIcon }).addTo(map);
  
  const popupContent = `
    <div style="font-family:'Inter';padding:4px;min-width:130px;">
      <h4 style="margin:0 0 4px 0;font-size:0.85rem;color:white;font-weight:600;">${poi.name}</h4>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-size:0.65rem;padding:2px 6px;border-radius:4px;background:var(--tier-${fTier});opacity:0.85;text-transform:uppercase;font-weight:bold;color:white;">${getTierRepresentation(fTier).toUpperCase()}</span>
        <span style="font-size:0.65rem;color:#ffd700;">★ ${poi.rating || 4.5}</span>
      </div>
    </div>
  `;
  activeSingleMarker.bindPopup(popupContent, { closeButton: false, maxWidth: 180 }).openPopup();
}

function drawTravelRoute(origin, dest) {
  if (!origin || !dest) return;
  if (activeRouteLine) map.removeLayer(activeRouteLine);
  
  const latlngs = [
    [origin.lat, origin.lng],
    [dest.lat, dest.lng]
  ];
  
  activeRouteLine = L.polyline(latlngs, {
    color: '#00d2ff',
    weight: 4,
    opacity: 0.8,
    dashArray: '10, 10',
    lineCap: 'round',
    lineJoin: 'round',
    className: 'animated-route-line'
  }).addTo(map);
  
  map.fitBounds(activeRouteLine.getBounds(), { padding: [50, 50], maxZoom: 10, animate: true, duration: 1.5 });
}

// ================= SIDEBAR & NAVIGATION SYSTEM =================

function navigateHome() {
  activeCountryId = null;
  activeCityId = null;
  
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panelHome').classList.add('active');
  
  // Reset Map View to default world scale
  map.setView([20.0, 10.0], 3);
  clearMarkers();
  clearRouteLine();
}

function navigateCountry(countryId) {
  clearRouteLine();
  const country = window.SEED_COUNTRIES[countryId.toLowerCase()];
  if (!country) return;
  
  activeCountryId = countryId;
  activeCityId = null;
  
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panelCountry').classList.add('active');
  
  // Populate country metadata
  document.getElementById('countryHeaderBg').style.backgroundImage = `url('${country.coverImage}')`;
  document.getElementById('countryHeaderFlag').textContent = country.flag;
  document.getElementById('countryHeaderName').textContent = country.name;
  document.getElementById('countryHeaderCapital').textContent = `Continent: ${country.continent}`;
  document.getElementById('countryHeaderPois').textContent = `${country.totalAttractions} Preseeded Sights`;
  document.getElementById('countryHeaderDesc').textContent = country.description;
  
  // Gating access checks for country hub
  const poisContainer = document.getElementById('countryPoisContainer');
  
  // Remove existing locks
  const existingLock = poisContainer.querySelector('.premium-locked-overlay');
  if (existingLock) existingLock.remove();
  poisContainer.classList.remove('blur-locked');
  
  if (!country.isFree && (!currentUser || !currentUser.isPremium)) {
    // Injected glass lock overlay restricting explorer from premium lists
    poisContainer.classList.add('blur-locked');
    const lockOverlay = document.createElement('div');
    lockOverlay.className = 'premium-locked-overlay';
    lockOverlay.innerHTML = `
      <div class="locked-badge-icon">🔒</div>
      <h3 style="font-family:'Outfit';color:#ffd700;">Pro Explorer Destination</h3>
      <p style="font-size:0.85rem;color:var(--text-secondary);max-width:280px;margin:0 auto;">${country.name} is a high-detail premium country. Upgrade to Pro to explore all landmarks, cities, and hidden gems!</p>
      <button class="btn btn-premium" onclick="openPricingOverlay()"><i data-lucide="sparkles" style="width:16px;"></i> Unlock Pro Explorer</button>
    `;
    poisContainer.appendChild(lockOverlay);
    lucide.createIcons();
  }
  
  if (countryId === 'india') {
    const opts = document.getElementById('indiaFilterOptions');
    if (opts) opts.style.display = 'block';
    
    // Ensure default mode active state
    setIndiaViewMode(currentIndiaViewMode);
  } else {
    const opts = document.getElementById('indiaFilterOptions');
    if (opts) opts.style.display = 'none';
    renderCitiesList(countryId);
  }
  
  if (autoPlotEnabled) {
    if (countryId.toLowerCase() !== 'india') {
      let countryPois = window.SEED_ATTRACTIONS.filter(
        poi => poi.countryId === countryId.toLowerCase()
      );
      
      // Also add procedurally generated POIs saved in localStorage
      const savedCities = getSavedProceduralCities(countryId);
      savedCities.forEach(city => {
        const procData = getSavedProceduralCityData(city.id);
        if (procData) countryPois.push(...procData.attractions);
      });
      
      // Plot in 'country' mode — proportional sizes, pulsing red icons, permanent labels
      plotPOIMarkers(countryPois, 'country');
      
      showNotification(
        `${country.flag} ${country.name} — ${countryPois.length} famous places plotted on map`,
        'info'
      );
    }
  } else {
    // Auto-Plot OFF: just center the camera, no markers
    clearMarkers();
    map.setView(country.center, country.zoom, { animate: true, duration: 0.8 });
  }
}

function renderFlagshipCountries() {
  const container = document.getElementById('flagshipCountriesList');
  container.innerHTML = '';
  
  Object.values(window.SEED_COUNTRIES).forEach(country => {
    const isLocked = !country.isFree && (!currentUser || !currentUser.isPremium);
    const lockBadge = isLocked ? `<i data-lucide="lock" style="width:12px;color:#ffd700;margin-left:auto;"></i>` : '';
    const proLabel = isLocked ? `<span style="font-size:0.7rem;color:#ffd700;margin-left:8px;">[PRO]</span>` : '';
    
    const el = document.createElement('div');
    el.className = 'city-card glass';
    el.style.padding = '14px 18px';
    el.innerHTML = `
      <div style="font-size:1.4rem;">${country.flag}</div>
      <div style="display:flex;flex-direction:column;">
        <span style="font-weight:600;font-size:0.95rem;">${country.name} ${proLabel}</span>
        <span style="font-size:0.75rem;color:var(--text-secondary);">${country.continent}</span>
      </div>
      ${lockBadge}
    `;
    el.onclick = () => navigateCountry(country.id);
    container.appendChild(el);
  });
  
  lucide.createIcons();
}

function renderCitiesList(countryId) {
  const container = document.getElementById('countryCitiesList');
  container.innerHTML = '';
  
  let cities = Object.values(window.SEED_CITIES).filter(c => c.countryId === countryId.toLowerCase());
  const savedCities = getSavedProceduralCities(countryId);
  
  let ranked = [...cities, ...savedCities].map(city => {
    const pois = window.SEED_ATTRACTIONS.filter(a => a.cityId === city.id);
    const maxScore  = pois.length ? Math.max(...pois.map(a => a.fameScore)) : 0;
    const poiCount  = pois.length;
    const topTier   = maxScore >= 90 ? 'red'
                    : maxScore >= 70 ? 'orange'
                    : maxScore >= 50 ? 'yellow'
                    : maxScore >= 30 ? 'green'
                    : maxScore >   0 ? 'blue'
                    : null; 
    return { ...city, _maxScore: maxScore, _poiCount: poiCount, _topTier: topTier };
  }).sort((a, b) => b._maxScore - a._maxScore);

  if (countryId === 'india') {
    if (currentIndiaViewMode === 'top_hits') {
      ranked = ranked.filter(c => c._maxScore >= 95);
    } else if (currentIndiaViewMode === 'state') {
      // Group by state
      const statesMap = {};
      ranked.forEach(c => {
        const s = c.state || 'Other';
        if (!statesMap[s]) statesMap[s] = [];
        statesMap[s].push(c);
      });
      
      Object.keys(statesMap).sort().forEach(stateName => {
        // State Header
        const header = document.createElement('div');
        header.style.cssText = 'padding: 8px 12px; margin-top: 15px; margin-bottom: 5px; background: rgba(255,255,255,0.05); border-left: 3px solid var(--tier-orange); border-radius: 4px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 1px; font-size: 0.85rem;';
        header.textContent = stateName;
        container.appendChild(header);
        
        // Render cities under this state
        statesMap[stateName].forEach((city, idx) => {
          container.appendChild(createCityCard(city, idx + 1, false)); // No global top rank for state view
        });
      });
      lucide.createIcons();
      return;
    }
  }

  ranked.forEach((city, idx) => {
    container.appendChild(createCityCard(city, idx + 1, true));
  });
  
  lucide.createIcons();
}

function createCityCard(city, rank, showGlobalRank) {
  const isTop = showGlobalRank && rank === 1;
  const tierColor = city._topTier ? `var(--tier-${city._topTier})` : 'var(--text-secondary)';
  const tierGlow  = city._topTier ? `0 0 8px var(--tier-${city._topTier})` : 'none';

  const rankBadge = isTop
    ? `<span style="font-size:0.65rem;font-weight:800;color:#ffd700;background:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.4);border-radius:20px;padding:2px 7px;white-space:nowrap;">👑 TOP</span>`
    : (showGlobalRank ? `<span style="font-size:0.65rem;font-weight:700;color:var(--text-secondary);background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:2px 6px;">#${rank}</span>` : '');

  const poiPill = city._poiCount > 0
    ? `<span style="font-size:0.62rem;color:${tierColor};font-weight:600;">${city._poiCount} place${city._poiCount > 1 ? 's' : ''}</span>`
    : `<span style="font-size:0.62rem;color:var(--text-secondary);">Explorable</span>`;

  const tierDot = city._topTier
    ? `<span style="width:7px;height:7px;border-radius:50%;background:${tierColor};box-shadow:${tierGlow};display:inline-block;flex-shrink:0;"></span>`
    : '';

  const coverImg = city.coverImage || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=150&q=80';
  const stateTag = city.state ? `<span style="font-size:0.62rem;color:rgba(255,255,255,0.4);">${city.state}</span>` : '';

  const el = document.createElement('div');
  el.className = 'city-card';
  if (isTop) el.style.cssText = 'border: 1px solid rgba(255,215,0,0.25); background: rgba(255,215,0,0.04);';

  el.innerHTML = `
    <div class="city-thumbnail" style="background-image:url('${coverImg}');flex-shrink:0;"></div>
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px;">
        ${rankBadge}
        <h4 style="font-size:0.92rem;font-weight:700;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${city.name}</h4>
      </div>
      <p style="font-size:0.72rem;color:var(--text-secondary);margin:0 0 3px 0;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${city.tagline || ''}</p>
      <div style="display:flex;align-items:center;gap:6px;">
        ${tierDot}
        ${poiPill}
        ${stateTag}
      </div>
    </div>
    <i data-lucide="chevron-right" style="width:15px;color:var(--text-secondary);flex-shrink:0;"></i>
  `;
  el.onclick = () => navigateCity(city.id);
  return el;
}

function navigateCity(cityId) {
  // Check if city is preseeded or procedural
  let city = window.SEED_CITIES[cityId];
  let pois = [];
  
  if (city) {
    pois = window.SEED_ATTRACTIONS.filter(poi => poi.cityId === cityId);
    activeCountryId = city.countryId;
  } else {
    // Procedural lookup
    const procData = getSavedProceduralCityData(cityId);
    if (procData) {
      city = procData.city;
      pois = procData.attractions;
      activeCountryId = city.countryId;
    }
  }
  
  if (!city) return;
  activeCityId = cityId;
  
  // Restrict navigation to Pro if country is premium
  const countryObj = window.SEED_COUNTRIES[city.countryId];
  if (countryObj && !countryObj.isFree && (!currentUser || !currentUser.isPremium)) {
    openPricingOverlay();
    return;
  }
  
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panelCity').classList.add('active');
  
  // Populate UI labels
  document.getElementById('cityDetailThumbnail').style.backgroundImage = `url('${city.coverImage}')`;
  document.getElementById('cityDetailName').textContent = city.name;
  document.getElementById('cityDetailTagline').textContent = city.tagline;
  
  // Back button routing
  document.getElementById('cityBackButton').onclick = () => navigateCountry(city.countryId);
  
  // Travel Mode: Route Jump button click setup
  document.getElementById('cityTravelModeBtn').onclick = () => handleTravelHop(city.id, city.countryId);
  
  // Lock hidden gems indicators on legend filters for free tier
  const blueFilter = document.getElementById('blueLegendFilter');
  if (currentUser && currentUser.isPremium) {
    blueFilter.querySelector('.premium-lock-icon').style.display = 'none';
  } else {
    blueFilter.querySelector('.premium-lock-icon').style.display = 'inline-block';
  }
  
  // Render POIs and plot on map in 'city' detail mode
  renderPOIsSidebar(pois);
  
  // Apply initial filters & plot markers on map (city mode = tight zoom, all sizes equal)
  if (autoPlotEnabled) {
    applyPOIFilters();
    showNotification(`📍 ${city.name} — ${pois.length} places loaded on map`, 'info');
  } else {
    // Auto-Plot OFF: render list but don't touch the map, just zoom to city center
    renderPOIsSidebar(pois);
    clearMarkers();
    map.setView([city.lat, city.lng], 13, { animate: true, duration: 0.8 });
  }
}

function renderPOIsSidebar(pois) {
  const container = document.getElementById('cityPoisList');
  container.innerHTML = '';
  
  if (pois.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-secondary);">No attractions found matching filters.</div>`;
    return;
  }
  
  pois.forEach(poi => {
    const isLocked = isAttractionLocked(poi.fameTier, poi.category === 'temple');
    
    const card = document.createElement('div');
    card.className = `city-card glass`;
    card.style.borderLeft = `4px solid var(--tier-${poi.fameTier})`;
    
    // Glowing background hover depending on tier
    card.style.transition = 'var(--transition-smooth)';
    
    if (isLocked) {
      // Visual locks for premium elements
      card.innerHTML = `
        <div class="city-thumbnail" style="background-image:url('https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=60&q=80');flex-shrink:0;filter:blur(4px);"></div>
        <div style="flex:1;filter:blur(3px);pointer-events:none;min-width:0;">
          <h4 style="font-size:0.95rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">[Premium Landmark]</h4>
          <p style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Unlock Pro to explore all landmarks...</p>
        </div>
        <div style="padding:4px 8px;background:rgba(255,215,0,0.15);border:1px solid #ffd700;border-radius:6px;font-size:0.7rem;color:#ffd700;font-weight:bold;display:flex;align-items:center;gap:4px;flex-shrink:0;">
          <i data-lucide="lock" style="width:12px;"></i> PRO
        </div>
      `;
      card.onclick = () => openPricingOverlay();
    } else {
      const isVisited = currentUser && currentUser.visitedPois.includes(poi.id);
      const visitedCheck = isVisited ? `<i data-lucide="check-circle" style="color:var(--tier-green);width:16px;margin-left:auto;flex-shrink:0;"></i>` : '';
      const unescoLabel = poi.isUnesco ? `<span style="font-size:0.65rem;color:var(--tier-green);margin-left:4px;">[UNESCO]</span>` : '';
      const coverImg = poi.images && poi.images.length > 0 ? poi.images[0] : 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=150&q=80';
      
      card.innerHTML = `
        <img src="${coverImg}" style="width:60px;height:60px;border-radius:10px;object-fit:cover;flex-shrink:0;">
        <div style="flex:1;min-width:0;">
          <h4 style="font-size:0.95rem;font-weight:600;display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${poi.name} ${unescoLabel}
          </h4>
          <div style="display:flex;gap:10px;margin-top:4px;font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            <span style="text-transform:capitalize;">${poi.category}</span>
            <span>★ ${poi.rating}</span>
            <span>Fee: ${poi.entryFee}</span>
          </div>
        </div>
        ${visitedCheck}
      `;
      card.onclick = () => {
        showPoiDetails(poi.id);
        map.flyTo([poi.lat, poi.lng], 16, { animate: true, duration: 1.5 });
        plotSinglePoiMarker(poi);
      };
    }
    
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

// ================= TRAVEL HOPS & ROUTING MODE =================

/**
 * Simulates city-by-city travel jump
 */
function handleTravelHop(currentCityId, countryId) {
  // Check Hop limit for free users
  if (!currentUser || (!currentUser.isPremium && travelHopCount >= 3)) {
    openPricingOverlay();
    showNotification("Travel Hop Limit reached! Upgrade to Pro for unlimited routing.", "warning");
    return;
  }
  
  // Find adjacent cities in country to jump to
  const cities = Object.values(window.SEED_CITIES).filter(c => c.countryId === countryId.toLowerCase() && c.id !== currentCityId);
  const savedCities = getSavedProceduralCities(countryId).filter(c => c.id !== currentCityId);
  const allCities = [...cities, ...savedCities];
  
  if (allCities.length === 0) {
    showNotification("No adjacent city routes discovered in this area.", "info");
    return;
  }
  
  // Jump to a random adjacent city
  const randomIndex = Math.floor(Math.random() * allCities.length);
  const destination = allCities[randomIndex];
  
  // Increment Travel hops
  travelHopCount++;
  if (currentUser) {
    currentUser.travelHops = (currentUser.travelHops || 0) + 1;
    saveUserSession();
    syncUserJournalData();
  }
  
  const origin = window.SEED_CITIES[currentCityId] || getSavedProceduralCityData(currentCityId)?.city || {lat: 0, lng: 0, name: 'Current City'};
  
  showNotification(`Hoping route... Traveling from ${origin.name} to ${destination.name}!`, "info");
  
  drawTravelRoute(origin, destination);
  
  // Route jump
  navigateCity(destination.id);
}

function isAttractionLocked(fameTier, isTemple = false) {
  const tierName = currentUser ? currentUser.membershipTier : "Free Explorer";
  const isPro = tierName.includes("Pro") || tierName.includes("Admin");
  const isStandard = tierName.includes("Standard");
  
  if (isPro) {
    return false;
  }
  
  if (isStandard) {
    // Standard plan has full access to all temples/Char Dhams!
    if (isTemple) {
      return false;
    }
    // Access Red, Yellow, Orange
    const allowedTiers = ['red', 'orange', 'yellow'];
    if (allowedTiers.includes(fameTier)) {
      return false;
    }
    return true; // Green and Blue remain locked
  }
  
  // Free plan: Red only!
  if (fameTier === 'red') {
    return false;
  }
  return true;
}
window.isAttractionLocked = isAttractionLocked;

// ================= FILTER SERVICES =================

function toggleTierFilter(tier) {
  // Premium block check for non-accessible filters depending on user tier
  if (isAttractionLocked(tier, false)) {
    openPricingOverlay();
    return;
  }
  
  activeFilters.tiers[tier] = !activeFilters.tiers[tier];
  
  // Update styling indicators on checklist
  const legendItems = document.querySelectorAll('.legend-item');
  const indexMap = { red: 0, orange: 1, yellow: 2, green: 3, blue: 4 };
  const item = legendItems[indexMap[tier]];
  
  if (activeFilters.tiers[tier]) {
    item.classList.add('active');
  } else {
    item.classList.remove('active');
  }
  
  applyPOIFilters();
}

function toggleCategoryFilter(cat, btnElement) {
  // Sync BOTH category state variables to fix the activeFilters mismatch bug
  activeCategory = cat;
  activeFilters.category = cat;
  document.querySelectorAll('.category-chip').forEach(el => el.classList.remove('active'));
  btnElement.classList.add('active');
  
  applyPOIFilters();
}

function setIndiaViewMode(mode) {
  currentIndiaViewMode = mode;
  
  // Update button active states
  const modes = {
    'state': 'btnStateWise',
    'city': 'btnCityWise',
    'top_hits': 'btnTopHits'
  };
  
  Object.values(modes).forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.opacity = '0.5';
      el.style.transform = 'scale(0.95)';
    }
  });
  
  const activeEl = document.getElementById(modes[mode]);
  if (activeEl) {
    activeEl.style.opacity = '1';
    activeEl.style.transform = 'scale(1)';
  }
  
  renderCitiesList('india');
  
  // Update map markers in sync with the active view mode (if Auto-Plot is enabled)
  if (autoPlotEnabled) {
    let countryPois = window.SEED_ATTRACTIONS.filter(
      poi => poi.countryId === 'india'
    );
    
    // Add saved procedural POIs
    const savedCities = getSavedProceduralCities('india');
    savedCities.forEach(city => {
      const procData = getSavedProceduralCityData(city.id);
      if (procData) countryPois.push(...procData.attractions);
    });
    
    if (mode === 'top_hits') {
      countryPois = countryPois.filter(poi => poi.fameScore >= 95);
    }
    
    plotPOIMarkers(countryPois, 'country');
  }
}

function resetSidebarFilters() {
  activeFilters = {
    tiers: { red: true, orange: true, yellow: true, green: true, blue: true },
    category: 'all'
  };
  
  document.querySelectorAll('.legend-item').forEach(item => item.classList.add('active'));
  document.querySelectorAll('.category-chip').forEach(chip => chip.classList.remove('active'));
  document.querySelector('.category-chips .category-chip:first-child').classList.add('active');
  
  applyPOIFilters();
}

function applyPOIFilters() {
  if (!activeCityId) return;
  
  // Retrieve raw active city POIs
  let pois = [];
  const preseededPois = window.SEED_ATTRACTIONS.filter(p => p.cityId === activeCityId);
  
  if (preseededPois.length > 0) {
    pois = preseededPois;
  } else {
    const procData = getSavedProceduralCityData(activeCityId);
    if (procData) pois = procData.attractions;
  }
  
  // Filter by Tier checkboxes
  let filtered = pois.filter(poi => activeFilters.tiers[poi.fameTier]);
  
  // Filter by Category Chips
  if (activeFilters.category !== 'all') {
    filtered = filtered.filter(poi => poi.category === activeFilters.category);
  }
  
  // Plot filtered icons on Map and reload list
  plotPOIMarkers(filtered);
  renderPOIsSidebar(filtered);
}

// ================= GLOBAL AUTOCONTEXT SEARCH ENGINE =================

function handleGlobalSearch(query) {
  const dropdown = document.getElementById('searchAutocomplete');
  const normQuery = query.trim().toLowerCase();
  
  if (normQuery.length < 2) {
    dropdown.innerHTML = '';
    dropdown.style.display = 'none';
    return;
  }
  
  const results = [];
  
  // Search preseeded countries
  Object.values(window.SEED_COUNTRIES).forEach(c => {
    if (c.name.toLowerCase().includes(normQuery)) {
      results.push({ type: 'country', id: c.id, label: `${c.flag} ${c.name}`, text: 'Flagship Country' });
    }
  });
  
  // Search preseeded cities
  Object.values(window.SEED_CITIES).forEach(c => {
    if (c.name.toLowerCase().includes(normQuery)) {
      const countryObj = window.SEED_COUNTRIES[c.countryId];
      results.push({ type: 'city', id: c.id, label: `🏙️ ${c.name}`, text: `City in ${countryObj?.name || 'Explorer'}` });
    }
  });
  
  // Search preseeded Attractions (check Premium gates)
  window.SEED_ATTRACTIONS.forEach(a => {
    if (a.name.toLowerCase().includes(normQuery)) {
      const isLocked = isAttractionLocked(a.fameTier, a.category === 'temple');
      const labelPrefix = isLocked ? '🔒' : '📍';
      
      results.push({ 
        type: 'poi', 
        id: a.id, 
        label: `${labelPrefix} ${a.name}`, 
        text: `Sight in ${window.SEED_CITIES[a.cityId]?.name || 'Explorer'} (${getTierRepresentation(a.fameTier).toUpperCase()})`,
        locked: isLocked
      });
    }
  });
  
  // IF unseeded city search, allow synthetic procedural option
  if (results.length === 0 && activeCountryId) {
    const activeCountryObj = window.SEED_COUNTRIES[activeCountryId];
    results.push({
      type: 'synthesize',
      queryName: query,
      label: `✨ Generate '${query}' City`,
      text: `Procedural creation of local sights in ${activeCountryObj?.name || 'Active Country'}`
    });
  }
  
  // Render search options
  if (results.length > 0) {
    dropdown.innerHTML = '';
    results.slice(0, 8).forEach(res => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `
        <div style="display:flex;flex-direction:column;flex:1;">
          <span style="font-weight:600;font-size:0.9rem;">${res.label}</span>
          <span style="font-size:0.7rem;color:var(--text-secondary);">${res.text}</span>
        </div>
      `;
      
      item.onclick = () => {
        dropdown.style.display = 'none';
        document.getElementById('globalSearchInput').value = '';
        
        if (res.type === 'country') navigateCountry(res.id);
        if (res.type === 'city') navigateCity(res.id);
        if (res.type === 'poi') {
          if (res.locked) {
            openPricingOverlay();
          } else {
            // Plot and focus
            const city = window.SEED_CITIES[window.SEED_ATTRACTIONS.find(p => p.id === res.id)?.cityId];
            if (city) navigateCity(city.id);
            showPoiDetails(res.id);
          }
        }
        if (res.type === 'synthesize') {
          handleProceduralGeneration(res.queryName);
        }
      };
      
      dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
  } else {
    dropdown.style.display = 'none';
  }
}

// ================= PROCEDURAL SYNTHESIS CONTROLLERS =================

function handleProceduralGeneration(cityName) {
  if (!activeCountryId) {
    showNotification("Please select a flagship country first to generate local cities.", "warning");
    return;
  }
  
  // Pro check for infinite synthesis
  if (!currentUser || !currentUser.isPremium) {
    openPricingOverlay();
    showNotification("Infinite synthesis is restricted to Pro. Seed countries are free!", "warning");
    return;
  }
  
  const synth = window.synthesizeCityAndPOIs(cityName, activeCountryId);
  if (!synth) return;
  
  // Save procedural details in LocalStorage
  saveProceduralCity(synth.city, synth.attractions);
  
  showNotification(`Procedural Synthesis Complete: '${cityName}' generated!`, "success");
  
  // Route explorer to the new generative city hub
  navigateCity(synth.city.id);
}

function getSavedProceduralCities(countryId) {
  const store = localStorage.getItem('globeroutes_proc_cities');
  if (!store) return [];
  const list = JSON.parse(store);
  return list.filter(c => c.countryId === countryId.toLowerCase());
}

function saveProceduralCity(city, attractions) {
  // Store city profiles
  const storeCities = localStorage.getItem('globeroutes_proc_cities');
  let listCities = storeCities ? JSON.parse(storeCities) : [];
  
  if (!listCities.find(c => c.id === city.id)) {
    listCities.push(city);
    localStorage.setItem('globeroutes_proc_cities', JSON.stringify(listCities));
  }
  
  // Store custom attractions map
  localStorage.setItem(`globeroutes_proc_attractions_${city.id}`, JSON.stringify(attractions));
}

function getSavedProceduralCityData(cityId) {
  const storeCities = localStorage.getItem('globeroutes_proc_cities');
  if (!storeCities) return null;
  const listCities = JSON.parse(storeCities);
  const city = listCities.find(c => c.id === cityId);
  
  if (!city) return null;
  const attractions = JSON.parse(localStorage.getItem(`globeroutes_proc_attractions_${cityId}`) || '[]');
  return { city, attractions };
}

// ================= DETAILS DIALOG OVERLAYS =================

function showPoiDetails(poiId) {
  activePoiId = poiId;
  
  // Query Attraction details
  let poi = window.SEED_ATTRACTIONS.find(p => p.id === poiId);
  if (!poi) {
    // Check procedural store
    if (activeCityId) {
      const data = getSavedProceduralCityData(activeCityId);
      if (data) poi = data.attractions.find(p => p.id === poiId);
    }
  }
  
  if (!poi) return;
  
  // Restrict Orange, Yellow, Green, and Blue Gems to Pro users
  if (poi.fameTier !== 'red' && (!currentUser || !currentUser.isPremium)) {
    openPricingOverlay();
    return;
  }
  
  // Render details modal
  document.getElementById('poiDetailsModal').style.display = 'flex';
  
  document.getElementById('poiDetailGallery').style.backgroundImage = `url('${poi.images[0]}')`;
  
  const tierBadge = document.getElementById('poiDetailTierBadge');
  tierBadge.textContent = getTierRepresentation(poi.fameTier);
  tierBadge.style.backgroundColor = `var(--tier-${poi.fameTier})`;
  tierBadge.style.boxShadow = `var(--glow-${poi.fameTier})`;
  
  document.getElementById('poiDetailName').textContent = poi.name;
  document.getElementById('poiDetailFee').textContent = poi.entryFee;
  document.getElementById('poiDetailHours').textContent = poi.openingHours;
  document.getElementById('poiDetailSeason').textContent = poi.bestSeason;
  document.getElementById('poiDetailTime').textContent = poi.timeNeeded;
  document.getElementById('poiDetailDescription').textContent = poi.description;
  document.getElementById('poiDetailRating').textContent = poi.rating;
  
  // UNESCO site validation badge
  const unesco = document.getElementById('poiDetailUnescoBadge');
  if (poi.isUnesco) {
    unesco.style.display = 'block';
  } else {
    unesco.style.display = 'none';
  }
  
  // Sync button text for Check-in Gamification
  const checkInBtn = document.getElementById('poiCheckInBtn');
  const isVisited = currentUser && currentUser.visitedPois.includes(poi.id);
  if (isVisited) {
    checkInBtn.innerHTML = `<i data-lucide="check-circle" style="width:18px;"></i> Already Visited`;
    checkInBtn.disabled = true;
  } else {
    checkInBtn.innerHTML = `<i data-lucide="map-pin" style="width:18px;"></i> Mark as Visited`;
    checkInBtn.disabled = false;
  }
  
  // Render reviews (seed + user-submitted)
  const reviewsContainer = document.getElementById('poiDetailReviews');
  reviewsContainer.innerHTML = `<div style="color:var(--text-secondary);font-size:0.85rem;padding:10px 0;font-style:italic;">Loading reviews...</div>`;

  // Asynchronous loading with offline fallback
  const userReviewsKey = `globeroutes_reviews_${poiId}`;
  fetch(`${BACKEND_URL}/api/reviews/${poiId}`)
    .then(response => {
      if (!response.ok) throw new Error('Backend failed');
      return response.json();
    })
    .then(dbReviews => {
      // Successfully loaded from MongoDB database!
      const allReviews = [...(poi.reviews || []), ...dbReviews];
      renderReviewsList(reviewsContainer, allReviews);
    })
    .catch(error => {
      console.warn('Backend server offline, loading from local device storage:', error);
      const userReviews = JSON.parse(localStorage.getItem(userReviewsKey) || '[]');
      const allReviews = [...(poi.reviews || []), ...userReviews];
      renderReviewsList(reviewsContainer, allReviews);
    });

  // Review submission form
  const existingForm = document.getElementById('reviewSubmitForm');
  if (existingForm) existingForm.remove();

  if (currentUser) {
    const form = document.createElement('div');
    form.id = 'reviewSubmitForm';
    form.className = 'glass';
    form.style.cssText = 'padding:16px;border-radius:12px;margin-top:14px;border:1px solid rgba(99,202,255,0.2);';
    form.innerHTML = `
      <div style="font-size:0.9rem;font-weight:700;margin-bottom:12px;color:var(--text-primary);">✍️ Write a Review</div>
      <div style="margin-bottom:10px;">
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:6px;">Your Rating</div>
        <div id="starRatingInput" style="display:flex;gap:6px;font-size:1.6rem;cursor:pointer;">
          ${[1,2,3,4,5].map(n => `<span data-star="${n}" style="color:#444;transition:color 0.15s;">★</span>`).join('')}
        </div>
      </div>
      <textarea id="reviewTextInput" placeholder="Share your experience..." rows="3" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid var(--border-glass);border-radius:8px;padding:10px;color:var(--text-primary);font-size:0.85rem;resize:vertical;font-family:inherit;box-sizing:border-box;"></textarea>
      <div style="margin-top:10px;">
        <label for="reviewImageInput" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.8rem;color:var(--text-secondary);padding:8px 12px;border:1px dashed var(--border-glass);border-radius:8px;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--tier-blue)'" onmouseout="this.style.borderColor='var(--border-glass)'">
          <i data-lucide="image" style="width:16px;"></i>
          <span id="reviewImageLabel">Add a photo (optional)</span>
        </label>
        <input type="file" id="reviewImageInput" accept="image/*" style="display:none;">
        <div id="reviewImagePreview" style="margin-top:8px;display:none;">
          <img id="reviewPreviewImg" style="width:100%;max-height:150px;object-fit:cover;border-radius:8px;">
          <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:4px;cursor:pointer;" onclick="document.getElementById('reviewImageInput').value='';document.getElementById('reviewImagePreview').style.display='none';document.getElementById('reviewImageLabel').textContent='Add a photo (optional)';window._reviewImageData=null;">✕ Remove photo</div>
        </div>
      </div>
      <button id="submitReviewBtn" onclick="submitUserReview('${poiId}')" style="margin-top:12px;width:100%;padding:10px;background:var(--accent-gradient);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:0.9rem;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
        Post Review
      </button>
    `;
    reviewsContainer.parentElement.appendChild(form);

    // Star rating interactive logic
    let selectedStars = 0;
    window._reviewImageData = null;

    const starSpans = form.querySelectorAll('#starRatingInput span');
    starSpans.forEach(star => {
      star.addEventListener('mouseover', () => {
        const val = parseInt(star.dataset.star);
        starSpans.forEach((s, i) => { s.style.color = i < val ? '#ffd700' : '#444'; });
      });
      star.addEventListener('mouseout', () => {
        starSpans.forEach((s, i) => { s.style.color = i < selectedStars ? '#ffd700' : '#444'; });
      });
      star.addEventListener('click', () => {
        selectedStars = parseInt(star.dataset.star);
        window._reviewSelectedStars = selectedStars;
        starSpans.forEach((s, i) => { s.style.color = i < selectedStars ? '#ffd700' : '#444'; });
      });
    });

    // Image upload handler
    const imageInput = form.querySelector('#reviewImageInput');
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Image too large. Please choose an image under 2MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        window._reviewImageData = ev.target.result;
        document.getElementById('reviewPreviewImg').src = ev.target.result;
        document.getElementById('reviewImagePreview').style.display = 'block';
        document.getElementById('reviewImageLabel').textContent = `📷 ${file.name}`;
      };
      reader.readAsDataURL(file);
    });
  } else {
    const loginPrompt = document.createElement('div');
    loginPrompt.style.cssText = 'text-align:center;padding:14px;margin-top:10px;color:var(--text-secondary);font-size:0.85rem;';
    loginPrompt.innerHTML = `<i data-lucide="log-in" style="width:16px;vertical-align:middle;"></i> <a href="#" onclick="openAuthModal()" style="color:var(--tier-blue);text-decoration:none;font-weight:600;">Sign in</a> to write a review`;
    reviewsContainer.parentElement.appendChild(loginPrompt);
  }

  lucide.createIcons();
}

/**
 * Renders the review cards list inside reviewsContainer
 */
function renderReviewsList(reviewsContainer, allReviews) {
  reviewsContainer.innerHTML = '';
  if (allReviews.length === 0) {
    reviewsContainer.innerHTML = `<div style="color:var(--text-secondary);font-size:0.85rem;padding:10px 0;font-style:italic;">No reviews yet — be the first!</div>`;
  } else {
    allReviews.forEach(rev => {
      const card = document.createElement('div');
      card.className = 'glass';
      card.style.cssText = 'padding:14px;border-radius:10px;margin-bottom:10px;';
      const starsHtml = rev.stars
        ? `<span style="color:#ffd700;font-size:0.9rem;letter-spacing:1px;">${'★'.repeat(rev.stars)}${'☆'.repeat(5 - rev.stars)}</span>`
        : '';
      const imageHtml = rev.image
        ? `<img src="${rev.image}" alt="Review photo" style="width:100%;max-height:180px;object-fit:cover;border-radius:8px;margin-top:10px;cursor:pointer;" onclick="this.style.maxHeight=this.style.maxHeight==='none'?'180px':'none'">`
        : '';
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;color:#fff;">${rev.user.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-size:0.85rem;font-weight:600;">${rev.user}</div>
            ${starsHtml}
          </div>
          ${rev.isUserReview ? `<span style="margin-left:auto;font-size:0.65rem;background:rgba(99,202,255,0.15);color:var(--tier-blue);padding:2px 6px;border-radius:4px;">Your Review</span>` : ''}
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary);font-style:italic;margin:0;">"${rev.text}"</p>
        ${imageHtml}
      `;
      reviewsContainer.appendChild(card);
    });
  }
}

/**
 * Submits a user review for a POI, saving to MongoDB with localStorage fallback.
 */
function submitUserReview(poiId) {
  const text = document.getElementById('reviewTextInput').value.trim();
  if (!text) {
    showNotification('Please write a review before posting.', 'warning');
    return;
  }
  if (text.length < 10) {
    showNotification('Review too short — please write at least 10 characters.', 'warning');
    return;
  }

  const stars = window._reviewSelectedStars || 0;
  const imageData = window._reviewImageData || null;

  const review = {
    user: currentUser.name || 'Explorer',
    text,
    stars,
    image: imageData,
    isUserReview: true,
    date: new Date().toISOString()
  };

  const key = `globeroutes_reviews_${poiId}`;
  
  // Disable submission button visually during POST
  const submitBtn = document.getElementById('submitReviewBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting review...';
  }

  // Attempt to save to MongoDB backend
  fetch(`${BACKEND_URL}/api/reviews/${poiId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(review)
  })
    .then(response => {
      if (!response.ok) throw new Error('Database server failed to save');
      return response.json();
    })
    .then(savedReview => {
      showNotification('Review posted to MongoDB successfully!', 'success');
      finalizeReviewSubmission();
    })
    .catch(error => {
      console.warn('Backend offline, saving review to local device storage:', error);
      // LocalStorage Fallback
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(review);
      localStorage.setItem(key, JSON.stringify(existing));

      showNotification('Offline Mode: Review saved locally on your device!', 'success');
      finalizeReviewSubmission();
    });

  function finalizeReviewSubmission() {
    window._reviewSelectedStars = 0;
    window._reviewImageData = null;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post Review';
    }
    // Re-render the modal to display the newly added review immediately
    showPoiDetails(poiId);
  }
}

function closePoiDetails() {
  document.getElementById('poiDetailsModal').style.display = 'none';
  activePoiId = null;
}

function centerPOIOnMap() {
  if (!activePoiId) return;
  
  let poi = window.SEED_ATTRACTIONS.find(p => p.id === activePoiId);
  if (!poi && activeCityId) {
    const data = getSavedProceduralCityData(activeCityId);
    if (data) poi = data.attractions.find(p => p.id === activePoiId);
  }
  
  if (poi) {
    map.setView([poi.lat, poi.lng], 16);
    closePoiDetails();
  }
}

// ================= GAMIFICATION & PERSONAL TRAVEL LOGS =================

function togglePersonalTravelLog() {
  const pJournal = document.getElementById('panelJournal');
  const isCurrentlyActive = pJournal.classList.contains('active');
  
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  
  if (isCurrentlyActive) {
    // Return to default Home dashboard
    document.getElementById('panelHome').classList.add('active');
  } else {
    pJournal.classList.add('active');
    syncUserJournalData();
  }
}

function handleCheckInPOI() {
  if (!currentUser || !activePoiId) return;
  
  if (!currentUser.visitedPois.includes(activePoiId)) {
    currentUser.visitedPois.push(activePoiId);
    saveUserSession();
    updateHeaderUserBadge();
    
    // Disable check-in button
    const btn = document.getElementById('poiCheckInBtn');
    btn.innerHTML = `<i data-lucide="check-circle" style="width:18px;"></i> Already Visited`;
    btn.disabled = true;
    
    // Quick notification points toast
    showNotification("Sight checked-in! +10 Pathfinder Points scored.", "success");
    
    // Reload maps and journal
    if (activeCityId) {
      applyPOIFilters();
    }
  }
}

function syncUserJournalData() {
  if (!currentUser) return;
  
  document.getElementById('journalAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('journalUserName').textContent = currentUser.name;
  document.getElementById('journalUserTier').textContent = currentUser.membershipTier;
  
  if (currentUser.membershipTier === "Pro Explorer" || currentUser.membershipTier.includes("Admin")) {
    document.getElementById('journalUserTier').style.color = '#ffd700'; // gold
  } else if (currentUser.membershipTier === "Standard Explorer") {
    document.getElementById('journalUserTier').style.color = '#ffa940'; // orange
  } else {
    document.getElementById('journalUserTier').style.color = 'var(--text-secondary)';
  }
  
  // Sync visited counter
  document.getElementById('visitedCount').textContent = currentUser.visitedPois.length;
  
  // Compute visited points and inject timeline list
  const timeline = document.getElementById('visitedTimeline');
  timeline.innerHTML = '';
  
  if (currentUser.visitedPois.length === 0) {
    timeline.innerHTML = `<div style="color:var(--text-secondary);font-size:0.85rem;padding:10px 0;">No sights checked-in yet. Visit landmarks to build your timeline!</div>`;
  } else {
    currentUser.visitedPois.forEach(poiId => {
      // Find POI reference
      let poi = window.SEED_ATTRACTIONS.find(p => p.id === poiId);
      if (!poi) {
        // Search procedural stores
        const citiesStore = localStorage.getItem('globeroutes_proc_cities');
        if (citiesStore) {
          const list = JSON.parse(citiesStore);
          for (let c of list) {
            const data = getSavedProceduralCityData(c.id);
            if (data) {
              const match = data.attractions.find(p => p.id === poiId);
              if (match) { poi = match; break; }
            }
          }
        }
      }
      
      if (poi) {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
          <span class="timeline-dot" style="background-color:var(--tier-${poi.fameTier});box-shadow:var(--glow-${poi.fameTier});"></span>
          <div style="font-size:0.9rem;font-weight:600;">${poi.name}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">Category: ${poi.category} (${getTierRepresentation(poi.fameTier)})</div>
        `;
        timeline.appendChild(item);
      }
    });
  }
  
  // Render Gamified Achievements Badges
  renderAchievementsBadges();
}

function renderAchievementsBadges() {
  const container = document.getElementById('journalBadges');
  container.innerHTML = '';
  
  const totalVisited = currentUser.visitedPois.length;
  
  // Count visited Red tier landmarks
  let redCount = 0;
  let blueCount = 0;
  
  currentUser.visitedPois.forEach(poiId => {
    const poi = window.SEED_ATTRACTIONS.find(p => p.id === poiId);
    if (poi) {
      if (poi.fameTier === 'red') redCount++;
      if (poi.fameTier === 'blue') blueCount++;
    }
  });
  
  const achievements = [
    {
      title: "Wanderer",
      desc: "Check-in at your first site",
      unlocked: totalVisited >= 1,
      icon: "compass"
    },
    {
      title: "Red Titan",
      desc: "Explore 2+ iconic World wonders",
      unlocked: redCount >= 2,
      icon: "award"
    },
    {
      title: "Gem Hunter",
      desc: "Find 2+ Blue hidden gems",
      unlocked: blueCount >= 2,
      icon: "sparkles"
    }
  ];
  
  achievements.forEach(ach => {
    const box = document.createElement('div');
    box.className = 'glass';
    box.style.padding = '12px 6px';
    box.style.textAlign = 'center';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.alignItems = 'center';
    box.style.gap = '6px';
    box.style.opacity = ach.unlocked ? '1' : '0.35';
    box.style.border = ach.unlocked ? '1px solid rgba(255, 215, 0, 0.25)' : '1px solid var(--border-glass)';
    
    box.innerHTML = `
      <i data-lucide="${ach.icon}" style="width:24px;color:${ach.unlocked ? '#ffd700' : 'var(--text-secondary)'};"></i>
      <div style="font-size:0.75rem;font-weight:700;">${ach.title}</div>
      <div style="font-size:0.6rem;color:var(--text-secondary);line-height:1.2;">${ach.desc}</div>
    `;
    container.appendChild(box);
  });
  
  lucide.createIcons();
}

// ================= SPOTLIGHT PROCEDURALS =================

function setDailySpotlight() {
  const spotlights = [
    "kyoto_otagi",
    "ny_pdt",
    "paris_thermopyles",
    "nice_cascade",
    "agra_sheroes"
  ];
  
  // Pick one preseeded gem based on local time day of the year
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const selectedId = spotlights[dayOfYear % spotlights.length];
  
  const poi = window.SEED_ATTRACTIONS.find(p => p.id === selectedId);
  if (poi) {
    document.getElementById('spotlightImage').style.backgroundImage = `url('${poi.images[0]}')`;
    document.getElementById('spotlightName').textContent = poi.name;
    document.getElementById('spotlightTagline').textContent = poi.tagline;
    
    // Save spotlight POI globally to invoke details on click
    window.dailySpotlightPoiId = selectedId;
  }
}

function showSpotlightPOIDetails() {
  if (window.dailySpotlightPoiId) {
    const poi = window.SEED_ATTRACTIONS.find(p => p.id === window.dailySpotlightPoiId);
    if (poi) {
      const isBlue = poi.fameTier === 'blue';
      if (isBlue && (!currentUser || !currentUser.isPremium)) {
        openPricingOverlay();
      } else {
        // Focus first
        navigateCity(poi.cityId);
        showPoiDetails(poi.id);
      }
    }
  }
}

// ================= CUSTOM UTILITIES =================

/**
 * Creates sliding glass notification toast at the top-right corner
 */
function showNotification(message, type = "info") {
  const toast = document.createElement('div');
  toast.className = 'glass';
  toast.style.position = 'fixed';
  toast.style.top = '100px';
  toast.style.right = '20px';
  toast.style.padding = '14px 24px';
  toast.style.zIndex = '9999';
  toast.style.animation = 'fadeIn 0.3s ease-out forwards';
  toast.style.fontSize = '0.9rem';
  toast.style.fontWeight = '600';
  toast.style.pointerEvents = 'none';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '8px';
  
  let color = 'var(--tier-blue)';
  let icon = 'info';
  
  if (type === 'success') { color = 'var(--tier-green)'; icon = 'check-circle'; }
  if (type === 'warning') { color = 'var(--tier-orange)'; icon = 'alert-triangle'; }
  
  toast.style.borderLeft = `4px solid ${color}`;
  toast.innerHTML = `<i data-lucide="${icon}" style="width:18px;color:${color}"></i> ${message}`;
  
  document.body.appendChild(toast);
  lucide.createIcons();
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Toggles the slidable/adjustable navigation bar visibility
 */
function toggleNavbarCollapse(event) {
  if (event) event.stopPropagation();
  const header = document.querySelector('header.glass-header');
  if (header) {
    header.classList.toggle('collapsed');
  }
}
window.toggleNavbarCollapse = toggleNavbarCollapse;

/**
 * Toggles the slidable/adjustable left sidebar visibility
 */
function toggleSidebarCollapse(event) {
  if (event) event.stopPropagation();
  const container = document.querySelector('.app-container');
  if (container) {
    container.classList.toggle('sidebar-collapsed');
    
    // Invalidate map size after transition finishes to prevent layout issues
    setTimeout(() => {
      if (typeof map !== 'undefined' && map) {
        map.invalidateSize({ animate: true });
      }
    }, 400); // matches the CSS transition duration of 0.4s
  }
}
window.toggleSidebarCollapse = toggleSidebarCollapse;

// ================= CUSTOM ROUTING UI LOGIC =================
let routeStartLatLng = null;
let routeEndLatLng = null;
let startDebounce = null;
let endDebounce = null;
let activeRouteCoordinates = null;
let currentTravelMode = 'road';
let customRouteLine = null;
let routeStartMarker = null;
let routeEndMarker = null;
let routeStartCountry = "";
let routeEndCountry = "";

function initCustomRoutingEvents() {
  const startInput = document.getElementById('routeStartInput');
  const endInput = document.getElementById('routeEndInput');

  if (startInput && endInput) {
    startInput.addEventListener('input', (e) => {
      clearTimeout(startDebounce);
      const val = e.target.value;
      if (val.length < 3) {
        document.getElementById('routeStartSuggestions').style.display = 'none';
        return;
      }
      startDebounce = setTimeout(() => fetchSuggestions(val, 'start'), 400);
    });

    endInput.addEventListener('input', (e) => {
      clearTimeout(endDebounce);
      const val = e.target.value;
      if (val.length < 3) {
        document.getElementById('routeEndSuggestions').style.display = 'none';
        return;
      }
      endDebounce = setTimeout(() => fetchSuggestions(val, 'end'), 400);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#customRoutingPanel')) {
        const startSugg = document.getElementById('routeStartSuggestions');
        const endSugg = document.getElementById('routeEndSuggestions');
        if (startSugg) startSugg.style.display = 'none';
        if (endSugg) endSugg.style.display = 'none';
      }
    });

    const startBtn = document.getElementById('startRoutingBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        calculateAndDisplayRoute();
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomRoutingEvents);
} else {
  initCustomRoutingEvents();
}

async function fetchSuggestions(query, type) {
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
    const data = await res.json();
    renderSuggestions(data.results || [], type);
  } catch (e) {
    console.error("Geocoding failed", e);
  }
}

function renderSuggestions(data, type) {
  const container = document.getElementById(type === 'start' ? 'routeStartSuggestions' : 'routeEndSuggestions');
  const input = document.getElementById(type === 'start' ? 'routeStartInput' : 'routeEndInput');
  if (!container || !input) return;
  
  container.innerHTML = '';
  
  if (!data || data.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  data.forEach(place => {
    const el = document.createElement('div');
    el.className = 'suggestion-item';
    
    // Construct a beautiful display name
    let displayName = place.name;
    if (place.admin1) displayName += `, ${place.admin1}`;
    if (place.country) displayName += `, ${place.country}`;
    
    el.textContent = displayName;
    el.onclick = () => {
      input.value = place.name;
      const countryName = place.country || "";
      
      if (type === 'start') {
        routeStartCountry = countryName;
        routeStartLatLng = L.latLng(place.latitude, place.longitude);
        if (routeStartMarker) {
          map.removeLayer(routeStartMarker);
        }
        routeStartMarker = L.marker(routeStartLatLng).addTo(map).bindPopup("Start: " + place.name).openPopup();
      } else {
        routeEndCountry = countryName;
        routeEndLatLng = L.latLng(place.latitude, place.longitude);
        if (routeEndMarker) {
          map.removeLayer(routeEndMarker);
        }
        routeEndMarker = L.marker(routeEndLatLng).addTo(map).bindPopup("Destination: " + place.name).openPopup();
      }
      container.style.display = 'none';
      
      if (typeof map !== 'undefined' && map) {
        map.setView([place.latitude, place.longitude], 14, { animate: true });
      }
    };
    container.appendChild(el);
  });
  
  container.style.display = 'block';
}

// --- AMENITIES & TRAVEL MODE HANDLERS ---

function onTravelModeChange(mode) {
  currentTravelMode = mode;
  if (routeStartLatLng && routeEndLatLng) {
    calculateAndDisplayRoute();
  } else {
    showNotification(`Switched transport to: ${mode === 'road' ? 'Road Transit' : mode === 'train' ? 'Railway Transit' : 'Airway Transit'}`, 'info');
  }
}
window.onTravelModeChange = onTravelModeChange;

function onAmenityToggleChange() {
  if (activeRouteCoordinates && currentTravelMode === 'road') {
    generateAmenitiesAlongRoute(activeRouteCoordinates);
  } else if (currentTravelMode !== 'road') {
    showNotification("Roadside amenities are hidden during air/rail travel.", "info");
  }
}
window.onAmenityToggleChange = onAmenityToggleChange;

let amenityMarkers = [];

function clearAmenityMarkers() {
  amenityMarkers.forEach(m => map.removeLayer(m));
  amenityMarkers = [];
}

function clearCustomRouteLine() {
  if (customRouteLine) {
    map.removeLayer(customRouteLine);
    customRouteLine = null;
  }
}
window.clearCustomRouteLine = clearCustomRouteLine;

function clearRoutingPlanner() {
  const startInput = document.getElementById('routeStartInput');
  const endInput = document.getElementById('routeEndInput');
  if (startInput) startInput.value = '';
  if (endInput) endInput.value = '';
  
  routeStartLatLng = null;
  routeEndLatLng = null;
  routeStartCountry = "";
  routeEndCountry = "";
  
  if (routeStartMarker) {
    map.removeLayer(routeStartMarker);
    routeStartMarker = null;
  }
  if (routeEndMarker) {
    map.removeLayer(routeEndMarker);
    routeEndMarker = null;
  }
  
  clearCustomRouteLine();
  if (routingControl) {
    routingControl.setWaypoints([]);
  }
  
  clearAmenityMarkers();
  activeRouteCoordinates = null;
  
  const statsContainer = document.getElementById('routeStatsContainer');
  if (statsContainer) {
    statsContainer.innerHTML = '';
    statsContainer.style.display = 'none';
  }
  
  showNotification("Route planner and map markers reset successfully.", "info");
}
window.clearRoutingPlanner = clearRoutingPlanner;

function getRoadRoutePoints(latlng1, latlng2) {
  const points = [];
  const steps = 40;
  const lat1 = latlng1.lat;
  const lng1 = latlng1.lng;
  const lat2 = latlng2.lat;
  const lng2 = latlng2.lng;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const baseLat = lat1 + (lat2 - lat1) * t;
    const baseLng = lng1 + (lng2 - lng1) * t;
    // Mild road winding effect (different from train winding)
    const offset = Math.sin(t * Math.PI * 4) * 0.015;
    points.push([baseLat + offset, baseLng - offset]);
  }
  return points;
}

function getFlightArcPoints(latlng1, latlng2) {
  const points = [];
  const steps = 60;
  
  const lat1 = latlng1.lat;
  const lng1 = latlng1.lng;
  const lat2 = latlng2.lat;
  const lng2 = latlng2.lng;
  
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  
  const offsetScale = 0.18; // curve height factor
  const ctrlLat = midLat - dLng * offsetScale;
  const ctrlLng = midLng + dLat * offsetScale;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1-t)*(1-t)*lat1 + 2*(1-t)*t*ctrlLat + t*t*lat2;
    const interpolatedLng = (1-t)*(1-t)*lng1 + 2*(1-t)*t*ctrlLng + t*t*lng2;
    points.push([lat, interpolatedLng]);
  }
  return points;
}

function getTrainRoutePoints(latlng1, latlng2) {
  const points = [];
  const steps = 40;
  const lat1 = latlng1.lat;
  const lng1 = latlng1.lng;
  const lat2 = latlng2.lat;
  const lng2 = latlng2.lng;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const baseLat = lat1 + (lat2 - lat1) * t;
    const baseLng = lng1 + (lng2 - lng1) * t;
    // Scenic winding railway effect
    const offset = Math.sin(t * Math.PI * 3) * 0.04;
    points.push([baseLat + offset, baseLng - offset]);
  }
  return points;
}

function getCountryGroup(country) {
  if (!country) return null;
  const c = country.toLowerCase().trim();
  
  // North America
  if (c.includes("united states") || c.includes("usa") || c.includes("canada") || c.includes("mexico")) {
    return "north_america";
  }
  
  // Europe
  const europeans = ["france", "italy", "spain", "germany", "united kingdom", "uk", "netherlands", 
                     "belgium", "switzerland", "austria", "portugal", "greece", "poland", "sweden", 
                     "norway", "finland", "ireland", "denmark", "croatia", "monaco", "andorra",
                     "san marino", "vatican", "luxembourg", "czech", "slovakia", "hungary", 
                     "romania", "bulgaria", "slovenia", "estonia", "latvia", "lithuania", "ukraine",
                     "belarus", "moldova", "albania", "serbia", "montenegro", "kosovo", "macedonia",
                     "bosnia", "iceland", "malta", "cyprus"];
  for (let eur of europeans) {
    if (c.includes(eur)) return "europe";
  }
  
  // South America
  const southAmericans = ["brazil", "argentina", "chile", "colombia", "peru", "ecuador", "venezuela", "bolivia", "paraguay", "uruguay"];
  for (let sa of southAmericans) {
    if (c.includes(sa)) return "south_america";
  }
  
  // Isolated island nations / regions
  const isolatedIslands = ["japan", "australia", "new zealand", "madagascar", "sri lanka", 
                           "philippines", "taiwan", "iceland", "hawaii", "greenland", "indonesia"];
  for (let isl of isolatedIslands) {
    if (c.includes(isl)) return "isolated_" + isl;
  }
  
  return c; // otherwise return the country name itself
}

function checkRouteFeasibility(mode, startCountry, endCountry, startLatLng, endLatLng) {
  if (mode === 'flight') return { possible: true };
  
  // If countries are missing, fallback to coordinate/distance checks
  if (!startCountry || !endCountry) {
    const distanceMeters = startLatLng.distanceTo(endLatLng);
    if (distanceMeters > 3500000) { // Over 3500km usually signifies oceans or massive continental separation
      return {
        possible: false,
        reason: `Intercontinental travel by ${mode === 'road' ? 'Road' : 'Train'} is impossible across this distance. Please switch to Airways ✈️.`
      };
    }
    return { possible: true };
  }
  
  const g1 = getCountryGroup(startCountry);
  const g2 = getCountryGroup(endCountry);
  
  if (g1 === g2) return { possible: true };
  
  // UK and Europe is possible via Channel Tunnel
  if ((g1 === 'europe' && g2.includes('united kingdom')) || (g2 === 'europe' && g1.includes('united kingdom'))) {
    return { possible: true };
  }
  
  // If either is an isolated island, land transit is impossible
  if (g1.startsWith("isolated_") || g2.startsWith("isolated_")) {
    const islandName = g1.startsWith("isolated_") ? startCountry : endCountry;
    return {
      possible: false,
      reason: `Land travel by ${mode === 'road' ? 'Road' : 'Train'} is impossible because ${islandName} is an island with no road or rail bridges.`
    };
  }
  
  // Different continental regions
  return {
    possible: false,
    reason: `Transit by ${mode === 'road' ? 'Road' : 'Train'} is impossible between ${startCountry} and ${endCountry} due to lack of contiguous railway or road connections. Please switch to Airways ✈️.`
  };
}

function calculateAndDisplayRoute() {
  if (!routeStartLatLng || !routeEndLatLng) {
    showNotification("Please select both a start and destination from the autocomplete suggestions.", "warning");
    return;
  }
  
  clearCustomRouteLine();
  clearAmenityMarkers();
  
  const feasibility = checkRouteFeasibility(currentTravelMode, routeStartCountry, routeEndCountry, routeStartLatLng, routeEndLatLng);
  if (!feasibility.possible) {
    showNotification(feasibility.reason, "warning");
    
    activeRouteCoordinates = null;
    if (routingControl) {
      try {
        routingControl.setWaypoints([]);
      } catch (e) {}
    }
    
    const statsContainer = document.getElementById('routeStatsContainer');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div style="background:rgba(255, 59, 48, 0.1); border:1px solid rgba(255, 59, 48, 0.3); padding:12px; border-radius:8px; margin-top:8px; font-size:0.8rem; line-height:1.4; color:#ff453a;">
          ⚠️ <b>Route Impossible:</b> ${feasibility.reason}
        </div>
      `;
      statsContainer.style.display = 'block';
    }
    return;
  }
  
  if (currentTravelMode === 'road') {
    showNotification("Mapping road travel route...", "info");
    const roadPoints = getRoadRoutePoints(routeStartLatLng, routeEndLatLng);
    
    // Draw solid premium blue route line with inner glowing dash
    const roadBase = L.polyline(roadPoints, {
      color: '#1e3a8a',
      weight: 6,
      opacity: 0.7
    });
    
    const roadInner = L.polyline(roadPoints, {
      color: '#3b82f6',
      weight: 3,
      opacity: 0.95
    });
    
    customRouteLine = L.featureGroup([roadBase, roadInner]).addTo(map);
    
    activeRouteCoordinates = roadPoints.map(p => L.latLng(p[0], p[1]));
    
    const bounds = L.latLngBounds([routeStartLatLng, routeEndLatLng]);
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
    
    // Road time calculation at 90 km/h (average driving speed)
    const distanceMeters = routeStartLatLng.distanceTo(routeEndLatLng) * 1.15; // 15% winding factor
    const timeSeconds = (distanceMeters / 1000) / 90 * 3600;
    updateRouteStats(distanceMeters, timeSeconds);
    generateAmenitiesAlongRoute(activeRouteCoordinates);
    
    if (routingControl) {
      try {
        routingControl.setWaypoints([routeStartLatLng, routeEndLatLng]);
      } catch (e) {
        console.warn("Leaflet Routing Machine failed, using simulated route:", e);
      }
    }
  } else if (currentTravelMode === 'flight') {
    if (routingControl) routingControl.setWaypoints([]); // clear road line
    
    showNotification("Mapping airways direct flight path...", "info");
    const arcPoints = getFlightArcPoints(routeStartLatLng, routeEndLatLng);
    
    // Draw curved glowing flight path
    customRouteLine = L.polyline(arcPoints, {
      color: '#00f2ff',
      weight: 4,
      dashArray: '10, 8',
      opacity: 0.95
    }).addTo(map);
    
    activeRouteCoordinates = arcPoints.map(p => L.latLng(p[0], p[1]));
    
    const bounds = L.latLngBounds([routeStartLatLng, routeEndLatLng]);
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
    
    // Flight time calculation at 800 km/h
    const distanceMeters = routeStartLatLng.distanceTo(routeEndLatLng);
    const timeSeconds = (distanceMeters / 1000) / 800 * 3600;
    updateRouteStats(distanceMeters, timeSeconds);
    
  } else if (currentTravelMode === 'train') {
    if (routingControl) routingControl.setWaypoints([]); // clear road line
    
    showNotification("Mapping railways winding track...", "info");
    const trackPoints = getTrainRoutePoints(routeStartLatLng, routeEndLatLng);
    
    // Layered tracks styling (black outline + white/grey inner dash)
    const trackBase = L.polyline(trackPoints, {
      color: '#374151',
      weight: 6,
      opacity: 0.85
    });
    
    const trackDashes = L.polyline(trackPoints, {
      color: '#ffffff',
      weight: 3,
      dashArray: '8, 8',
      opacity: 0.95
    });
    
    customRouteLine = L.featureGroup([trackBase, trackDashes]).addTo(map);
    
    activeRouteCoordinates = trackPoints.map(p => L.latLng(p[0], p[1]));
    
    const bounds = L.latLngBounds([routeStartLatLng, routeEndLatLng]);
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
    
    // Train time calculation at 80 km/h
    const distanceMeters = routeStartLatLng.distanceTo(routeEndLatLng) * 1.25; // 25% track winding factor
    const timeSeconds = (distanceMeters / 1000) / 80 * 3600;
    updateRouteStats(distanceMeters, timeSeconds);
  }
}

function generateAmenitiesAlongRoute(coords) {
  clearAmenityMarkers();
  if (!coords || coords.length < 20 || currentTravelMode !== 'road') return;
  
  const showRest = document.getElementById('toggleRestAmenities')?.checked;
  const showFuel = document.getElementById('toggleFuelAmenities')?.checked;
  const showEv = document.getElementById('toggleEvAmenities')?.checked;
  
  const totalPoints = coords.length;
  // Sample at 15%, 35%, 55%, 75%, and 90% of the route coordinates
  const sampleRatios = [0.15, 0.35, 0.55, 0.75, 0.90];
  
  const restNames = ["Highway Nest & Diner", "Sethi Rest House & Motels", "Punjabi Dhaba & Rest Stops", "Golden Oasis Highway Motel", "Sai Family Rest Plaza"];
  const fuelNames = ["Indian Oil Plaza", "HP Fuel Center", "Bharat Petroleum Outlet", "Shell Select Station", "Reliance Jio-bp Charging & Fuel"];
  const evNames = ["TATA Power EZ EV Hub", "Jio-bp Pulse Fast EV Charger", "KIRANA EV charging point", "Zeon Supercharger", "Sunspeed Fast Charger"];
  
  sampleRatios.forEach((ratio, index) => {
    const coordIndex = Math.floor(totalPoints * ratio);
    const baseLatLng = coords[coordIndex];
    
    // Add offset so amenities sit on sides of the road
    const latOffset = (Math.sin(index * 45) * 0.001);
    const lngOffset = (Math.cos(index * 45) * 0.001);
    
    const lat = baseLatLng.lat + latOffset;
    const lng = baseLatLng.lng + lngOffset;
    const rating = (4.0 + (index % 10) / 10).toFixed(1);
    
    if (showRest) {
      const name = restNames[index % restNames.length];
      plotAmenity(lat + 0.0003, lng + 0.0003, '🏨', name, 'Rest House & Motel', rating, '#ff7a45');
    }
    
    if (showFuel) {
      const name = fuelNames[index % fuelNames.length];
      plotAmenity(lat - 0.0003, lng + 0.0003, '⛽', name, 'Petrol Pump & Rest Stop', rating, '#ffc53d');
    }
    
    if (showEv) {
      const name = evNames[index % evNames.length];
      plotAmenity(lat + 0.0003, lng - 0.0003, '⚡', name, 'EV Charging Hub', rating, '#52c41a');
    }
  });
  
  if (showRest || showFuel || showEv) {
    showNotification("📍 Plotted highway amenities (rest stops, petrol pumps, EV chargers) along your route!", "success");
  }
}

function plotAmenity(lat, lng, emoji, name, type, rating, color) {
  const markerHtml = `
    <div style="background-color:${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 0.95rem; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)';" onmouseout="this.style.transform='scale(1)';">
      ${emoji}
    </div>`;
    
  const customIcon = L.divIcon({
    html: markerHtml,
    className: 'amenity-div-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
  
  const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
  
  const popupContent = `
    <div style="font-family:'Inter';padding:8px;min-width:180px;background:#141923;color:white;border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
      <h4 style="margin:0 0 4px 0;font-size:0.9rem;color:${color};font-weight:700;">${name}</h4>
      <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:6px;">${type}</div>
      <div style="display:flex;align-items:center;gap:6px;font-size:0.75rem;font-weight:700;">
        <span style="color:#ffc53d;">★ ${rating}</span>
        <span style="color:var(--text-secondary);font-weight:normal;">• Clean Toilets & Snacks</span>
      </div>
    </div>`;
    
  marker.bindPopup(popupContent);
  amenityMarkers.push(marker);
}

function updateRouteStats(distanceMeters, timeSeconds) {
  const statsContainer = document.getElementById('routeStatsContainer');
  if (!statsContainer) return;
  
  const distanceKm = (distanceMeters / 1000).toFixed(1);
  let durationText = "";
  
  const hrs = Math.floor(timeSeconds / 3600);
  const mins = Math.round((timeSeconds % 3600) / 60);
  
  if (hrs > 0) {
    durationText = `${hrs} hr ${mins} min`;
  } else {
    durationText = `${mins} min`;
  }
  
  let label = "Distance";
  let modeIcon = "🚗";
  if (currentTravelMode === 'flight') {
    label = "Flight Distance";
    modeIcon = "✈️";
  } else if (currentTravelMode === 'train') {
    label = "Rail Distance";
    modeIcon = "🚂";
  }
  
  statsContainer.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); margin-top:8px;">
      <div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">${label}</div>
        <div style="font-size:0.95rem; font-weight:700; color:var(--tier-blue);">${distanceKm} km</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.75rem; color:var(--text-secondary);">${modeIcon} Est. Time</div>
        <div style="font-size:0.95rem; font-weight:700; color:var(--tier-green);">${durationText}</div>
      </div>
    </div>
  `;
  statsContainer.style.display = 'block';
}

function toggleRoutePlannerPanel() {
  const panel = document.getElementById('customRoutingPanel');
  
  // If manual planner is already open, close it instead of showing the modal
  if (panel && panel.style.display === 'flex') {
    openManualPlanner(); // This will toggle it closed
    return;
  }

  // Show the planner selection modal first
  const selModal = document.getElementById('plannerSelectionModal');
  if (selModal) {
    selModal.style.display = 'flex';
    setTimeout(() => selModal.classList.add('modal-visible'), 10);
    return;
  }
  // Fallback: open manual planner directly if modal not found
  openManualPlanner();
}
window.toggleRoutePlannerPanel = toggleRoutePlannerPanel;

function openManualPlanner() {
  // Close selection modal if open
  closePlannerSelectionModal();
  
  const panel = document.getElementById('customRoutingPanel');
  const btn = document.getElementById('toggleRoutePlannerBtn');
  if (!panel || !btn) return;
  
  if (panel.style.display === 'none' || panel.style.display === '') {
    panel.style.display = 'flex';
    btn.style.background = 'rgba(0, 242, 255, 0.25)';
    btn.style.borderColor = '#00f2ff';
    btn.style.color = '#ffffff';
    btn.style.textShadow = '0 0 10px rgba(0, 242, 255, 0.8)';
    showNotification("Opened Manual Route Planner", "info");
  } else {
    panel.style.display = 'none';
    btn.style.background = 'rgba(0, 242, 255, 0.08)';
    btn.style.borderColor = 'rgba(0, 242, 255, 0.4)';
    btn.style.color = '#00f2ff';
    btn.style.textShadow = '0 0 8px rgba(0, 242, 255, 0.4)';
    clearRoutingPlanner();
  }
}
window.openManualPlanner = openManualPlanner;

function closePlannerSelectionModal() {
  const selModal = document.getElementById('plannerSelectionModal');
  if (selModal) {
    selModal.classList.remove('modal-visible');
    setTimeout(() => { selModal.style.display = 'none'; }, 300);
  }
}
window.closePlannerSelectionModal = closePlannerSelectionModal;

// ==========================================
// INTEGRATED AURA AI ASSISTANT LOGIC
// ==========================================

let integratedAuraHistory = [];
let isAuraLoading = false;
let auraRecognition = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function openIntegratedAura() {
  closePlannerSelectionModal();
  const panel = document.getElementById('integratedAuraPanel');
  if (panel) {
    panel.style.display = 'flex';
    // Ensure icon exists
    if(typeof lucide !== 'undefined') lucide.createIcons();
    showNotification("Aura Assistant Ready", "info");
  }
}
window.openIntegratedAura = openIntegratedAura;

function closeIntegratedAura() {
  const panel = document.getElementById('integratedAuraPanel');
  if (panel) panel.style.display = 'none';
}
window.closeIntegratedAura = closeIntegratedAura;

function toggleExpandIntegratedAura() {
  const panel = document.getElementById('integratedAuraPanel');
  const chatWindow = document.getElementById('integratedAuraChatWindow');
  const icon = document.getElementById('auraExpandIcon');
  
  if (!panel) return;
  
  const isExpanded = panel.style.width === '500px';
  
  if (isExpanded) {
    // Collapse
    panel.style.width = '340px';
    panel.style.height = 'auto';
    if(chatWindow) {
      chatWindow.style.minHeight = '250px';
      chatWindow.style.maxHeight = '400px';
    }
    if (icon) {
      icon.setAttribute('data-lucide', 'maximize-2');
    }
  } else {
    // Expand
    panel.style.width = '500px';
    if(chatWindow) {
      chatWindow.style.minHeight = '450px';
      chatWindow.style.maxHeight = 'calc(100vh - 250px)';
    }
    if (icon) {
      icon.setAttribute('data-lucide', 'minimize-2');
    }
  }
  
  if(typeof lucide !== 'undefined') lucide.createIcons();
}

function sendIntegratedAuraQuick(text) {
  const input = document.getElementById('integratedAuraInput') || document.getElementById('auraUserInput');
  if (input) {
    input.value = text;
    if (window.AuraV2UI) {
      window.AuraV2UI.handleSendMessage();
    }
  }
}
window.sendIntegratedAuraQuick = sendIntegratedAuraQuick;
window.toggleExpandIntegratedAura = toggleExpandIntegratedAura;

function handleIntegratedAuraKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (window.AuraV2UI) window.AuraV2UI.handleSendMessage();
  }
}
window.handleIntegratedAuraKeydown = handleIntegratedAuraKeydown;

function toggleAuraVoiceInput() {
  if (window.AuraV2UI) {
    window.AuraV2UI.toggleVoiceInput();
  } else {
    showNotification("Aura V2 is not initialized.", "error");
  }
}
window.toggleAuraVoiceInput = toggleAuraVoiceInput;

async function sendIntegratedAuraMessage() {
  if (window.AuraV2UI) {
    return window.AuraV2UI.handleSendMessage();
  }
}
window.sendIntegratedAuraMessage = sendIntegratedAuraMessage;

// Listen for map actions emitted by AuraV2UI
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'aura-map-action') {
    const action = event.data.data;
    const actionType = action.type || action.action;

    if (actionType === 'plot-destination' && action.destination) {
      searchAndPlotDestination(action.destination);
    } else if (actionType === 'draw-routes' || actionType === 'draw-route') {
      const routes = action.routes;
      if (routes && routes.length > 0) {
        const roadRoute = routes.find(r => r.type === 'road' && r.geometry);
        if (roadRoute && roadRoute.geometry && window.L) {
          const geoJsonLayer = L.geoJSON(roadRoute.geometry, {
            style: { color: '#8b5cf6', weight: 5, opacity: 0.8 }
          });
          if (window.map) {
             if (activeRouteLine) window.map.removeLayer(activeRouteLine);
             activeRouteLine = geoJsonLayer;
             geoJsonLayer.addTo(window.map);
             window.map.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] });
             showNotification(`Drawn road route from ${action.source} to ${action.destination}`, "success");
          }
        } else {
          plotRouteBetweenCities(action.source, action.destination);
        }
      } else {
        plotRouteBetweenCities(action.source, action.destination);
      }
    }
  }
});

async function plotRouteBetweenCities(sourceStr, destStr) {
  try {
    const srcRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(sourceStr)}`);
    const srcData = await srcRes.json();
    const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destStr)}`);
    const destData = await destRes.json();

    if (srcData.length > 0 && destData.length > 0) {
      const origin = { lat: parseFloat(srcData[0].lat), lng: parseFloat(srcData[0].lon) };
      const dest = { lat: parseFloat(destData[0].lat), lng: parseFloat(destData[0].lon) };
      drawTravelRoute(origin, dest);
      showNotification(`Showing route from ${sourceStr} to ${destStr}`, "success");
    } else {
      searchAndPlotDestination(destStr);
    }
  } catch (err) {
    console.error(err);
    searchAndPlotDestination(destStr);
  }
}

async function searchAndPlotDestination(destName) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destName)}`);
    const results = await res.json();
    if (results && results.length > 0) {
      const lat = parseFloat(results[0].lat);
      const lon = parseFloat(results[0].lon);
      if(map) {
         map.setView([lat, lon], 10);
         showNotification(`Moved map to ${destName}`, "info");
      }
    }
  } catch(e) {
    console.error('Failed to geocode destination', e);
  }
}

