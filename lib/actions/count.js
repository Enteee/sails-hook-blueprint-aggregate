/**
 * Module dependencies
 */
const actionUtil = require('../actionUtil');
const _ = require('@sailshq/lodash');

/**
 * Count Records
 *
 *  get   /:modelIdentity
 *   *    /:modelIdentity/count
 *
 * An API call to count model instances from the data adapter
 * using the specified criteria.
 *
 * Optional:
 * @param {Object} where       - the find criteria (passed directly to the ORM)
 * @param {String} groupBy     - group count based on this attribute(s)
 */

module.exports = function (req, res) {
  // note: we don't use model.count(criteria) here because
  // it seems to be prone to sql injections as it evaluates
  // the criteria 'groupBy' and and appends what ever is in there to
  // the query. This has the effect that we won't use the count()
  // of the dbms, but instead count everything here on the server
  actionUtil.parseModel(req)
  .find()
  .where(actionUtil.parseCriteria(req))
  .exec((err, matchingRecords) => {
    if(err) return res.serverError(err);
    const groupBy = actionUtil.parseModelAttrFromParam(req, 'groupBy');
    console.log(groupBy);
    if(!_.isArray(groupBy)){
      return res.ok([
        {count: matchingRecords.length}
      ]);
    }
    res.ok([
      _(matchingRecords)
      .countBy(
        (x) => _(groupBy).map(group => x[group])
      )
      .value()
    ]);
  });
};
