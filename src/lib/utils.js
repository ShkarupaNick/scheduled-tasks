/* eslint-disable consistent-return */
const log = require('./logger')();

/** middlerify function
 * @param asyncFn - function which need be middleware */
exports.middlerifyAsync = asyncFn => async (req, res, next) => {
  try {
    // if you're going to pass `next` here, please don't - it's called already below
    await asyncFn(req, res);
  } catch (e) {
    log.error(e);
    return next(e);
  }
  next();
};
