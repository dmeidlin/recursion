/*jslint browser: true, devel: true, windows: true,
forin: true, vars: true, nomen: true, plusplus: true, bitwise: true,
regexp: true, indent: 2, maxerr: 50 */

// If life was easy, we could just do things the easy way:
// var getElementsByClassName = function (className) {
//   return document.getElementsByClassName(className);
// };

// But instead we're going to implement it from scratch:
var getElementsByClassName = function (className) {
  "use strict";
  var classHitList = [];

  var classSearch = function (node, targetClass) {
    var i;
    if (node.nodeType === document.ELEMENT_NODE) {
      if (node.classList.contains(targetClass)) {
        classHitList.push(node);
      }
    }
    if (node.hasChildNodes()) {
      for (i = 0; i < node.childNodes.length; i++) {
        classSearch(node.childNodes[i], targetClass);
      }
    }
  };

  classSearch(document, className);
  return Array.prototype.slice.apply(classHitList);
};
