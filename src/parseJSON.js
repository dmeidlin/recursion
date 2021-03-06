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
  '{"boolean, true": true, "boolean, false": false, "null": null }',

  // basic nesting
  '{"a":{"b":"c"}}',
  '{"a":["b", "c"]}',
  '[{"a":"b"}, {"c":"d"}]',
  '{"a":[],"c": {}, "b": true}',
  '[[[["foo"]]]]',

  // escaping
  '["\\\\\\"\\"a\\""]',
  '["and you can\'t escape thi\s"]',

  // everything all at once
  '{"CoreletAPIVersion":2,"CoreletType":"standalone",' +
    '"documentation":"A corelet that provides the capability to upload' +
    ' a folderâ€™s contents into a userâ€™s locker.","functions":[' +
    '{"documentation":"Displays a dialog box that allows user to ' +
    'select a folder on the local system.","name":' +
    '"ShowBrowseDialog","parameters":[{"documentation":"The ' +
    'callback function for results.","name":"callback","required":' +
    'true,"type":"callback"}]},{"documentation":"Uploads all mp3 files' +
    ' in the folder provided.","name":"UploadFolder","parameters":' +
    '[{"documentation":"The path to upload mp3 files from."' +
    ',"name":"path","required":true,"type":"string"},{"documentation":' +
    ' "The callback function for progress.","name":"callback",' +
    '"required":true,"type":"callback"}]},{"documentation":"Returns' +
    ' the server name to the current locker service.",' +
    '"name":"GetLockerService","parameters":[]},{"documentation":' +
    '"Changes the name of the locker service.","name":"SetLockerSer' +
    'vice","parameters":[{"documentation":"The value of the locker' +
    ' service to set active.","name":"LockerService","required":true' +
    ',"type":"string"}]},{"documentation":"Downloads locker files to' +
    ' the suggested folder.","name":"DownloadFile","parameters":[{"' +
    'documentation":"The origin path of the locker file.",' +
    '"name":"path","required":true,"type":"string"},{"documentation"' +
    ':"The Window destination path of the locker file.",' +
    '"name":"destination","required":true,"type":"integer"},{"docum' +
    'entation":"The callback function for progress.","name":' +
    '"callback","required":true,"type":"callback"}]}],' +
    '"name":"LockerUploader","version":{"major":0,' +
    '"micro":1,"minor":0},"versionString":"0.0.1"}',
  '{ "firstName": "John", "lastName" : "Smith", "age" : ' +
    '25, "address" : { "streetAddress": "21 2nd Street", ' +
    '"city" : "New York", "state" : "NY", "postalCode" : ' +
    ' "10021" }, "phoneNumber": [ { "type" : "home", ' +
    '"number": "212 555-1234" }, { "type" : "fax", ' +
    '"number": "646 555-4567" } ] }',
  '{\r\n' +
    '          "glossary": {\n' +
    '              "title": "example glossary",\n\r' +
    '      \t\t"GlossDiv": {\r\n' +
    '                  "title": "S",\r\n' +
    '      \t\t\t"GlossList": {\r\n' +
    '                      "GlossEntry": {\r\n' +
    '                          "ID": "SGML",\r\n' +
    '      \t\t\t\t\t"SortAs": "SGML",\r\n' +
    '      \t\t\t\t\t"GlossTerm": "Standard Generalized ' +
    'Markup Language",\r\n' +
    '      \t\t\t\t\t"Acronym": "SGML",\r\n' +
    '      \t\t\t\t\t"Abbrev": "ISO 8879:1986",\r\n' +
    '      \t\t\t\t\t"GlossDef": {\r\n' +
    '                              "para": "A meta-markup language,' +
    ' used to create markup languages such as DocBook.",\r\n' +
    '      \t\t\t\t\t\t"GlossSeeAlso": ["GML", "XML"]\r\n' +
    '                          },\r\n' +
    '      \t\t\t\t\t"GlossSee": "markup"\r\n' +
    '                      }\r\n' +
    '                  }\r\n' +
    '              }\r\n' +
    '          }\r\n' +
    '      }\r\n'
];

var unparseableStrings = [
    '["foo", "bar"',
    '["foo", "bar\\"]'
  ];


var parseJSON = function (inString) {
  "use strict";
  var json = new String(inString);
  var i;
  var key;
  var keyValue;
  var parsedCollection;
  var colonIndex;
  var spaceColonIndex;
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
//    cleanUnparsedElements = cleanUnparsedElements.replace(/\\\"/g,'"').replace(/\\/g,'\\');
      var locateCommas = function () {
      	//locate all of the commmas, but ignore any commas inside nested arrays, objects,
      	//double quotes, or single quotes. 
      	cursor.reset();
      	for (i=0; i < cleanUnparsedElements.length; i++) {
      	  if (cleanUnparsedElements.charAt(i) === ',' && (cursor.isOutsideNest() && cursor.isOutsideDoubleQuote())) {
      	    cursor.commaIndexes.push(i);
      	  }
      	  if (cleanUnparsedElements.charAt(i) === '"' && cursor.isOutsideDoubleQuote() && !(cleanUnparsedElements.charAt(i-1) === '\\')) {
      	    cursor.doubleQuoteBalance = 1;
      	  } else if (cleanUnparsedElements.charAt(i) === '"' && !cursor.isOutsideDoubleQuote() && !(cleanUnparsedElements.charAt(i-1) === '\\')) {
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
      };
    //remove the outer brackets.
    cleanUnparsedElements = cleanUnparsedElements.slice(1,-1);
    locateCommas();
    if (cursor.doubleQuoteBalance > 0 || cursor.squareBracketBalance > 0 || cursor.curlyBraceBalance > 0) {
      throw new SyntaxError("Unexpected end of input")
    }
    cleanUnparsedElements = cleanUnparsedElements.replace(/\\"/g,'"');
    locateCommas();
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
  //remove carriage returns, newlines, and tabs
  cleanUnparsedElements = cleanUnparsedElements.replace(/(\r|\n|\t)/g,'');
  
  //check if an object, array, or single value is to be returned.
   if (cleanUnparsedElements.charAt(0) === '{' && cleanUnparsedElements.charAt(cleanUnparsedElements.length - 1) === '}') {
    splitUnparsedElements();
    //parse the object key/value pairs separated by commas.
    //all key names are surrounded by double quotes.
    parsedCollection = {};
    if (unparsedArrayElements.length === 1 && unparsedArrayElements[0] === '') {
    } else {
      for (i=0; i < unparsedArrayElements.length; i++) {
        colonIndex = unparsedArrayElements[i].indexOf('":');
        spaceColonIndex = unparsedArrayElements[i].indexOf('" :');
        if (colonIndex === -1) {
          key = unparsedArrayElements[i].slice(unparsedArrayElements[i].indexOf('"') + 1,unparsedArrayElements[i].indexOf('" :'));
          //parseJSON is called recursively here to parse the value string.
          keyValue = parseJSON(unparsedArrayElements[i].slice(unparsedArrayElements[i].indexOf('" :') + 3));
        } else if (spaceColonIndex === -1) {
          key = unparsedArrayElements[i].slice(unparsedArrayElements[i].indexOf('"') + 1,unparsedArrayElements[i].indexOf('":'));
          //parseJSON is called recursively here to parse the value string.
          keyValue = parseJSON(unparsedArrayElements[i].slice(unparsedArrayElements[i].indexOf('":') + 2));
        } else if (spaceColonIndex < colonIndex && spaceColonIndex !== -1) {
          key = unparsedArrayElements[i].slice(unparsedArrayElements[i].indexOf('"') + 1,unparsedArrayElements[i].indexOf('" :'));
          //parseJSON is called recursively here to parse the value string.
          keyValue = parseJSON(unparsedArrayElements[i].slice(unparsedArrayElements[i].indexOf('" :') + 3));
        } else if (colonIndex < spaceColonIndex && colonIndex !== -1) {
          key = unparsedArrayElements[i].slice(unparsedArrayElements[i].indexOf('"') + 1,unparsedArrayElements[i].indexOf('":'));
          //parseJSON is called recursively here to parse the value string.
          keyValue = parseJSON(unparsedArrayElements[i].slice(unparsedArrayElements[i].indexOf('":') + 2));
        }
        parsedCollection[key] = keyValue;
      }
    }
  } else if (cleanUnparsedElements.charAt(0) === '[' && cleanUnparsedElements.charAt(cleanUnparsedElements.length - 1) === ']') {
    splitUnparsedElements();
    //parse the array elements separated by commas.
    parsedCollection = [];
    if (unparsedArrayElements.length === 1 && unparsedArrayElements[0] === '') {
    } else {
      for (i=0; i < unparsedArrayElements.length; i++) {
        //parseJSON is called recursively here to parse the value string.
        parsedCollection[i] = parseJSON(unparsedArrayElements[i]);
      }
    }
  } else {
    //add single dummy characters to the front and back of the cleanUnparsedElements
    //so that the same function used for arrays and objects may be called to detect 
    //any unpaired brackets or quotes in cleanUnparsedElements.
    cleanUnparsedElements = '[' + cleanUnparsedElements + ']';
    splitUnparsedElements();
    //throw a SyntaxError if there are any unpaired brackets or quotes.
    // try {
      if (cursor.doubleQuoteBalance > 0 || cursor.squareBracketBalance > 0 || cursor.curlyBraceBalance > 0) {
        throw new SyntaxError("Unexpected end of input")
      }
    // }
    // catch (e) {
    //   console.log(e.message);
    // }

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
//      parsedCollection = parsedCollection.replace(/\\\\/g,'\\');
    }
    //check for a number by running parseFloat on each character and checking that
    //each result isFinite.
    if (isFinite(parseFloat(cleanUnparsedElements))) {
      parsedCollection = parseFloat(cleanUnparsedElements);
    }
   }
  return parsedCollection;
};

// var expected = eval("(" + parseableStrings + ")");
//     document.getElementById('expected').innerHTML = expected;
var result = []; 
var expected = [];
var i;
for (i=0; i < parseableStrings.length; i++) {
  result[i] = parseJSON(parseableStrings[i]);
}
for (i=0; i < unparseableStrings.length; i++) {
  result.push(parseJSON(unparseableStrings[i]));
}
for (i=0; i < parseableStrings.length; i++) {
  expected[i] = JSON.parse(parseableStrings[i]);
}
for (i=0; i < unparseableStrings.length; i++) {
  expected.push(JSON.parse(unparseableStrings[i]));
}

