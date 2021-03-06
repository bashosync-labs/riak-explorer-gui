import Ember from 'ember';
import LoadingSlider from '../../mixins/routes/loading-slider';
import ScrollReset from '../../mixins/routes/scroll-reset';
import WrapperState from '../../mixins/routes/wrapper-state';

export default Ember.Route.extend(LoadingSlider, ScrollReset, WrapperState, {

  model: function(params) {
    return this.explorer.getConfigFile(params.clusterName, params.nodeName, params.configName);
  },

  afterModel: function(model, transition) {
    this.setSidebarCluster(model.get('node').get('cluster'));
    this.setBreadCrumbs({
      cluster: model.get('node').get('cluster'),
      node: model.get('node'),
      configFile: model
    });
    this.setViewLabel({
      preLabel: 'Config Detail',
      label: model.get('name')
    });
  }
});
