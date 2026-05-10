const crypto = require('crypto');
const { User } = require('../models');
const { Op } = require('sequelize');

class PasswordResetService {
  /**
   * Generate password reset token
   * @param {string} email - User email
   * @returns {Promise<Object>} - Reset token and user info
   */
  static async generateResetToken(email) {
    try {
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        throw new Error('No account found with this email address');
      }
      
      // Generate random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Set token expiry (1 hour from now)
      const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      
      // Save to database
      await user.update({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetPasswordExpires,
      });
      
      console.log(`Reset token generated for ${email}: ${resetToken}`);
      
      return {
        success: true,
        resetToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      console.error('Generate reset token error:', error);
      throw error;
    }
  }
  
  /**
   * Verify reset token
   * @param {string} token - Reset token
   * @returns {Promise<Object>} - User if valid
   */
  static async verifyResetToken(token) {
    try {
      const user = await User.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: new Date() },
        },
      });
      
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Result
   */
  static async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: new Date() },
        },
      });
      
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }
      
      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear reset fields
      await user.update({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });
      
      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PasswordResetService;