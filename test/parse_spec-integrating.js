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

		it('marks integers literal', function() {
			var fn = parse('42');
			expect(fn.literal).toBe(true);
		});

		it('marks string literal', function() {
			var fn = parse('"abc"');
			expect(fn.literal).toBe(true);
		});

		it('marks boolean literal', function() {
			var fn = parse('true');
			expect(fn.literal).toBe(true);
		});

		it('marks arrays literal', function() {
			var fn = parse('[1,2, "ab", variable]');
			expect(fn.literal).toBe(true);
		});

		it('marks objects literal', function() {
			var fn = parse('{a:1, b:"2", c:ala}');
			expect(fn.literal).toBe(true);
		});

		it('marks unary expressions non-literal', function() {
			var fn = parse('!true');
			expect(fn.literal).toBe(false);
		});

		it('marks binary expressions non-literal', function() {
			var fn = parse('1+2');
			expect(fn.literal).toBe(false);
		});

		it('test', function() {
			// var fn = parse('[1,2, 3+4*2]');
			var ast = new AST(new Lexer()).build('[1,2,3*4+2]');
			console.log(ast);
		});

	});
	
});