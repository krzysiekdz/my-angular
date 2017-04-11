/* jshint globalstrict: true*/
'use strict';

function setupModuleLoader(window) {

	function ensure(obj, name, factory) {
		return (obj[name] || (obj[name] = factory()) );
	}

	var angular = ensure(window, "angular", Object);


	//factory for the function angular.module; called only once
	ensure(angular, 'module', function() { //factory
		var modules = {};
		return function(name, requires, configFn) { //module function
			if(requires) {	
				return createModule(name, requires, modules, configFn);
			} else {
				return gotModule(name, modules);
			}
		}
	});

	function createModule(name, requires, modules, configFn) {
		if(name === 'hasOwnProperty') {
			throw 'module name : \"hasOwnProperty\" is not permited.';
		}
		
		var invokeQueue = [];
		var configBlocks = [];
		var runBlocks = [];

		function invokeLater(method, arrayFn, queue) {
			var q = queue || invokeQueue;
			var fn = arrayFn || 'push';

			return function() {
				q[fn]([method, arguments]);
			};
		}

		var moduleInstance = {
			name: name,
			requires: requires,
			constant: invokeLater('constant', 'unshift'),
			provider: invokeLater('provider'),
			config: invokeLater('config', null, configBlocks),
			run: invokeLater('run', null, runBlocks),
			factory: invokeLater('factory'),
			_invokeQueue: invokeQueue,
			_configBlocks: configBlocks,
			_runBlocks: runBlocks,
		};

		if(_.isFunction(configFn)) {
			moduleInstance.config(configFn);
			// configBlocks.push(['config', [configFn]]);
		}

		modules[name] = moduleInstance;

		return moduleInstance;
	}

	

	function gotModule(name, modules) {
		if(modules.hasOwnProperty(name)) {
			return modules[name];
		} else {
			throw 'Module \"' + name + '\" does not exist.';
		}
		
	}
}