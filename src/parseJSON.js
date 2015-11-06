/*jslint browser: true, devel: true, windows: true,
forin: true, vars: true, nomen: true, plusplus: true, bitwise: true,
regexp: true, indent: 2, maxerr: 50 */

// this is what you would do if you were one to do things the easy way:
// var parseJSON = JSON.parse;

// but you're not, so you'll write it from scratch:
//var parseJSON = function (json) {
//  "use strict";
//return eval("(" + json + ")");
//};

var parseableStrings = [
  //basic stuff
  '[]',
  '{"foo": ""}',
  '{}',
  '{"foo": "bar"}',
  '["one", "two"]',
  '{"a": "b", "c": "d"}',
  '[null,false,true]',
  '{"foo": true, "bar": false, "baz": null}',
  '[1, 0, -1, -0.3, 0.3, 1343.32, 3345, 0.00011999999999999999]',
  '{"boolean, true": true, "boolean, false": false, "null": null }'
];


var parseJSON = function (inString) {
  "use strict";
  var json = new String(inString);
  var i;
  var key;
  var keyValue;
  var parsedCollection;
  var stringArraySansBrackets = "";
  var unparsedArrayElements = [];
  var unparsedObjKeyValuePairs;
  var startUnparsedElements;
  var endUnparsedElements;
  var cleanUnparsedElements = '';
  function Scan(locationInString, doubleQuoteBalance, singleQuoteBalance, curlyBraceBalance, squareBracketBalance, commaIndexes) {
    this.locationInString = locationInString;
    this.doubleQuoteBalance = doubleQuoteBalance;
    this.singleQuoteBalance = singleQuoteBalance;
    this.curlyBraceBalance = curlyBraceBalance;
    this.squareBracketBalance = squareBracketBalance;
    this.commaIndexes = commaIndexes;
  }
  Scan.prototype.reset = function () {
    this.locationInString = 0;
    this.doubleQuoteBalance = 0;
    this.singleQuoteBalance = 0;
    this.curlyBraceBalance = 0;
    this.squareBracketBalance = 0;
    this.commaIndexes = [];
  }
  Scan.prototype.isOutsideNest = function () {
    return (this.doubleQuoteBalance > 0) || (this.curlyBraceBalance === 0 && this.squareBracketBalance === 0);
  };
  Scan.prototype.isOutsideDoubleQuote = function () {
    return (this.doubleQuoteBalance === 0);
  };
  var cursor = new Scan(0, 0, 0, 0, 0, []);
/////////////////////////////////////////////////////////////////////////////
  var splitUnparsedElements = function () {
    //remove the outer brackets.
    cleanUnparsedElements = cleanUnparsedElements.slice(1,-1);
    //locate all of the commmas, but ignore any commas inside nested arrays, objects,
    //double quotes, or single quotes. 
    cursor.reset();
    for (i=0; i < cleanUnparsedElements.length; i++) {
      if (cleanUnparsedElements.charAt(i) === ',' && (cursor.isOutsideNest() && cursor.isOutsideDoubleQuote())) {
        cursor.commaIndexes.push(i);
      }
      if (cleanUnparsedElements.charAt(i) === '"' && cursor.isOutsideDoubleQuote()) {
        cursor.doubleQuoteBalance = 1;
      } else if (cleanUnparsedElements.charAt(i) === '"' && !cursor.isOutsideDoubleQuote()) {
        cursor.doubleQuoteBalance = 0;
      }
      if (cleanUnparsedElements.charAt(i) === '{') {
        cursor.curlyBraceBalance++;
      }
      if (cleanUnparsedElements.charAt(i) === '}') {
        cursor.curlyBraceBalance--;
      }
      if (cleanUnparsedElements.charAt(i) === '[') {
        cursor.squareBracketBalance++;
      }
      if (cleanUnparsedElements.charAt(i) === ']') {
        cursor.squareBracketBalance--;
      }
    }

    //slice off each string between the commas and copy into an array.
    unparsedArrayElements[0] = cleanUnparsedElements.slice(0, cursor.commaIndexes[0]);
    if (cursor.commaIndexes.length > 1) {
      for (i=1; i < cursor.commaIndexes.length; i++) {
        unparsedArrayElements[i] = cleanUnparsedElements.slice(cursor.commaIndexes[i - 1] + 1, cursor.commaIndexes[i]);
      }
    }
    unparsedArrayElements[cursor.commaIndexes.length] = cleanUnparsedElements.slice(cursor.commaIndexes[cursor.commaIndexes.length -1] + 1);
  };
/////////////////////////////////////////////////////////////////////////////
  //clean up the input string by removing leading and trailing white spaces.
  i = 0;
  while (i < json.length && json.charAt(i) === ' ') {
    i++;
  }
  startUnparsedElements = i;
  i = 0;
  while (i < json.length && json.charAt(json.length - 1 - i) === ' ') {
    i++;
  }
  endUnparsedElements = json.length - 1 - i;
  cleanUnparsedElements  = json.slice(startUnparsedElements,endUnparsedElements + 1);
  
  //check if an object, array, or single value is to be returned.
   if (cleanUnparsedElements.charAt(0) === '{' && cleanUnparsedElements.charAt(cleanUnparsedElements.length - 1) === '}') {
    splitUnparsedElements();
    //parse the object key/value pairs separated by commas.
    //all key names are surrounded by double quotes.
    parsedCollection = {};
    for (i=0; i < unparsedArrayElements.length; i++) {
      key = unparsedArrayElements[i].slice(unparsedArrayElements[i].indexOf('"') + 1,unparsedArrayElements[i].indexOf('":'));
      //parseJSON is called recursively here to parse the value string.
      keyValue = parseJSON(unparsedArrayElements[i].slice(unparsedArrayElements[i].indexOf('":') + 2));
      parsedCollection[key] = keyValue;
    }
  } else if (cleanUnparsedElements.charAt(0) === '[' && cleanUnparsedElements.charAt(cleanUnparsedElements.length - 1) === ']') {
    splitUnparsedElements();
    //parse the array elements separated by commas.
    parsedCollection = [];
    for (i=0; i < unparsedArrayElements.length; i++) {
      //parseJSON is called recursively here to parse the value string.
      parsedCollection[i] = parseJSON(unparsedArrayElements[i]);
    }
  } else {
    //parse the undefined, string, null, or boolean
    if (cleanUnparsedElements === 'true') {
      parsedCollection = true;
    }
    if (cleanUnparsedElements === 'false') {
      parsedCollection = false;
    }
    if (cleanUnparsedElements === 'null') {
      parsedCollection = null;
    }
    if (cleanUnparsedElements === 'undefined') {
      parsedCollection = undefined;
    }
    //return a string if quotes are present at start and end.
    if (cleanUnparsedElements.charAt(0) === '"' && cleanUnparsedElements.charAt(cleanUnparsedElements.length - 1) === '"') {
      parsedCollection = cleanUnparsedElements.slice(1,-1);
    }
    //check for a number by running parseFloat on each character and checking that
    //each result isFinite.
    if (isFinite(parseFloat(cleanUnparsedElements))) {
      parsedCollection = parseFloat(cleanUnparsedElements);
    }
   }
  return parsedCollection;
};

var expected = eval("(" + parseableStrings + ")");
    document.getElementById('expected').innerHTML = expected;
var result; 
//var i;
//for (i=0; i > parseableStrings.length; i++) {
//  result[i] = parseJSON(parseableStrings[i]);
//}
result = parseJSON(parseableStrings[9]);
    document.getElementById('result').innerHTML = result;
