import crypto from 'crypto';

// In-memory user store initialized with default verified Bihar Yatra members
const users = [
  {
    id: 'user_1',
    name: 'Rahul Verma',
    email: 'rahul@biharyatra.in',
    passwordHash: hashPassword('yatra2026'),
    phone: '+91-9876543210',
    preferredDistrict: 'Patna',
    role: 'traveler',
    passportLevel: 'Level 1 - Explorer',
    createdAt: new Date().toISOString()
    
  },
  {
    id: 'user_admin',
    name: 'Admin Desk',
    email: 'admin@biharyatra.in',
    passwordHash: hashPassword('admin2026'),
    phone: '+91-612-2225418',
    preferredDistrict: 'Patna',
    role: 'admin',
    passportLevel: 'State Tourism Officer',
    createdAt: new Date().toISOString()
  }
];

// Active valid sessions: token -> { userId, expiresAt }
const activeSessions = new Map();
const invalidatedTokens = new Set();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return 'by_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Register a new user
 */
export function registerUser({ name, email, password, phone, preferredDistrict }) {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  const newUser = {
    id: 'user_' + Date.now(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    phone: phone ? phone.trim() : '',
    preferredDistrict: preferredDistrict || 'Patna',
    role: 'traveler',
    passportLevel: 'Level 1 - Explorer',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  const token = generateToken();
  activeSessions.set(token, {
    userId: newUser.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  const { passwordHash, ...userSafe } = newUser;
  return { token, user: userSafe };
}

/**
 * Log in an existing user
 */
export function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.passwordHash !== hashPassword(password)) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken();
  activeSessions.set(token, {
    userId: user.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  });

  const { passwordHash, ...userSafe } = user;
  return { token, user: userSafe };
}

/**
 * Verify token and return user
 */
export function verifyToken(token) {
  if (!token || invalidatedTokens.has(token)) return null;

  const session = activeSessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return null;
  }

  const user = users.find(u => u.id === session.userId);
  if (!user) return null;

  const { passwordHash, ...userSafe } = user;
  return userSafe;
}

/**
 * Log out and invalidate token
 */
export function logoutUser(token) {
  if (token) {
    activeSessions.delete(token);
    invalidatedTokens.add(token);
  }
  return true;
}
