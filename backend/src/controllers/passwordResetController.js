const { User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendPasswordResetSuccessEmail } = require('../services/emailService');

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('=== FORGOT PASSWORD REQUEST ===');
    console.log('Email:', email);
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive reset instructions.',
      });
    }
    
    console.log('User found:', user.id, user.email);
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    
    console.log('Generated token:', resetToken);
    console.log('Token expires:', resetPasswordExpires);
    
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetPasswordExpires,
    });
    
    console.log('Token saved to database for user:', user.email);
    
    // Verify token was saved correctly
    const savedUser = await User.findOne({ where: { email } });
    console.log('Verified token in DB:', savedUser.resetPasswordToken);
    console.log('Token matches:', savedUser.resetPasswordToken === resetToken);
    
    // Send email
    await sendPasswordResetEmail({
      to: email,
      name: user.name,
      resetToken: resetToken,
    });
    
    console.log('Reset email sent to:', email);
    console.log('=== END FORGOT PASSWORD ===');
    
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

// @desc    Verify reset token
// @route   GET /api/auth/reset-password/:token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('=== VERIFY TOKEN REQUEST ===');
    console.log('Token from URL:', token);
    console.log('Token length:', token?.length);
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      });
    }
    
    // Search for user with this token
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
      },
    });
    
    if (!user) {
      console.log('No user found with token:', token);
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Check if token is expired
    if (user.resetPasswordExpires < new Date()) {
      console.log('Token expired. Expiry:', user.resetPasswordExpires);
      console.log('Current time:', new Date());
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token has expired. Please request a new one.' 
      });
    }
    
    console.log('Token valid for user:', user.email);
    console.log('=== END VERIFY TOKEN ===');
    
    res.json({
      success: true,
      message: 'Token is valid',
      email: user.email,
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    
    console.log('=== RESET PASSWORD REQUEST ===');
    console.log('Token from URL:', token);
    
    if (!password || !confirmPassword) {
      return res.status(400).json({ message: 'Please provide both password and confirm password' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });
    
    if (!user) {
      console.log('No valid user found with token');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }
    
    console.log('User found:', user.email);

    // Update password (model's beforeUpdate hook handles hashing) and clear reset fields
    await user.update({
      password: password,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
    
    console.log('Password updated for user:', user.email);
    
    // Send success email
    await sendPasswordResetSuccessEmail({
      to: user.email,
      name: user.name,
    });
    
    console.log('=== END RESET PASSWORD ===');
    
    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};