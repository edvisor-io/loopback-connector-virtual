'use strict';
var Connector = require('loopback-connector').Connector;
var util = require('util');
var assert = require('assert');
var _ = require('lodash');

function VirtualConnector(name, settings) {
  Connector.call(this, 'virtual', settings);
}

VirtualConnector.prototype.all = function find(model, filter, options, cb) {
  var self = this;
  var server = self.settings.server;
  assert(server, 'No server initilized');
  var mapping = _.find(self.settings.mapping.all, {
    Model: model
  });
  var Model = server.models[mapping && mapping.Model];
  var method = mapping.method;
  assert(mapping && Model && method, 'No mapping defined for all() function and model ' + model);

  Model[method].call(server, filter, options, function(err, prices) {
    if (err) {
      return cb(err);
    }
    if (filter && filter.include) {
      self.getModelDefinition(model).model.include(prices, filter.include, options, cb);
    } else {
      cb(null, prices);
    }
  });
};

util.inherits(VirtualConnector, Connector);
module.exports = VirtualConnector;