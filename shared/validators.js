function assertRequired(value, message) {
  if (value === undefined || value === null || value === '') {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
}

function parseOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }
  return options.map((option) => ({
    id: option.id,
    name: option.name,
    price: Number(option.price || 0)
  }));
}

module.exports = {
  assertRequired,
  parseOptions
};
