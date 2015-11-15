// Local Collection
Notifications = new Mongo.Collection(null);

const REMOVE_AFTER_SECONDS = 5;

Notifications.error = function (message) {
  // Only one error at a time
  this.remove({ type: 'error' });

  var id = this.insert({ type: 'error', message: message });
  setTimeout(() => {
    this.remove(id);
  }, REMOVE_AFTER_SECONDS * 1000);
  return id;
};

Notifications.clear = function () {
  this.remove({});
};