/*jslint browser: true, devel: true, windows: true,
forin: true, vars: true, nomen: true, plusplus: true, bitwise: true,
regexp: true, indent: 2, maxerr: 50 */

// this is what you would do if you liked things to be easy:
// var stringifyJSON = JSON.stringify;

// but you don't so you're going to write it from scratch:

var stringifyJSON = function (obj) {
  "use strict";
  var returnString;
  var sortValue = function (element, arrayParent) {
    var i;
    var returnValue = '';
    var keyValueString = '';
    var keyValueArray = [];
    var objKeys;
    var objValue;

    if (typeof element === 'function') {
      if (arrayParent === true) {
        returnValue = 'null';
      }
    }

    if (typeof element === 'symbol') {
      if (arrayParent === true) {
        returnValue = 'null';
      }
    }

    if (element === undefined) {
      if (arrayParent === true) {
        returnValue = 'null';
      }
    }

    if (typeof element === 'boolean') {
      returnValue = element.toString();
    }

    if (typeof element === 'string') {
      returnValue = '"' + element + '"';
    }

    if (typeof element === 'number') {
      if (!isNaN(element) && Number.isFinite(element)) {
        returnValue = element.toString();
      } else if (arrayParent === true) {
        returnValue = 'null';
      }
    }

    if (typeof element === 'object') {
      if (Array.isArray(element)) {
        for (i = 0; i < element.length; i++) {
          keyValueArray.push(sortValue(element[i], true));
        }
        returnValue = '[' + keyValueArray.join(',') + ']';
      } else if (element === null) {
        returnValue = 'null';
      } else {
        objKeys = Object.keys(element);
        for (i = 0; i < objKeys.length; i++) {
          if (typeof element[objKeys[i]] !== 'function' && !(element[objKeys[i]] === undefined)) {
            keyValueString = '"' + objKeys[i] + '":' + sortValue(element[objKeys[i]], false);
            keyValueArray.push(keyValueString);
          }
        }
        returnValue = '{' + keyValueArray.join(',') + '}';
      }
    }

    return returnValue;
  };
  returnString = sortValue(obj);
  return returnString;
};
