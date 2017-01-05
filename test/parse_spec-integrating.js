/* jshint globalstrict: true */
/* global parse: false */
/* global Scope: false */

describe("parse", function(){

	describe('integrating', function() {
		it('returns the function itself whe given one', function() {
			var fn = function(){};
			expect(parse(fn)).toBe(fn);
		});

		it('still returns a function when given no argument', function() {
			expect(parse()).toEqual(jasmine.any(Function));
		});

		it('accepts expressions for a watch functions', function() {
			var a;
			var scope = new Scope();
			scope.b = 10;
			scope.$watch('b', function(n,o,s) {
				a = n;
			});
			scope.$digest();
			expect(a).toEqual(10);
		});

		it('accepts expressions for a watch functions', function() {
			var a;
			var scope = new Scope();
			scope.b = [1,2,3];
			scope.$watchCollection('b', function(n,o,s) {
				a = n;
			});
			scope.$digest();
			expect(a).toEqual([1,2,3]);
		});

		it('accepts expressions in $eval', function() {
			var scope = new Scope();
			expect(scope.$eval('42')).toEqual(42);
		});

		it('accepts expressions in $apply', function() {
			var scope = new Scope();
			scope.a = function() {return 21;}
			expect(scope.$apply('a()')).toEqual(21);
		});

		it('accepts expressions in $evalAsync', function(done) {
			var scope = new Scope();
			var called = false;
			scope.a = function() {called = true;}
			scope.$evalAsync('a()');
			scope.$$postDigest(function() {
				expect(called).toBe(true);
				done();
			});
		});

	});
	
});