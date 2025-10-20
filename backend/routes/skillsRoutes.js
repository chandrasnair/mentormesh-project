const express = require('express');
const router = express.Router();

// Predefined list of skills for mentoring
const predefinedSkills = [
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'C#',
  'PHP',
  'Ruby',
  'Swift',
  'Kotlin',
  'React',
  'Vue.js',
  'Angular',
  'Node.js',
  'Express.js',
  'MongoDB',
  'MySQL',
  'PostgreSQL',
  'AWS',
  'Azure',
  'Docker',
  'Kubernetes',
  'DevOps',
  'Machine Learning',
  'Data Science',
  'Cyber Security',
  'Blockchain',
  'Mobile Development',
  'Web Development',
  'UI/UX Design',
  'Graphic Design',
  'Product Management',
  'Business Analysis',
  'Entrepreneurship',
  'Leadership',
  'Public Speaking',
  'Career Counseling',
  'Interview Preparation',
  'Freelancing'
];

// Get all available skills
router.get('/', (req, res) => {
  res.json({
    success: true,
    skills: predefinedSkills
  });
});

module.exports = router;
