// routes/availabilityRoutes.js
// Availability management routes

const express = require('express');
const router = express.Router();

module.exports = (Availability, User) => {

  // Create single availability slot
  router.post('/', async (req, res) => {
    try {
      const { mentorId, date, startTime, endTime, timezone, notes } = req.body;

      if (!mentorId || !date || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'mentorId, date, startTime, and endTime are required'
        });
      }

      const slotDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (slotDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create availability slot in the past'
        });
      }

      // Check for overlapping slots
      const overlapping = await Availability.findOne({
        mentorId,
        date: slotDate,
        status: { $in: ['available', 'booked'] },
        $or: [
          { $and: [{ startTime: { $lte: startTime } }, { endTime: { $gt: startTime } }] },
          { $and: [{ startTime: { $lt: endTime } }, { endTime: { $gte: endTime } }] },
          { $and: [{ startTime: { $gte: startTime } }, { endTime: { $lte: endTime } }] }
        ]
      });

      if (overlapping) {
        return res.status(409).json({
          success: false,
          message: 'This time slot overlaps with an existing slot',
          existingSlot: overlapping
        });
      }

      const availability = new Availability({
        mentorId,
        date: slotDate,
        startTime,
        endTime,
        timezone: timezone || 'UTC',
        notes: notes || ''
      });

      await availability.save();

      res.status(201).json({
        success: true,
        message: 'Availability slot created successfully',
        data: { availability }
      });

    } catch (error) {
      console.error('Create availability error:', error);
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
      }
      res.status(500).json({ success: false, message: 'Server error while creating availability' });
    }
  });

  // Create multiple availability slots (bulk)
  router.post('/bulk', async (req, res) => {
    try {
      const { mentorId, slots } = req.body;

      if (!mentorId || !slots || !Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'mentorId and slots array are required'
        });
      }

      const errors = [];
      const validSlots = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        if (!slot.date || !slot.startTime || !slot.endTime) {
          errors.push(`Slot ${i + 1}: date, startTime, and endTime are required`);
          continue;
        }
        const slotDate = new Date(slot.date);
        if (slotDate < today) {
          errors.push(`Slot ${i + 1}: Cannot create slot in the past`);
          continue;
        }
        validSlots.push({
          mentorId,
          date: slotDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timezone: slot.timezone || 'UTC',
          notes: slot.notes || ''
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({ success: false, message: 'Some slots have validation errors', errors });
      }

      const availabilitySlots = await Availability.insertMany(validSlots);

      res.status(201).json({
        success: true,
        message: `${availabilitySlots.length} availability slots created successfully`,
        data: { count: availabilitySlots.length, slots: availabilitySlots }
      });

    } catch (error) {
      console.error('Bulk create availability error:', error);
      res.status(500).json({ success: false, message: 'Server error while creating availability slots' });
    }
  });

  // Get mentor's availability
  router.get('/mentor/:mentorId', async (req, res) => {
    try {
      const { mentorId } = req.params;
      const { startDate, endDate, status, includeBooked } = req.query;

      const query = { mentorId };

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      if (status) {
        query.status = status;
      } else if (includeBooked !== 'true') {
        query.status = { $in: ['available', 'booked'] };
      }

      const availability = await Availability.find(query)
        .sort({ date: 1, startTime: 1 })
        .populate('bookedBy', 'fullName email');

      res.json({
        success: true,
        data: { mentorId, count: availability.length, availability }
      });

    } catch (error) {
      console.error('Get availability error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching availability' });
    }
  });

  // Get available slots for a specific date
  router.get('/date/:date', async (req, res) => {
    try {
      const { date } = req.params;
      const { skills } = req.query;

      const query = {
        date: new Date(date),
        status: 'available',
        isBooked: false
      };

      let availability = await Availability.find(query)
        .populate({
          path: 'mentorId',
          select: 'fullName email mentorProfile',
          match: skills ? { 'mentorProfile.skills': { $in: skills.split(',') } } : {}
        })
        .sort({ startTime: 1 });

      availability = availability.filter(slot => slot.mentorId !== null);

      const mentorMap = {};
      availability.forEach(slot => {
        const mentorId = slot.mentorId._id.toString();
        if (!mentorMap[mentorId]) {
          mentorMap[mentorId] = { mentor: slot.mentorId, slots: [] };
        }
        mentorMap[mentorId].slots.push(slot);
      });

      const mentors = Object.values(mentorMap);

      res.json({
        success: true,
        data: { date, count: mentors.length, totalSlots: availability.length, mentors }
      });

    } catch (error) {
      console.error('Get available slots error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching available slots' });
    }
  });

  // Search/filter mentors (public or protected based on your needs)
  router.get('/mentors/search', async (req, res) => {
    try {
      const { 
        skills, 
        minExperience, 
        maxExperience,
        expertise,
        search,
        sortBy = 'experience',
        limit = 20,
        page = 1
      } = req.query;

      // Build query - only active, approved mentors
      const query = {
        roles: 'mentor',
        accountStatus: 'active',
        isVerified: true
      };

      // Filter by skills (comma-separated string or array)
      if (skills) {
        const skillsArray = typeof skills === 'string' 
          ? skills.split(',').map(s => s.trim()).filter(s => s)
          : skills;
        
        if (skillsArray.length > 0) {
          query['mentorProfile.skills'] = { 
            $in: skillsArray.map(skill => new RegExp(skill, 'i'))
          };
        }
      }

      // Filter by experience range
      if (minExperience !== undefined) {
        query['mentorProfile.experience'] = { 
          ...query['mentorProfile.experience'],
          $gte: parseInt(minExperience) 
        };
      }
      if (maxExperience !== undefined) {
        query['mentorProfile.experience'] = { 
          ...query['mentorProfile.experience'],
          $lte: parseInt(maxExperience) 
        };
      }

      // Filter by expertise (partial match)
      if (expertise) {
        query['mentorProfile.expertise'] = new RegExp(expertise, 'i');
      }

      // Search by name or bio
      if (search) {
        query.$or = [
          { fullName: new RegExp(search, 'i') },
          { 'mentorProfile.bio': new RegExp(search, 'i') }
        ];
      }

      // Sorting
      let sort = {};
      switch (sortBy) {
        case 'experience':
          sort = { 'mentorProfile.experience': -1 };
          break;
        case 'name':
          sort = { fullName: 1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        default:
          sort = { 'mentorProfile.experience': -1 };
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query
      const mentors = await User.find(query)
        .select('fullName email mentorProfile createdAt lastLogin')
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip);

      // Get total count for pagination
      const totalCount = await User.countDocuments(query);
      const totalPages = Math.ceil(totalCount / parseInt(limit));

      res.json({
        success: true,
        data: {
          mentors,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCount,
            limit: parseInt(limit),
            hasMore: parseInt(page) < totalPages
          }
        }
      });

    } catch (error) {
      console.error('Mentor search error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while searching mentors'
      });
    }
  });


  // Get single availability slot by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const availability = await Availability.findById(id)
        .populate('mentorId', 'fullName email mentorProfile')
        .populate('bookedBy', 'fullName email');

      if (!availability) {
        return res.status(404).json({ success: false, message: 'Availability slot not found' });
      }

      res.json({ success: true, data: { availability } });

    } catch (error) {
      console.error('Get availability by ID error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching availability' });
    }
  });

  // Update availability slot
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { date, startTime, endTime, timezone, status, notes, meetingLink } = req.body;

      const availability = await Availability.findById(id);

      if (!availability) {
        return res.status(404).json({ success: false, message: 'Availability slot not found' });
      }

      if (availability.isBooked && (date || startTime || endTime)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update date/time of a booked slot. Cancel it first or update other fields only.'
        });
      }

      if (date) {
        const newDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (newDate < today) {
          return res.status(400).json({ success: false, message: 'Cannot set date in the past' });
        }
        availability.date = newDate;
      }
      if (startTime) availability.startTime = startTime;
      if (endTime) availability.endTime = endTime;
      if (timezone) availability.timezone = timezone;
      if (status) availability.status = status;
      if (notes !== undefined) availability.notes = notes;
      if (meetingLink !== undefined) availability.meetingLink = meetingLink;

      await availability.save();

      res.json({
        success: true,
        message: 'Availability slot updated successfully',
        data: { availability }
      });

    } catch (error) {
      console.error('Update availability error:', error);
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
      }
      res.status(500).json({ success: false, message: 'Server error while updating availability' });
    }
  });

  // Delete availability slot
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const availability = await Availability.findById(id);

      if (!availability) {
        return res.status(404).json({ success: false, message: 'Availability slot not found' });
      }

      if (availability.isBooked) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete a booked slot. Cancel the booking first.'
        });
      }

      await Availability.findByIdAndDelete(id);

      res.json({ success: true, message: 'Availability slot deleted successfully' });

    } catch (error) {
      console.error('Delete availability error:', error);
      res.status(500).json({ success: false, message: 'Server error while deleting availability' });
    }
  });

  // Book an availability slot
  router.post('/:id/book', async (req, res) => {
    try {
      const { id } = req.params;
      const { menteeId, bookingId } = req.body;

      if (!menteeId) {
        return res.status(400).json({ success: false, message: 'menteeId is required' });
      }

      const availability = await Availability.findById(id).populate('mentorId', 'fullName email');

      if (!availability) {
        return res.status(404).json({ success: false, message: 'Availability slot not found' });
      }

      if (availability.isBooked) {
        return res.status(409).json({ success: false, message: 'This slot is already booked' });
      }

      const slotDateTime = new Date(availability.date);
      const [hours, minutes] = availability.startTime.split(':');
      slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (slotDateTime < new Date()) {
        return res.status(400).json({ success: false, message: 'Cannot book a slot in the past' });
      }

      // Generate Jitsi meeting link
      const roomName = `mentormesh-${availability.mentorId._id}-${id}`;
      const meetingLink = `https://meet.jit.si/${roomName}`;

      await availability.book(menteeId, bookingId);
      availability.meetingLink = meetingLink;
      await availability.save();

      const bookedSlot = await Availability.findById(id)
        .populate('mentorId', 'fullName email')
        .populate('bookedBy', 'fullName email');

      res.json({
        success: true,
        message: 'Slot booked successfully',
        data: { availability: bookedSlot, meetingLink }
      });

    } catch (error) {
      console.error('Book availability error:', error);
      res.status(500).json({ success: false, message: 'Server error while booking slot' });
    }
  });

  // Get meeting details
  router.get('/:id/meeting', async (req, res) => {
    try {
      const { id } = req.params;

      const availability = await Availability.findById(id)
        .populate('mentorId', 'fullName email')
        .populate('bookedBy', 'fullName email');

      if (!availability) {
        return res.status(404).json({ success: false, message: 'Availability slot not found' });
      }

      if (!availability.isBooked) {
        return res.status(400).json({ success: false, message: 'This slot is not booked yet' });
      }

      const meetingDate = new Date(availability.date);
      const [hours, minutes] = availability.startTime.split(':');
      meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const now = new Date();
      const timeUntilMeeting = meetingDate - now;
      const canJoin = timeUntilMeeting <= 10 * 60 * 1000;

      res.json({
        success: true,
        data: {
          meetingLink: availability.meetingLink,
          mentor: { name: availability.mentorId.fullName, email: availability.mentorId.email },
          mentee: { name: availability.bookedBy.fullName, email: availability.bookedBy.email },
          schedule: {
            date: availability.date,
            startTime: availability.startTime,
            endTime: availability.endTime,
            timezone: availability.timezone
          },
          canJoin,
          timeUntilMeeting: timeUntilMeeting > 0 ? Math.floor(timeUntilMeeting / 1000 / 60) : 0
        }
      });

    } catch (error) {
      console.error('Get meeting details error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching meeting details' });
    }
  });

  // Cancel a booking
  router.post('/:id/cancel', async (req, res) => {
    try {
      const { id } = req.params;

      const availability = await Availability.findById(id);

      if (!availability) {
        return res.status(404).json({ success: false, message: 'Availability slot not found' });
      }

      if (!availability.isBooked) {
        return res.status(400).json({ success: false, message: 'This slot is not booked' });
      }

      await availability.cancel();

      res.json({ success: true, message: 'Booking cancelled successfully', data: { availability } });

    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ success: false, message: 'Server error while cancelling booking' });
    }
  });

  // Mark slot as completed
  router.post('/:id/complete', async (req, res) => {
    try {
      const { id } = req.params;

      const availability = await Availability.findById(id);

      if (!availability) {
        return res.status(404).json({ success: false, message: 'Availability slot not found' });
      }

      await availability.complete();

      res.json({ success: true, message: 'Slot marked as completed', data: { availability } });

    } catch (error) {
      console.error('Complete slot error:', error);
      res.status(500).json({ success: false, message: 'Server error while completing slot' });
    }
  });

  // Get mentor statistics
  router.get('/mentor/:mentorId/stats', async (req, res) => {
    try {
      const { mentorId } = req.params;

      const totalSlots = await Availability.countDocuments({ mentorId });
      const bookedSlots = await Availability.countDocuments({ mentorId, isBooked: true });
      const availableSlots = await Availability.countDocuments({ 
        mentorId, 
        status: 'available', 
        isBooked: false,
        date: { $gte: new Date() }
      });
      const completedSlots = await Availability.countDocuments({ mentorId, status: 'completed' });

      res.json({
        success: true,
        data: { mentorId, totalSlots, bookedSlots, availableSlots, completedSlots }
      });

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching statistics' });
    }
  });

  // Get mentee bookings
  router.get('/mentee/:menteeId/bookings', async (req, res) => {
    try {
      const { menteeId } = req.params;
      const { includePast } = req.query;

      const query = { bookedBy: menteeId, isBooked: true };

      if (includePast !== 'true') {
        query.date = { $gte: new Date() };
      }

      const bookings = await Availability.find(query)
        .populate('mentorId', 'fullName email mentorProfile')
        .sort({ date: 1, startTime: 1 });

      res.json({
        success: true,
        data: { menteeId, count: bookings.length, bookings }
      });

    } catch (error) {
      console.error('Get mentee bookings error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching bookings' });
    }
  });

  return router;
};