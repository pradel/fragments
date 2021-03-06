const PREFETCH_HEIGHT = 450; // px
const SCROLL_THROTTLE = 250; // ms
const APPEAR_DELAY = 150; // ms
const DISAPPEAR_DELAY = 450; // ms

Template.fragmentsList.helpers({
  // the fragments cursor
  fragments: function () {
    return Template.instance().fragments;
  },
  // are there more fragments to show?
  isBusy: function () {
    return Session.get(APP_BUSY_KEY);
  },
  textSearch: function () {
    return Session.get(CURRENT_SEARCH_KEY);
  },
  currentCollection: function () {
    return Session.get(CURRENT_COLLECTION_KEY);
  },
  isEmpty: function () {
    return !Template.instance().fragments.count();
  },
  displaySubmitForm: function () {
    var userId = Meteor.userId();

    // Don't display when fragments are filtered by a search
    if (Session.get(CURRENT_SEARCH_KEY)) {
      return false;
    }

    var collection = Session.get(CURRENT_COLLECTION_KEY);
    if (collection) {
      if (collection.collaborators) {
        return _.find(collection.collaborators, (c) => { return c._id === userId });
      }

      return collection.user === userId;
    }

    return true;
  }
});

var $window = $(window);
var onWindowScroll = function (event) {
  var instance = event.data,
      $list = instance.$masonry,
      listHeight = $list.height();

  if (Session.get(APP_BUSY_KEY)) {
    return;
  }

  var offset = $window.scrollTop(),
      viewportHeight = $window.height(),
      contentHeight = parseInt($list.height() || $list.css('height'));

  if (offset < (contentHeight - viewportHeight - PREFETCH_HEIGHT)) {
    return;
  }

  // get current value for limit, i.e. how many posts are currently displayed
  var limit = Session.get(CURRENT_LIMIT_KEY);

  // increase limit
  limit += PAGE_SIZE;
  Session.set(CURRENT_LIMIT_KEY, limit);
};

var throttledScroll = _.throttle(onWindowScroll, SCROLL_THROTTLE);

Template.fragmentsList.onCreated(function () {

  // 1. Initialization
  var instance = this;

  // 2. Vars
  Session.set(CURRENT_LIMIT_KEY, PAGE_SIZE);

  // 3. Cursor
  instance.cursor = Cursors.fragments();

  instance.fragments = Fragments.find({}, {
    sort: { created_at: -1 }
  });

  this.autorun(function () {
    if (Session.get(FORCE_LAYOUT_RECOLLECT)) {
      setTimeout(function () {
        instance.recollect();
      }, 1);
    }
  });

  Meteor.forceLayoutRecollect = function () {
    Session.set(FORCE_LAYOUT_RECOLLECT, Date.now());
  };

  instance.fragments.observe({
    changedAt: function () {
      if (typeof instance.recollect === 'undefined') {
        return;
      }

      setTimeout(function () {
        instance.recollect();
      }, 1);
    }
  });

  // 4. UI Events
  $(window).on('scroll', instance, throttledScroll);
});

Template.fragmentsList.onDestroyed(function () {
  this.$masonry.masonry('destroy');
  delete this.$masonry;
  $(window).off('scroll', throttledScroll);
});

Template.fragmentsList.onRendered(function () {
  // setup masonry
  var selector = '.fragments-list',
      $masonry = this.$(selector),
      instance = Template.instance();

  this.$masonry = $masonry;

  $masonry.masonry({
    itemSelector: '.fragment-item',
    transitionDuration: 0
  });

  this.recollect = () => {
    if (instance.$masonry) {
      instance.$masonry.masonry('reloadItems').masonry('layout');
    }

    if (this.data && this.data.revealFragmentComments) {
      let fragmentId = this.data.revealFragmentComments;

      setTimeout(() => {
        instance.$('.fragment-item[data-id="' + fragmentId + '"] a[data-show-comments]').click();
      }, 1000);
    }
  };

  this.find(selector)._uihooks = {
    insertElement: (node, next) => {
      var $node = $(node);

      if (Session.get(CURRENT_LIMIT_KEY)) {
        $node.addClass('reduce-animations');
      }

      $node.addClass('appearing').insertBefore(next);

      this.recollect();

      setTimeout(() => {
        $node.removeClass('appearing reduce-animations');
      }, !Session.get(CURRENT_LIMIT_KEY) ? 0 : APPEAR_DELAY);
    },
    removeElement: (node) => {
      var $node = $(node);
      $(node).addClass('removing');

      setTimeout(() => {
        $node.remove();
        this.recollect();
      }, DISAPPEAR_DELAY);
    }
  }
});
