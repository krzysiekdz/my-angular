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

	
});

