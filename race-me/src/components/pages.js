import { authService } from '../lib/auth.js';
import { db } from '../lib/database.js';

export async function renderHome(user) {
  if (!user) {
    return `
      <div class="container">
        <div class="hero">
          <h1>Welcome to RaceMe</h1>
          <p>Compete with runners worldwide. Track your progress. Win races.</p>
          <div style="display: flex; gap: 16px; justify-content: center;">
            <a href="/login" data-link class="btn btn-primary" style="background: white; color: var(--primary);">Get Started</a>
            <a href="/about" data-link class="btn btn-secondary" style="background: rgba(255,255,255,0.2); color: white;">Learn More</a>
          </div>
        </div>

        <div class="grid grid-3">
          <div class="card stat-card">
            <h3 class="card-title">Track Activity</h3>
            <p class="card-text">Monitor your runs, distance, and performance metrics in real-time.</p>
          </div>
          <div class="card stat-card">
            <h3 class="card-title">Find Opponents</h3>
            <p class="card-text">Get matched with runners of similar skill levels for fair competition.</p>
          </div>
          <div class="card stat-card">
            <h3 class="card-title">Compete & Win</h3>
            <p class="card-text">Race against others and climb the global leaderboard.</p>
          </div>
        </div>
      </div>
    `;
  }

  const profile = await db.getProfile(user.id);
  const races = await db.getUserRaces(user.id);

  return `
    <div class="container">
      <div class="hero" style="background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);">
        <h1>Welcome back, ${profile?.full_name || 'Runner'}!</h1>
        <p>Ready to race?</p>
      </div>

      <div class="grid grid-3">
        <div class="card stat-card">
          <div class="stat-value">${profile?.avg_speed?.toFixed(1) || '0.0'}</div>
          <div class="stat-label">Avg Speed (mph)</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">${profile?.avg_distance?.toFixed(1) || '0.0'}</div>
          <div class="stat-label">Avg Distance (mi)</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">${profile?.rank || 0}</div>
          <div class="stat-label">Rank</div>
        </div>
      </div>

      <div style="margin-top: 48px;">
        <h2 style="margin-bottom: 24px;">Recent Races</h2>
        ${races && races.length > 0 ? races.slice(0, 5).map(race => `
          <div class="race-card">
            <div class="race-info">
              <h3>${race.challenger.username} vs ${race.opponent?.username || 'Pending'}</h3>
              <p>${new Date(race.created_at).toLocaleDateString()}</p>
            </div>
            <span class="badge badge-${race.status}">${race.status}</span>
          </div>
        `).join('') : `
          <div class="empty-state">
            <div class="empty-state-icon">🏃</div>
            <p>No races yet. Start your first race!</p>
          </div>
        `}
      </div>
    </div>
  `;
}

export function renderLogin() {
  return `
    <div class="auth-container">
      <div class="card">
        <h2 class="card-title" style="text-align: center; margin-bottom: 24px;">Login to RaceMe</h2>
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" name="email" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" required>
          </div>
          <div id="login-error" class="form-error hidden"></div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">Login</button>
        </form>
        <p style="text-align: center; margin-top: 16px; color: var(--text-secondary);">
          Don't have an account? <a href="/register" data-link style="color: var(--primary);">Sign up</a>
        </p>
      </div>
    </div>
  `;
}

export function renderRegister() {
  return `
    <div class="auth-container">
      <div class="card">
        <h2 class="card-title" style="text-align: center; margin-bottom: 24px;">Create Account</h2>
        <form id="register-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" name="fullname" required>
          </div>
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-input" name="username" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" name="email" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" name="password" required minlength="6">
          </div>
          <div id="register-error" class="form-error hidden"></div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">Create Account</button>
        </form>
        <p style="text-align: center; margin-top: 16px; color: var(--text-secondary);">
          Already have an account? <a href="/login" data-link style="color: var(--primary);">Login</a>
        </p>
      </div>
    </div>
  `;
}

export async function renderActivity(user) {
  const races = await db.getUserRaces(user.id);

  return `
    <div class="container">
      <h1 style="margin-bottom: 32px;">Your Activity</h1>

      ${races && races.length > 0 ? races.map(race => `
        <div class="race-card">
          <div class="race-info">
            <h3>${race.challenger.username} vs ${race.opponent?.username || 'Pending Match'}</h3>
            <p>Created: ${new Date(race.created_at).toLocaleDateString()}</p>
            ${race.winner ? `<p style="color: var(--success); font-weight: 600;">Winner: ${race.winner.username}</p>` : ''}
          </div>
          <span class="badge badge-${race.status}">${race.status}</span>
        </div>
      `).join('') : `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <p>No activity yet. Start racing to see your activity here!</p>
        </div>
      `}
    </div>
  `;
}

export async function renderLeaderboard() {
  const profiles = await db.getAllProfiles();

  return `
    <div class="container">
      <h1 style="margin-bottom: 32px;">Leaderboard</h1>

      <div class="card">
        ${profiles && profiles.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border); text-align: left;">
                <th style="padding: 12px;">Rank</th>
                <th style="padding: 12px;">Runner</th>
                <th style="padding: 12px;">Avg Speed</th>
                <th style="padding: 12px;">Avg Distance</th>
              </tr>
            </thead>
            <tbody>
              ${profiles.map((profile, index) => `
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding: 12px; font-weight: 600;">${index + 1}</td>
                  <td style="padding: 12px;">${profile.full_name || profile.username}</td>
                  <td style="padding: 12px;">${profile.avg_speed?.toFixed(1) || '0.0'} mph</td>
                  <td style="padding: 12px;">${profile.avg_distance?.toFixed(1) || '0.0'} mi</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">🏆</div>
            <p>No runners yet. Be the first!</p>
          </div>
        `}
      </div>
    </div>
  `;
}

export function renderAbout() {
  return `
    <div class="container">
      <h1 style="margin-bottom: 32px;">About RaceMe</h1>

      <div class="card">
        <h3 class="card-title">Our Mission</h3>
        <p class="card-text">RaceMe is a fitness app that uses competition and community to generate self-discipline, motivation, and persistence. We introduce a new way of viewing workouts by adding incentives, competition, and making fitness more enjoyable.</p>

        <h3 class="card-title" style="margin-top: 24px;">Features</h3>
        <ul style="color: var(--text-secondary); margin-left: 20px;">
          <li>Activity tracking and fitness monitoring</li>
          <li>Competitive matching with runners worldwide</li>
          <li>Global leaderboard and rankings</li>
          <li>Performance analytics and insights</li>
          <li>Social connectivity with fellow runners</li>
        </ul>

        <h3 class="card-title" style="margin-top: 24px;">Get Started</h3>
        <p class="card-text">Create an account to start tracking your runs, competing with others, and improving your fitness journey!</p>
        <a href="/register" data-link class="btn btn-primary">Join Now</a>
      </div>
    </div>
  `;
}
