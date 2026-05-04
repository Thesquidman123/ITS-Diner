const { readCollection, writeCollection } = require('./fileStore');

function createRepository(fileName, defaultValue = []) {
  return {
    all() {
      return readCollection(fileName, defaultValue);
    },
    saveAll(items) {
      return writeCollection(fileName, items);
    },
    findById(id) {
      return this.all().find((item) => item.id === id) || null;
    },
    insert(item) {
      const items = this.all();
      items.push(item);
      this.saveAll(items);
      return item;
    },
    update(id, updater) {
      const items = this.all();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }
      const current = items[index];
      const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
      items[index] = updated;
      this.saveAll(items);
      return updated;
    },
    remove(id) {
      const items = this.all().filter((item) => item.id !== id);
      this.saveAll(items);
    }
  };
}

module.exports = { createRepository };
