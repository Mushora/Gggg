/**
 * Mushora - Admin Login Controller (Vanilla JS)
 */

import { adminLogin, isUserAdminLoggedIn, initFirebase } from './firebase.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initFirebase();

  // If already authenticated, redirect straight to dashboard
  if (isUserAdminLoggedIn()) {
    window.location.replace('admin.html');
    return;
  }

  const form = document.getElementById('adminLoginForm');
  const usernameInput = document.getElementById('adminUsername');
  const passwordInput = document.getElementById('adminPassword');
  const errorAlert = document.getElementById('loginErrorAlert');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const btnText = document.getElementById('loginBtnText');
  const btnSpinner = document.getElementById('loginBtnSpinner');
  const fillBtn = document.getElementById('fillDemoCredentialsBtn');

  if (fillBtn && usernameInput && passwordInput) {
    fillBtn.addEventListener('click', () => {
      usernameInput.value = 'admin';
      passwordInput.value = 'admin123';
      hideError();
      usernameInput.focus();
    });
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showError('Please enter both your username and password.');
      return;
    }

    // Set loading state
    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    hideError();

    try {
      const result = await adminLogin(username, password);
      if (result && result.success) {
        // Successful login
        window.location.replace('admin.html');
      } else {
        showError('Invalid administrative username or password.');
      }
    } catch (err) {
      console.warn('Login failure:', err);
      showError(err.message || 'Invalid administrative username or password.');
    } finally {
      submitBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline-block';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  });

  function showError(msg) {
    if (errorAlert) {
      errorAlert.textContent = msg;
      errorAlert.style.display = 'block';
    }
  }

  function hideError() {
    if (errorAlert) {
      errorAlert.style.display = 'none';
    }
  }
});
