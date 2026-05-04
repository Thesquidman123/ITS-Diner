const fs = require('fs');
const app = require('./app');
const { port, uploadsDir, dataDir } = require('./config');
const { startScheduledReminderService } = require('./services/scheduledReminderService');

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
  startScheduledReminderService();
});
