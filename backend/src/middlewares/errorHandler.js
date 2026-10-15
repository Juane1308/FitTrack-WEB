function notFound(_req, res) {
  res.status(404).json({ message: 'Recurso no encontrado.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: 'Error interno del servidor.' });
}

module.exports = { notFound, errorHandler };
