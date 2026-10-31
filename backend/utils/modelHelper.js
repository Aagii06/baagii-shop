const Sequelize = require("sequelize");
const op = Sequelize.Op;

const operators = {
  "=": op.eq,
  between: op.between,
  contains: op.like,
  notcontains: op.notLike,
  startswith: op.like,
  endswith: op.like,
  "<>": op.ne,
  "<": op.lt,
  ">": op.gt,
  ">=": op.gte,
  "<=": op.lte,
  in: op.in,
  notIn: op.notIn,
};

const getFilterValue = (opString, filterValue) => {
  if (opString === "contains") return "%" + filterValue + "%";
  if (opString === "notcontains") return "%" + filterValue + "%";
  if (opString === "startswith") return "" + filterValue + "%";
  if (opString === "endswith") return "%" + filterValue + "";
  return filterValue;
};

const getFieldName = (fieldName) => {
  if (fieldName.includes(".")) fieldName = "$" + fieldName + "$";
  return fieldName;
};

const getFilter = (query, filter) => {
  if (filter === null) return;
  if (Array.isArray(filter[0]) === false && filter.length === 3) {
    const fieldName = getFieldName(filter[0]);
    const operator = operators[filter[1]];
    const filterValue = getFilterValue(filter[1], filter[2]);
    if (operator != null) {
      // if (["contains", "notcontains", "startswith", "endswith"].includes(filter[1])) {
      //     query.push(
      //         sequelize.where(sequelize.fn("lower", sequelize.col(filter[0])), {
      //             [operator]: sequelize.fn("lower", filterValue)
      //         })
      //     )
      // } else {
      query.push({ [fieldName]: { [operator]: filterValue } });
      //}
    }
  } else if (Array.isArray(filter[0])) {
    let q = {};
    if (filter[1] === "and") {
      query.push({ [op.and]: [] });
      q = query[query.length - 1][op.and];
    } else {
      query.push({ [op.or]: [] });
      q = query[query.length - 1][op.or];
    }
    let index = 0;
    for (let i = 0; i < filter.length; i += 2) {
      q[index] = [];
      getFilter(q[index], filter[i]);
      index++;
    }
  }
  return;
};

const getSort = (sorts) => {
  if (Array.isArray(sorts)) {
    let result = [];
    for (let i = 0; i < sorts.length; i++) {
      const sort = sorts[i];
      // desc байхгүй / false бол өсөхөөр (өмнө нь зөвхөн desc: true ажилладаг байсан)
      if (sort && sort["selector"])
        result.push([
          Sequelize.col(sort["selector"]),
          sort["desc"] === true || sort["desc"] === "true" ? "desc" : "asc",
        ]);
    }
    return result;
  }
  return [];
};

//#region Select

const getAssocation = (model, association) => {
  let associations = model.associations[association];
  if (associations) return { model: associations.target, as: associations.as };
  else return null;
};

const getSelect = (select, model, result) => {
  result = result || {};
  if (!select) return;
  if (Array.isArray(select)) {
    let attributes = select.filter((s) => typeof s === "string");
    if (attributes.filter((s) => s === "*").length === 0)
      result.attributes = attributes;
    let childs = select.filter((s) => typeof s === "object");
    if (childs.length > 0) {
      result.include = [];
      childs.forEach((child) => getSelect(child, model, result.include));
    }
  } else if (!Array.isArray(select) && typeof select === "object") {
    if (Object.keys(select).length === 1) {
      const as = Object.keys(select)[0];
      let association = getAssocation(model, as);
      association && getSelect(select[as], association.model, association);
      result.push(association);
    }
  }
  return;
};

const checkSelect = (inSelect, chSelect, keyName) => {
  if (!keyName && !inSelect) return chSelect;
  let result = chSelect.filter((element) => inSelect.includes(element));
  Object.keys(inSelect).map((k) => {
    if (typeof inSelect[k] === "object") {
      let tt = inSelect[k];
      Object.keys(tt).map((l) => {
        Object.keys(chSelect).map((ck) => {
          if (typeof chSelect[ck] === "object") {
            let ctemp = chSelect[ck];
            Object.keys(ctemp).map((cc) => {
              if (cc === l) {
                let temp = checkSelect(tt[l], ctemp[cc], l);
                result = result.concat(temp);
              }
            });
          }
        });
      });
    }
  });
  if (keyName) return { [keyName]: result };
  return result;
};

//#endregion

module.exports = { getFilter, getSort, getSelect, checkSelect };
