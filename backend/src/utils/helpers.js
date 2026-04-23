const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(value || 0);
};

const formatDate = (date, options = {}) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', options);
};

const generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

const generateBarcode = (bookId, copyNumber) => {
  return `LIB-${String(bookId).padStart(6, '0')}-${String(copyNumber).padStart(3, '0')}`;
};

const generateTransactionCode = (readerId) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TRX-${date}-${String(readerId).padStart(6, '0')}-${random}`;
};

const generateCardNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
  return `RD${year}${random}`;
};

const calculateLateFee = (bookPrice, daysLate, lateRate = 50) => {
  if (daysLate <= 0) return 0;
  return Math.round((bookPrice * lateRate) / 100);
};

const calculateDamageFee = (bookPrice, damagePercentage) => {
  return Math.round((bookPrice * damagePercentage) / 100);
};

const paginateResults = (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  return { offset, limit: parseInt(limit) };
};

const buildWhereClause = (filters, allowedFields) => {
  const conditions = [];
  const values = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined && value !== null) {
      conditions.push(`${key} = ?`);
      values.push(value);
    }
  });

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values
  };
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

module.exports = {
  formatCurrency,
  formatDate,
  generateRandomString,
  generateBarcode,
  generateTransactionCode,
  generateCardNumber,
  calculateLateFee,
  calculateDamageFee,
  paginateResults,
  buildWhereClause,
  sanitizeInput
};
