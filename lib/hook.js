/**
 * Adds support for aggregation blueprint
 */
const async = require('async');
const _ = require('lodash');
const includeAll = require('include-all');
const path = require('path');
const pluralize = require('pluralize');
const util = require('util');


module.exports = function (sails) {

  var hook;

  return {

    initialize: function(cb) {
      hook = this;

      // Set up listener to bind shadow routes when the time is right.
      //
      // Always wait until after router has bound static routes.
      // Do bind routs on router:before so that routes from this hook
      // have higher priority that blueprint routes
      // If policies hook is enabled, also wait until policies are bound.
      // If orm hook is enabled, also wait until models are known.
      // If controllers hook is enabled, also wait until controllers are known.
      var eventsToWaitFor = [];
      eventsToWaitFor.push('router:before');
      if (sails.hooks.policies) {
        eventsToWaitFor.push('hook:policies:bound');
      }
      if (sails.hooks.orm) {
        eventsToWaitFor.push('hook:orm:loaded');
      }
      if (sails.hooks.controllers) {
        eventsToWaitFor.push('hook:controllers:loaded');
      }
      sails.after(eventsToWaitFor, hook.bindShadowRoutes);

      sails.on('middleware:registered', () => {
        _.forEach(sails.models, function(model) {
          // Controller finished loading:
          // inject actions in all controllers
          sails.log.verbose('inject actions in: '+model.identity);
          _.defaults(
            sails.middleware.controllers[model.identity],
            hook.actions
          );
        });
      });

      // load all actions
      includeAll.optional({
        dirname: path.resolve(__dirname, 'actions/'),
        filter: new RegExp('(.+)\\.(' + sails.config.moduleloader.sourceExt.join('|') + ')$'),
        useGlobalIdForKeyName: true
      }, (err, actions) => {
        if(err) return cb(err);

        // Add _middlewareType keys to the functions, for debugging
        _.forOwn(actions, function(fn, key) {
          fn._middlewareType = 'BLUEPRINT: '+fn.identity || key;
        });

        hook.actions = actions;
        sails.log.verbose('loaded actions:', actions);
        cb();
      });
    },

    // adapted from: sails/lib/hooks/blueprints/index.js
    bindShadowRoutes: function() {

      _.each(sails.middleware.controllers, function eachController (controller, controllerId) {
        if ( !_.isObject(controller) || _.isArray(controller) ) return;

        // Get globalId for use in errors/warnings
        var globalId = sails.controllers[controllerId].globalId;

        // Determine blueprint configuration for this controller
        var config = _.merge(
          {},
          sails.config.blueprints,
          controller._config || {}
        );

        // Validate blueprint config for this controller
        if ( config.prefix ) {
          if ( !_(config.prefix).isString() ) return;
          if ( !config.prefix.match(/^\//) ) config.prefix = '/' + config.prefix;
        }

        // Validate REST route blueprint config for this controller
        if ( config.restPrefix ) {
          if ( !_(config.restPrefix).isString() ) return;
          if ( !config.restPrefix.match(/^\//) ) config.restPrefix = '/' + config.restPrefix;
        }

        // Determine base route
        var baseRouteName = controllerId;

        if (config.pluralize) baseRouteName = pluralize(baseRouteName);

        var baseRoute = config.prefix + '/' + baseRouteName;
        // Determine base route for RESTful service
        // Note that restPrefix will always start with /
        var baseRestRoute = config.prefix + config.restPrefix + '/' + baseRouteName;

        // Build route options for blueprint
        var routeOpts = config;

        // Determine the model connected to this controller either by:
        // -> explicit configuration
        // -> on the controller
        // -> on the routes config
        // -> or implicitly by globalId
        // -> or implicitly by controller id
        var routeConfig = sails.router.explicitRoutes[controllerId] || {};
        var modelFromGlobalId = _.find(sails.models, {globalId: globalId});
        var modelId = config.model || routeConfig.model || (modelFromGlobalId && modelFromGlobalId.identity) || controllerId;

        // If the orm hook is enabled, it has already been loaded by this time,
        // so just double-check to see if the attached model exists in `sails.models`
        // before trying to attach any blueprint actions to the controller.
        if (sails.hooks.orm && sails.models && sails.models[modelId]) {

          // If a model with matching identity exists,
          // extend route options with the id of the model.
          routeOpts.model = modelId;

          var Model = sails.models[modelId];

          // Bind convenience functions for readability below:

          // Given an action id like "find" or "create", returns the appropriate
          // blueprint action (or explicit controller action if the controller

          /**
           * Return the middleware function that should be bound for a shadow route
           * pointing to the specified blueprintId. Will use the explicit controller
           * action if it exists, otherwise the blueprint action.
           *
           * @param  {String} blueprintId  [find, create, etc.]
           * @return {Function}            [middleware]
           */
          function _getAction (blueprintId) {
            // Allow custom actions defined in controller to override blueprint actions.
            return sails.middleware.controllers[controllerId][blueprintId.toLowerCase()] || hook.middleware[blueprintId.toLowerCase()];
          }

          // Returns a customized version of the route template as a string.
          var _getRoute = _.partialRight(util.format, baseRoute);

          var _getRestRoute = _getRoute;
          // Returns a customized version of the route template as a string for REST
          if (config.restPrefix) _getRestRoute = _.partialRight(util.format, baseRestRoute);

          // Mix in the known associations for this model to the route options.
          routeOpts = _.merge({ associations: _.cloneDeep(Model.associations) }, routeOpts);

          // Binds a route to the specifed action using _getAction, and sets the action and controller
          // options for req.options
          var _bindRoute = function (path, action, options) {
            options = options || routeOpts;
            options = _.extend({}, options, {action: action, controller: controllerId});
            sails.router.bind ( path, _getAction(action), null, options);
          };

          // Bind URL-bar "shortcuts"
          // (NOTE: in a future release, these may be superceded by embedding actions in generated controllers
          //  and relying on action blueprints instead.)
          if ( config.shortcuts ) {
            sails.log.silly('Aggregate: Binding shortcut blueprint/shadow routes for model ', modelId, ' on controller:', controllerId);

            _bindRoute(_getRoute('%s/aggregate'), 'aggregate');
            _bindRoute(_getRoute('%s/count'), 'count');
          }

          // Bind "rest" blueprint/shadow routes
          if ( config.rest ) {
            sails.log.silly('Aggregate: Binding RESTful blueprint/shadow routes for model+controller:', controllerId);

            _bindRoute(_getRestRoute('get %s/aggregate'), 'aggregate');
            _bindRoute(_getRestRoute('get %s/count'), 'count');
          }
        }
      });
    },

  }
};

