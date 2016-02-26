import ApplicationAdapter from './application';
import config from '../config/environment';

export default ApplicationAdapter.extend({
  buildURL(modelName, id, snapshot, requestType, query) {
    return `${config.baseURL}explore/clusters/${query.clusterName}/nodes`;
  },

  query(store, type, query) {
    let url = this.buildURL(type.modelName, null, null, 'query', query);

    let promise = this.ajax(url, 'GET').then(function(data) {
      data.nodes.forEach(function(node) {
        node.name = node.id;
        node.id = `${query.clusterName}/${node.name}`;
      });

      return data;
    });

    return promise;
  }
});
