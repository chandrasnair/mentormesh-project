// routes/uploadRoutes.js
// File upload routes for profile images

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = (User, authMiddleware) => {
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Upload profile image (protected)
  router.post('/profile-image', authMiddleware, upload.single('profileImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete old profile image if it exists
      if (user.mentorProfile?.profileImage) {
        const oldImagePath = path.join(uploadsDir, path.basename(user.mentorProfile.profileImage));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Save new image path
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      user.mentorProfile = {
        ...user.mentorProfile,
        profileImage: imageUrl
      };

      await user.save();

      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          profileImage: imageUrl
        }
      });

    } catch (error) {
      console.error('Profile image upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while uploading profile image'
      });
    }
  });

  return router;
};
