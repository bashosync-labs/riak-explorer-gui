import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['form-group', 'create-button'],

  type: 'primary',

  label: null,

  actions: {
    handleButtonClick: function() {
      this.sendAction('buttonClick');
    }
  }
});
