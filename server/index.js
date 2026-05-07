const fs = require('fs');
const app = require('./app');
const { port, uploadsDir, dataDir, menuUploadsDir } = require('./config');
const { startScheduledReminderService } = require('./services/scheduledReminderService');
const { checkUploadsWritable } = require('./middleware/uploadMiddleware');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(menuUploadsDir, { recursive: true });

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
  checkUploadsWritable();
  startScheduledReminderService();
});
