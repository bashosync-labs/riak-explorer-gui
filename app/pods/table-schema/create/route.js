import Ember from 'ember';
import Alerts from '../../../mixins/routes/alerts';
import LoadingSlider from '../../../mixins/routes/loading-slider';
import ScrollReset from '../../../mixins/routes/scroll-reset';
import WrapperState from '../../../mixins/routes/wrapper-state';
import insert from '../../../utils/string-helpers';
import _ from 'lodash/lodash';

export default Ember.Route.extend(Alerts, LoadingSlider, ScrollReset, WrapperState, {
  model(params) {
    let self = this;

    return this.explorer.getCluster(params.clusterName).then(function(cluster) {
      return self.store.createRecord('table-schema', { cluster: cluster });
    });
  },

  afterModel(model, transition) {
    this.setSidebarCluster(model.get('cluster'));
    this.setBreadCrumbs({
      cluster: model.get('cluster'),
      crudAction: 'create schema template'
    });
    this.setViewLabel({
      preLabel: 'Schema Template',
      label: 'Create'
    });
  },

  setupController: function(controller, model) {
    this._super(controller, model);

    controller.set('messages', []);
    controller.set('fileUploaded', false);
    controller.set('errors', null);
  },

  parseMessageFields(fields, data) {
    let self = this;
    let parsedFields = [];

    fields.map(function(field) {
      if (_.isObject(field.type) && Ember.isPresent(field.type.ref)) {
        field.type.ref.forEach(function(reference) {
          let referencesThatAreMessages = data.messages.filter(function(message) {
            return message.name === reference;
          });
          let referencesThatAreEnums = data.enums.filter(function(message) {
            return message.name === reference;
          });

          if (Ember.isPresent(referencesThatAreMessages)) {
            referencesThatAreMessages.forEach(function(r) {
              self.parseMessageFields(r.fields).forEach(function(field) {
                parsedFields.push(field);
              });
            });
          }

          if (Ember.isPresent(referencesThatAreEnums)) {
            referencesThatAreEnums.forEach(function(r) {

              parsedFields.push({
                'name': field.name,
                'type': 'sint64'
              });
            });
          }
        });
      } else {
        return parsedFields.push(field);
      }
    });

    return parsedFields;
  },

  parseMessages(data) {
    let self = this;

    return data.messages.map(function(message) {
      message.fields = self.parseMessageFields(message.fields, data);

      return message;
    });
  },

  formatMessageIntoTableString(message) {
    let fields = message.fields
        .map(function(field) {
          return `  ${field.name} ${field.type.toUpperCase()} NOT NULL`;
        })
        .join(',\n');

    return `CREATE TABLE ${message.name}\n(\n${fields},\n  PRIMARY KEY (\n    (##,##, quantum(##, ##, ##)),\n    ##, ##, ##\n  )\n)`;
  },

  actions: {
    incorrectExtension: function() {
      this.controller.set('errors', "File must have an extension of .proto and be a protocol buffer file to be read.");
    },

    uploadFail(errorObj) {
      let errorMessage = 'Riak Explorer was not able to parse the uploaded protobuff file. Please check to make sure it is formatted correctly.';

      this.controller.set('errors', errorMessage);
      this.scrollToTop();
    },

    uploadSuccess(data) {
      let self = this;
      let clusterName = this.get('currentModel').get('cluster').get('name');
      let fileSha = data.create;

      this.controller.set('errors', null);
      this.explorer.getProtoBuffMessages(clusterName, fileSha).then(function(data) {
        let messages = self.parseMessages(data[fileSha]);

        if (Ember.isPresent(messages)) {
          messages.map(function(message) {
            message.initialSchema = self.formatMessageIntoTableString(message);
            message.error = null;
            message.success = null;
            message.schema = message.initialSchema;
            message.showSpinner = false;
          });

          self.controller.set('errors', null);
          self.controller.set('fileUploaded', true);
          self.controller.set('messages', messages);
        } else {
          this.controller.set('errors', 'No messages where parsed out of the protocol buffer file, please try again with messages that can be read.');
        }
      });
    },

    // TODO: Refactor common between this and table create method
    createTable: function(tableSchema, message, index) {
      // let self = this;
      let controller = this.controller;
      let clusterName = tableSchema.get('cluster').get('name');
      let statement = message.schema;

      Ember.set(message, 'showSpinner', true);
      Ember.set(message, 'error', null);

      let formatted = _.trim(statement.replace(/\s\s+/g, ' ')         // reduces multiple whitespaces into one
        .replace(/(\r\n|\n|\r)/gm, ' ') // removes any leftover newlines
        .replace(/\( /g, '(')           // removes any spacing following left parenthesis
        .replace(/ \)/g, ')'));         // removes any spacing preceding right parenthesis

      // Add space before first parenthesis if needed
      let indexOfFirstParenthesis = formatted.indexOf('(');
      let indexOfCharacterBeforeFirstParenthesis = indexOfFirstParenthesis - 1;
      let characterBeforeFirstParenthesis = formatted[indexOfCharacterBeforeFirstParenthesis];

      if (characterBeforeFirstParenthesis !== ' ') { formatted = insert(formatted, indexOfFirstParenthesis, ' '); }

      let tableName = formatted.split(' ')[2]; // Table name should always come after CREATE TABLE

      let data = {
        name: tableName,
        data: { props: { table_def: formatted } }
      };

      if (this.currentModel.get('cluster').get('tables').filterBy('name', tableName).length) {
        Ember.set(message, 'showSpinner', false);
        Ember.set(message, 'error', `A table named '${tableName}' already exits on the '${this.currentModel.get('cluster').get('name')}' cluster. Please use a unique name for your table.`);
        this.scrollToTop();
      } else {
        this.explorer.createBucketType(clusterName, data).then(
          function onSuccess() {
            Ember.set(message, 'showSpinner', false);
            Ember.set(message, 'success', true);
            Ember.set(message, 'schema', message.initialSchema);
          },
          function onFail(error) {
            let errorText;

            try {
              errorText = JSON.parse(error.responseText).error
                .replace(/\s\s+/g, ' ') // reduces multiple whitespaces into one
                .replace(/<<"/g, '')    // removes erlang starting brackets
                .replace(/">>/g, '');  // removes erlang ending brackets
            } catch(err) {
              errorText = 'Sorry, something went wrong. Your table was not created';
            }

            Ember.set(message, 'showSpinner', false);
            Ember.set(message, 'error', errorText);
          });
      }
    }
  }
});
