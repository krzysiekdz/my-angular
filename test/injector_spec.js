/* jshint globalstrict: true*/
/* global setupModuleLoader: false, createInjector:false, angular: false*/
'use strict';

describe('injector', function() {

	beforeEach(function() {
		delete window.angular;
		setupModuleLoader(window);
	});

	it('can be created', function() {
		var injector = createInjector([]);
		expect(injector).toBeDefined();
	});

	it('has a constant that has been registered to a module', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 13);
		var injector = createInjector(['mod1']);
		expect(injector.has('a')).toBe(true);
	});

	it('does not have a non-registered constant', function() {
		var module = angular.module('mod1', []);
		var injector = createInjector(['mod1']);
		expect(injector.has('a')).toBe(false);
	});

	it('does not allow a constant called hasOwnProperty', function() {
		var module = angular.module('mod1', []);
		module.constant('hasOwnProperty', function(){return false});
		//this returns false, but should be true
		// module.constant('a', 13);
		// var injector = createInjector(['mod1']);
		// expect(injector.has('a')).toBe(true);
		expect(function() {
			createInjector(['mod1']);
		}).toThrow();
	});

	it('can return a registered constant', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 13);
		var injector = createInjector(['mod1']);
		expect(injector.get('a')).toBe(13);
	});

	it('loads the required modules of a module', function() {
		var module1 = angular.module('mod1', []);
		var module2 = angular.module('mod2', ['mod1']);
		module1.constant('a', 13);
		module2.constant('b', 14);
		var injector = createInjector(['mod2']);
		expect(injector.get('a')).toBe(13);
		expect(injector.get('b')).toBe(14);
	});

	it('loads the required modules of a module in any deep', function() {
		var module1 = angular.module('mod1', []);
		var module2 = angular.module('mod2', ['mod1']);
		var module3 = angular.module('mod3', ['mod2']);
		module1.constant('a', 13);
		module2.constant('b', 14);
		module2.constant('c', 15);
		var injector = createInjector(['mod3']);
		expect(injector.get('a')).toBe(13);
		expect(injector.get('b')).toBe(14);
		expect(injector.get('c')).toBe(15);
	});

	it('loads each module only once', function() {
		angular.module('mod1', ['mod2']);
		angular.module('mod2', ['mod1']);

		createInjector(['mod2']);
	});

	it('invokes an annotated function with dependency injection', function() {
		var module = angular.module('mod1', []);
		module.constant('a', 10);
		module.constant('b', 11);
		var injector = createInjector(['mod1']);

		var fn = function(one, two){return one+two;}
		fn.$inject = ['a', 'b'];

		expect(injector.invoke(fn)).toBe(21);
	});

	
});

