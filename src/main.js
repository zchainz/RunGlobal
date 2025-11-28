import './style.css';
import { Router } from './components/router.js';
import { authService } from './lib/auth.js';
import {
  renderHome,
  renderLogin,
  renderRegister,
  renderActivity,
  renderLeaderboard,
  renderAbout
} from './components/pages.js';

let currentUser = null;
const router = new Router();

function renderHeader(user) {
  return `
    <header class="header">
      <div class="container header-content">
        <a href="/" data-link class="logo">🏃 RaceMe</a>
        <nav class="nav">
          ${user ? `
            <a href="/" data-link class="nav-link">Home</a>
            <a href="/activity" data-link class="nav-link">Activity</a>
            <a href="/leaderboard" data-link class="nav-link">Leaderboard</a>
            <a href="/about" data-link class="nav-link">About</a>
            <button id="logout-btn" class="btn btn-danger">Logout</button>
          ` : `
            <a href="/about" data-link class="nav-link">About</a>
            <a href="/login" data-link class="btn btn-primary">Login</a>
          `}
        </nav>
      </div>
    </header>
  `;
}

async function render() {
  const app = document.querySelector('#app');
  const path = window.location.pathname;

  app.innerHTML = `
    ${renderHeader(currentUser)}
    <main class="main-content">
      <div class="loading">Loading...</div>
    </main>
  `;

  const mainContent = app.querySelector('.main-content');

  try {
    let content = '';

    if (path === '/login' && !currentUser) {
      content = renderLogin();
      mainContent.innerHTML = content;
      setupLoginForm();
    } else if (path === '/register' && !currentUser) {
      content = renderRegister();
      mainContent.innerHTML = content;
      setupRegisterForm();
    } else if (path === '/about') {
      content = renderAbout();
      mainContent.innerHTML = content;
    } else if (currentUser) {
      if (path === '/activity') {
        content = await renderActivity(currentUser);
      } else if (path === '/leaderboard') {
        content = await renderLeaderboard();
      } else {
        content = await renderHome(currentUser);
      }
      mainContent.innerHTML = content;
    } else {
      content = await renderHome(null);
      mainContent.innerHTML = content;
    }

    if (currentUser) {
      const logoutBtn = document.querySelector('#logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
      }
    }
  } catch (error) {
    console.error('Render error:', error);
    mainContent.innerHTML = `
      <div class="container">
        <div class="card">
          <h2 style="color: var(--danger);">Error</h2>
          <p>${error.message}</p>
        </div>
      </div>
    `;
  }
}

function setupLoginForm() {
  const form = document.querySelector('#login-form');
  const errorDiv = document.querySelector('#login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');

    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      await authService.signIn(email, password);
      router.navigate('/');
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.classList.remove('hidden');
    }
  });
}

function setupRegisterForm() {
  const form = document.querySelector('#register-form');
  const errorDiv = document.querySelector('#register-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');

    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const username = formData.get('username');
    const fullname = formData.get('fullname');

    try {
      await authService.signUp(email, password, username, fullname);
      router.navigate('/');
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.classList.remove('hidden');
    }
  });
}

async function handleLogout() {
  try {
    await authService.signOut();
    router.navigate('/');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

async function init() {
  currentUser = await authService.getCurrentUser();

  authService.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    await render();
  });

  router.addRoute('/', render);
  router.addRoute('/login', render);
  router.addRoute('/register', render);
  router.addRoute('/activity', render);
  router.addRoute('/leaderboard', render);
  router.addRoute('/about', render);

  router.start();
}

init();
