function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Image upload failed' });
  }
  return res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
}

module.exports = {
  uploadImage
};
