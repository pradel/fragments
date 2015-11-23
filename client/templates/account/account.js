Template.account.events({
  'click [data-export]': function (event) {
    event.preventDefault();
    var notification = Notifications.progress('Preparing your data...');

    Meteor.call('exportData', function (err, data) {
      Notifications.remove(notification);

      if (err) {
        return Notifications.error(err);
      }

      var str = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));

      var a = document.createElement('a');
      a.href = 'data:' + str;
      a.download = 'export.json';
      a.click();
    });
  }
});