const { User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' });
};

// @desc    Login user (email or phone number)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    // Accept 'identifier' (email or phone) OR legacy 'email' field
    const identifier = (req.body.identifier || req.body.email || '').trim();
    const { password } = req.body;

    if (!identifier) return res.status(400).json({ message: 'Email or phone number is required' });

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email:       identifier },
          { phoneNumber: identifier },
        ],
      },
    });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isActive) return res.status(401).json({ message: 'Account is deactivated. Please contact support.' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user.id);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, companyName } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      phoneNumber,
      companyName: role === 'provider' ? companyName : null,
      status: role === 'provider' ? 'pending' : 'active',
    });
    
    const token = generateToken(user.id);
    
    res.status(201).json({
      success: true,
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    res.json({ user: req.user.toSafeObject() });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, companyName, profileImage } = req.body;
    
    await req.user.update({
      name: name || req.user.name,
      phoneNumber: phoneNumber || req.user.phoneNumber,
      companyName: companyName || req.user.companyName,
      profileImage: profileImage || req.user.profileImage,
    });
    
    res.json({ user: req.user.toSafeObject() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const isPasswordValid = await req.user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    req.user.password = newPassword;
    await req.user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: error.message });
  }
};