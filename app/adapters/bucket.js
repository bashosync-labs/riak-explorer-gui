import ApplicationAdapter from './application';
import config from '../config/environment';

export default ApplicationAdapter.extend({
  buildURL(modelName, id, snapshot, requestType, query) {
    return `${config.baseURL}explore/clusters/${query.clusterName}/bucket_types/${query.bucketTypeName}/buckets?start=1&rows=${config.pageSize}`;
  },

  query(store, type, query) {
    let url = this.buildURL(type.modelName, null, null, 'query', query);

    let promise = this.ajax(url, 'GET').then(function(data) {
      if (data.buckets && data.buckets.buckets) {
        data.buckets = data.buckets.buckets.map(function(bucketName) {
          return {
            id: `${query.clusterName}/${query.bucketTypeName}/${bucketName}`,
            name: bucketName
          }
        });
      }

      return data;
    });

    return promise;
  }
});
