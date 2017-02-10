/**
 * Module dependencies
 */
const actionUtil = require('../actionUtil');
const _ = require('@sailshq/lodash');

/**
 * Aggregate Records
 *
 *  get   /:modelIdentity
 *   *    /:modelIdentity/aggregate
 *
 * An API call to aggregate and return model instances from the data adapter
 * using the specified criteria.  
 *
 * Optional:
 * @param {String} groupBy     - group aggregation based on this attribute(s)
 * @param {String} sum         - SUM() this attribute(s)
 * @param {String} avg         - AVERAGE() this attribute(s)
 * @param {String} min         - MIN() this attribute(s)
 * @param {String} max         - MAX() this attribute(s)
 * @param {String} max         - MAX() this attribute(s)
 * @param {Object} where       - the find criteria (passed directly to the ORM)
 * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
 * @param {Integer} skip       - the number of records to skip (useful for pagination)
 * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */

module.exports = function (req, res) {

  const query = actionUtil.parseModel(req)
  .find()
  .where(actionUtil.parseCriteria(req))
  .limit(actionUtil.parseLimit(req))
  .skip(actionUtil.parseSkip(req));

  function addToQueryIfParamExists(name){
    const param = actionUtil.parseModelAttrFromParam(req, name);
    if(param) query[name](param);
  }

  addToQueryIfParamExists('groupBy');
  addToQueryIfParamExists('sum');
  addToQueryIfParamExists('average');
  addToQueryIfParamExists('min');
  addToQueryIfParamExists('max');
  addToQueryIfParamExists('sort');

  actionUtil.populateRequest(query, req);

  query.exec((err, matchingRecords) => {
    if (err) return res.serverError(err);
    res.ok(matchingRecords);
  });
};
