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

		function invokeLater(method) {
			if(method === 'constant') {
				return function() {
					invokeQueue.unshift([method, arguments]);
				}
			} else if (method === 'config') {
				return function() {
					configBlocks.push([method, arguments]);
				}
			}
			
			return function() {
				invokeQueue.push([method, arguments]);
			};
		}

		var moduleInstance = {
			name: name,
			requires: requires,
			constant: invokeLater('constant'),
			provider: invokeLater('provider'),
			config: invokeLater('config'),
			_invokeQueue: invokeQueue,
			_configBlocks: configBlocks,
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