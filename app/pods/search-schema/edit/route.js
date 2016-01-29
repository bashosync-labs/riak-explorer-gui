import Ember from 'ember';
import WrapperState from '../../../mixins/wrapper-state';

export default Ember.Route.extend(WrapperState, {
  model(params) {
    return this.explorer.getCluster(params.clusterId)
      .then(function(cluster) {
        return cluster.get('searchSchemas').findBy('name', params.searchSchemaId);
      });
  },

  afterModel(model, transition) {
    this.setSidebarCluster(model.get('cluster'));
    this.setBreadCrumbs({
      cluster: model.get('cluster'),
      searchSchema: model
    });
    this.setViewLabel({
      preLabel: 'Search Schema',
      label: model.get('name')
    });

    if (!model.get('content')) {
      return Ember.$.ajax({
        type: 'GET',
        url: model.get('url'),
        dataType: 'xml'
      }).then(function(data) {
        let xmlString = (new XMLSerializer()).serializeToString(data);
        model.set('content', xmlString);
      });
    }
  },

  actions: {
    updateSchema: function(schema) {
      let xmlString = schema.get('content');
      let self = this;
      let xmlDoc = null;
      let clusterId = schema.get('cluster').get('id');
      let schemaId = schema.get('name');

      try {
        xmlDoc = Ember.$.parseXML(xmlString);
      } catch (error) {
        this.render('alerts.error-invalid-xml', {
          into: 'application',
          outlet: 'alert'
        });

        return;
      }

      return Ember.$.ajax({
        type: 'PUT',
        url: schema.get('url'),
        contentType: 'application/xml',
        processData: false,
        data: xmlDoc
      }).then(function(data) {
        self.transitionTo('search-schema', clusterId, schemaId);
      }, function(error) {
        self.render('alerts.error-schema-not-saved', {
          into: 'application',
          outlet: 'alert'
        });
      });
    }
  }
});
