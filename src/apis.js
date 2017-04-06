/*jshint globalstrict:true*/
'use strict';

function hashKey(value) {
	var type = typeof value;
	var uniqueId = value;
	if(type === 'function' || (type === 'object' && value !== null)) {
		if(value.$$hashKey === undefined) {
			uniqueId = value.$$hashKey = _.uniqueId();
		} else if (typeof value.$$hashKey === 'function') {
			uniqueId = value.$$hashKey();
		} else {
			uniqueId = value.$$hashKey;
		}
	} 

	return type + ":" + uniqueId;
}

function HashMap() {
}

HashMap.prototype = {
	constructor: HashMap, 
	get: function(key) {
		return this[hashKey(key)];
	}, 
	put: function(key, value) {
		this[hashKey(key)] = value;
	},
	remove: function(key) {
		var hash = hashKey(key);
		var value = this[hash];
		delete this[hash];
		return value;
	}
}