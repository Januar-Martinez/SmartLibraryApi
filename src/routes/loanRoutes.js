const express = require('express');
const router  = express.Router();

const {
  createLoan,
  getAllLoans,
  getLoanById,
  updateLoan,
} = require('../controllers/loanController');

router.post('/', createLoan);
router.get('/', getAllLoans);
router.get('/:id', getLoanById);
router.put('/:id', updateLoan);

module.exports = router;