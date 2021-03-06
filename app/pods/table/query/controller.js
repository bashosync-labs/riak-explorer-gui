import Ember from 'ember';
import SideDrawer from '../../../mixins/controller/side-drawer';

export default Ember.Controller.extend(SideDrawer, {
  example: "",

  query: '',

  result: '',

  resultLength: null,

  isDisabled: true,

  isLoading: false,

  showClear: false,

  canClear: function() {
    let result = this.get('result');
    let canClear = Ember.isPresent(result) && result !== this.get('loadingMessage');

    this.set('showClear', canClear);
  }.observes('result'),

  canSubmit: function() {
    return this.set('isDisabled', Ember.isBlank(this.get('query')));
  }.observes('query'),

  setLoadingState: function() {
    if (this.get('isLoading')) {
      this.set('resultLength', null);
      this.set('result', 'Querying...');
    }
  }.observes('isLoading'),

  resetResult: function() {
    this.set('result', '');
    this.set('resultLength', null);
  },

  resetQuery: function() {
    this.set('query', '');
  },

  resetState: function() {
    this.resetQuery();
    this.resetResult();
  },

  actions: {
    clear: function() {
      this.resetState();
    },

    insertExample: function() {
      this.set('query', this.get('example'));
    }
  }
});
