Template.collectionSettings.events({
  'submit form': function (event, template) {
    event.preventDefault();

    var collection = this.collection;

    var attributes = {
      name: template.$('input[name="name"]').val().trim(),
      color: $('input[name="color"]:checked').val()
    };

    Meteor.call('collectionUpdate', collection._id, attributes, (error) => {
      if (error) {
        return Notifications.error(error.reason);
      }

      Router.go('collection', collection);
    });
  }
});