const express = require('express');
const router  = express.Router();

const {
  createMember,
  getAllMembers,
  getMemberById,
  updateMember,
} = require('../controllers/memberController');

router.post('/', createMember);
router.get('/', getAllMembers);
router.get('/:id', getMemberById);
router.put('/:id', updateMember);

module.exports = router;