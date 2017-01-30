/* jshint globalstrict: true */
/* global angular: false */
'use strict';

function createInjector(modulesToLoad) {

	var cache = {};
	var loadedModules = {};

	var $provide = {
		constant: function(key, value) {
			if(key === 'hasOwnProperty') {
				throw 'hasOwnProperty is not valid constant name!';
			}
			cache[key] = value;
		},
	};

	function invoke (fn) {
		if(fn.$inject) {
			var args = _.map(fn.$inject, function(key) {
				if(_.isString(key)) {
					return cache[key];
				} else {
					throw 'Incorrect injection token! Expected a string, got: (value=' + key + ', type=' + (typeof key) + ')' ;
				}
			});
			return fn.apply(null, args);
		}
	}

	_.forEach(modulesToLoad, function loadModules(moduleName) {
		if(!loadedModules.hasOwnProperty(moduleName)) {
			loadedModules[moduleName] = true;
			var module = angular.module(moduleName);
			if(module.requires.length > 0) {
				_.forEach(module.requires, loadModules);
			}
			_.forEach(module._invokeQueue, function(invokeArgs) {
				var method = invokeArgs[0];
				var args = invokeArgs[1];
				$provide[method].apply($provide, args);
			});
		}
	});

	return {
		has: function(key) {
			return cache.hasOwnProperty(key);
		},
		get: function(key) {
			return cache[key];
		},
		invoke: invoke,
	};
}