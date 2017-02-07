/**
 * Adds support for aggregation blueprint and binds :model/:aggregation route for each RESTful model.
 */
const _ = require('lodash');
const pluralize = require('pluralize');

const actionUtil = require('./actionUtil');

const AGGREGATIONS = [
  {
    endpoint: 'count',
    func: function(req, res) {
      actionUtil.parseModel(req)
      .count(actionUtil.parseCriteria(req))
      .then(function(result) {
        return res.ok({count: result})
      });
    },
  },
  {
    endpoint: 'sum',
    func: function(req, res) {
      const values = actionUtil.parseValues(req);
      const model = actionUtil.parseModel(req)
      if(!values.on) return res.badRequest('missig argument: on');
      if(!_.isArray(values.on)) values.on = [values.on];
      const invalidAttrs = _(values.on).filter(
        (attr) => 
          !model.attributes.hasOwnProperty(attr)
          || !(
            model.attributes[attr].type === 'integer'
            || model.attributes[attr].type === 'float'
          )
      ).value()
      if(!_.isEmpty(invalidAttrs)) return res.badRequest('not valid model attributes: '+invalidAttrs);
      model
      .find(actionUtil.parseCriteria(req))
      .sum(values.on)
      .then(function(result) {
        return res.ok(result[0] || {});
      });
    },
  },
];

module.exports = function (sails) {
  return {
    initialize: function(cb) {
      const config = sails.config.blueprints;

      sails.on('router:before', function() {
        _(sails.models).forEach(function(model) {
          var controller = sails.middleware.controllers[model.identity];
          if (!controller) return;
          // Validate blueprint config for this controller
          if (config.prefix) {
            if (!_.isString(config.prefix)) return;
            if (!config.prefix.match(/^\//))
              config.prefix = '/' + config.prefix;
          }

          // Validate REST route blueprint config for this controller
          if (config.restPrefix) {
            if (!_.isString(config.restPrefix)) return;
            if (!config.restPrefix.charAt(0) === '/')
                config.restPrefix = '/' + config.restPrefix;
          }

          var prefix = config.prefix + config.restPrefix;
          var baseRoute = [prefix, model.identity].join('/');
          if (config.pluralize && _.get(controller, '_config.pluralize', true))
            baseRoute = pluralize(baseRoute);

          _(AGGREGATIONS).forEach(function(aggregation){
            const route =  baseRoute + '/' + aggregation.endpoint;
            sails.router.bind(
              route,
              _.get(sails.middleware, 'blueprints.'+aggregation.endpoint)
                || aggregation.func,
              null,
              {controller: model.identity}
            );
            sails.log.silly(
              'Register aggregation ::  '+
              route +
              ' ('+aggregation.endpoint+')'
            );
          });
        });
      });

      cb();
    }
  }
};

