const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { generateToken } = require('../utils/jwt');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authController = {
  // Register new user
  async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }

      const prisma = req.app.get('prisma');

      // Check existing user
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role: 'staff',
        },
        select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
      });

      const token = generateToken(user);

      res.status(201).json({ user, token });
    } catch (error) {
      next(error);
    }
  },

  // Login with email & password
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const prisma = req.app.get('prisma');
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !user.password) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account deactivated. Contact admin.' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = generateToken(user);

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'login',
          entity: 'user',
          entityId: user.id,
          details: { method: 'email' },
        },
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  },

  // Google OAuth login
  async googleLogin(req, res, next) {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ error: 'Google credential is required.' });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { sub: googleId, email, name, picture } = payload;

      const prisma = req.app.get('prisma');

      // Find or create user
      let user = await prisma.user.findFirst({
        where: { OR: [{ googleId }, { email }] },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatar: picture || user.avatar },
        });
      } else {
        user = await prisma.user.create({
          data: {
            name,
            email,
            googleId,
            avatar: picture,
            role: 'staff',
          },
        });
      }

      const token = generateToken(user);

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'login',
          entity: 'user',
          entityId: user.id,
          details: { method: 'google' },
        },
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const prisma = req.app.get('prisma');
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          phone: true,
          isActive: true,
          createdAt: true,
          staff: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const { name, phone, avatar } = req.body;
      const prisma = req.app.get('prisma');

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { name, phone, avatar },
        select: {
          id: true, name: true, email: true, role: true, avatar: true, phone: true,
        },
      });

      res.json({ user });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
