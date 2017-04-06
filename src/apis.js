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
	this.hashMap = {};
}

HashMap.prototype = {
	constructor: HashMap, 
	get: function(key) {
		return this.hashMap[key];
	}, 
	put: function(key, value) {
		this.hashMap[key] = value;
	},
}