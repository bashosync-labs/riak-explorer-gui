import Ember from 'ember';
import WrapperState from '../../../mixins/routes/wrapper-state';
import Alerts from '../../../mixins/routes/alerts';
import LoadingSlider from '../../../mixins/routes/loading-slider';

export default Ember.Route.extend(WrapperState, Alerts, LoadingSlider, {
  model(params) {
    return this.explorer.getCluster(params.clusterName);
  },

  afterModel(model, transition) {
    this.setSidebarCluster(model);
    this.setBreadCrumbs({
      cluster: model,
      schemaCreate: true
    });
    this.setViewLabel({
      preLabel: 'Create Schema'
    });
  },

  actions: {
    createSchema: function(clusterName, schemaName, schemaContent) {
      let self = this;
      let xmlDoc = null;

      try {
        xmlDoc = Ember.$.parseXML(schemaContent);
      } catch (error) {
        this.showAlert('alerts._error_old-invalid-xml');
        return;
      }

      if (!Ember.$(xmlDoc).find('schema').attr('name')) {
        this.showAlert('alerts._error_old-solr-must-have-name');
        return;
      }

      if (!Ember.$(xmlDoc).find('schema').attr('version')) {
        this.showAlert('alerts._error_old-solr-must-have-version');
        return;
      }

      this.explorer.createSchema(clusterName, schemaName, xmlDoc).then(
        function onSuccess() {
          // TODO: Need to update this to give better feedback to user on what is going on
          self.transitionTo('cluster.query', clusterName);
        },
        function onFail() {
          self.render('alerts._error_old-schema-not-saved', {
            into: 'application',
            outlet: 'alert'
          });
        }
      );
    }
  }
});
