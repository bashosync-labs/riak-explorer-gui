import Ember from 'ember';

export default Ember.Mixin.create({
  activate: function() {
    this._super();
    Ember.$('.view-body').scrollTop(0);
  },

  scrollToTop: function() {
    return Ember.$('.view-body').scrollTop(0);
  }
});
