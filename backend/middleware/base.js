const { getFilter, getSort } = require("../utils/modelHelper");

const pagination = (req) => {
  let { take, skip } = req.query;
  req.offset = skip ? Number(skip) : 0;
  req.limit = take ? Number(take) : 2000;
  return req;
};

const sort = (req) => {
  try {
    let { sort } = req.query;
    sort = JSON.parse(sort);
    if (sort) req.order = getSort(sort);
  } catch (error) {
    req.order = null;
  }
};

const group = (req) => {
  try {
    let { group } = req.query;
    group = JSON.parse(group);
    if (group) req.group = group;
  } catch (error) {
    req.group = null;
  }
  return req;
};

const select = (req) => {
  try {
    let { select } = req.query;
    select = JSON.parse(select);
    if (select) req.select = select;
  } catch (error) {
    req.select = null;
  }
  return req;
};

const filter = (req) => {
  try {
    let { filter } = req.query;
    let where = [];
    if (filter) getFilter(where, JSON.parse(filter));
    req.where = where;
  } catch (error) {
    req.where = [];
  }
};

exports.list = (req, res, next) => {
  pagination(req);
  sort(req);
  filter(req);
  (group(req), select(req), next());
};

exports.show = (req, res, next) => {
  (select(req), next());
};
