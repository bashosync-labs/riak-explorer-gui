import Ember from 'ember';
import WrapperState from '../../mixins/wrapper-state';

export default Ember.Route.extend(WrapperState, {

  model: function(params) {
    return this.explorer.getLogFile(params.clusterId, params.nodeId, params.logId);
  },

  afterModel: function(model, transition) {
    this.setSidebarCluster(model.get('node').get('cluster'));
    this.setBreadCrumbs({
      cluster: model.get('node').get('cluster'),
      node: model.get('node'),
      logFile: model
    });
  },

  actions: {
    refreshLogFile: function(log) {
      let self = this;

      this.controllerFor('log-file').set('isRefreshing', true);

      // TODO: Add functionality to change the amount of lines the log file is tailing
      this.explorer.getLogFileContents(log).then(function() {
        // The response back from the server is very fast on a lot of these requests,
        //  so let the animation run for an extra second to give the feedback loop that
        //  the request has gone through.
        setTimeout(() => self.controllerFor('log-file').set('isRefreshing', false), 1000);
      });
    }
  }
});
