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
		return function(name, requires) { //module function
			if(requires) {	
				return createModule(name, requires, modules);
			} else {
				return gotModule(name, modules);
			}
		}
	});

	function createModule(name, requires, modules) {
		if(name === 'hasOwnProperty') {
			throw 'module name : \"hasOwnProperty\" is not permited.';
		}
		var moduleInstance = {
			name: name,
			requires: requires,
		};

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