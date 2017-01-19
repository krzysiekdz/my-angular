/* jshint globalstrict: true*/
/* global setupModuleLoader: false*/
'use strict';

describe('setupModuleLoader', function() {

	beforeEach(function() {
		delete window.angular;
	});

	it('exposes angular on the window', function() {
		setupModuleLoader(window);
		expect(window.angular).toBeDefined();
	});

	it('creates angular just once', function() {
		setupModuleLoader(window);
		var ng = window.angular;
		setupModuleLoader(window);
		expect(window.angular).toBe(ng);
	});

	it('exposes the angular module function', function() {
		setupModuleLoader(window);
		expect(window.angular.module).toBeDefined();
	});

	it('creates angular module function just once', function() {
		setupModuleLoader(window);
		var module = window.angular.module;
		setupModuleLoader(window);
		expect(window.angular.module).toBe(module);
	});

});

describe('modules', function() {

	beforeEach(function() {
		setupModuleLoader(window);
	});

	it('allows registering a module', function() {
		var module = angular.module('mod1', []);
		expect(module).toBeDefined();
		expect(module.name).toBe('mod1');
	});

	it('replaces a module when registered the same again', function() {
		var module1 = angular.module('mod1', []);
		var module2 = angular.module('mod1', []);
		expect(module1).not.toBe(module2);
	});

	it('attaches the requires array to the registered module', function() {
		var module = angular.module('mod1', ['mod2']);
		expect(module).toBeDefined();
		expect(module.requires).toEqual(['mod2']);
	});

	it('allows getting a module', function() {
		var module1 = angular.module('mod1', []);
		var module2 = angular.module('mod1');
		expect(module2).toBeDefined();
		expect(module1).toBe(module2);
	});

	it('allows getting a module', function() {
		expect(function() {
			angular.module('moduleXYZ');
		}).toThrow();
	});

	it('does not allow a module to be called hasOwnProperty', function() {
		expect(function() {
			angular.module('hasOwnProperty', []);
		}).toThrow();
	});


});