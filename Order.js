const Orders = [];

exports.AddOrder = ({ pair, amount0, amount1, deadline }) => {
  const index = Orders.includesPartial({ pair, amount0, amount1, deadline });
  if (index !== null) {
    console.log("invalid operation");
    return false;
  }
  Orders.push({ pair, amount0, amount1, deadline, id: Orders.length });
  return true;
};

exports.RemoveOrder = (id) => {
  const index = Orders.includesPartial({ id: id });
  if (index === null) {
    console.log("Order does not exist");
    return false;
  }
  Orders.splice(index, 1);
  console.log("Order cancelled");
  return true;
};

exports.GetOrders = () => {
  return [...Orders];
};

Object.defineProperty(Object.prototype, "partialMatch", {
  value: function (fields) {
    for (let key of Object.keys(fields)) {
      if (Object.keys(this).includes(key)) {
        if (this[key] === fields[key]) continue;
        return false;
      } else {
        return false;
      }
    }
    return true;
  },
});

Object.defineProperty(Array.prototype, "includesPartial", {
  value: function (fields) {
    for (let i = 0; i < this.length; i++) {
      const obj = this[i];
      if (obj.partialMatch(fields)) {
        return i;
      }
    }
    return null;
  },
});

Object.defineProperty(Array.prototype, "includesPartialAll", {
  value: function (fields) {
    const retIndex = [];
    for (let i = 0; i < this.length; i++) {
      const obj = this[i];
      if (obj.partialMatch(fields)) {
        retIndex.push(i);
      }
    }
    if (retIndex.length === 0) return null;
    return retIndex;
  },
});
