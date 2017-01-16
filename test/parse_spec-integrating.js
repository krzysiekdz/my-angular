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

		// it('test', function() {
		// 	// var fn = parse('[1,2, 3+4*2]');
		// 	var ast = new AST(new Lexer()).build('{a:1}.b');
		// 	console.log(ast);
		// });

		it('marks integers constant', function() {
			var fn = parse('12');
			expect(fn.constant).toBe(true);
		});

		it('marks strings constant', function() {
			var fn = parse('"ala ma kota"');
			expect(fn.constant).toBe(true);
		});

		it('marks booleans constant', function() {
			var fn = parse('true');
			expect(fn.constant).toBe(true);
		});

		it('marks identifiers non-constant', function() {
			var fn = parse('a');
			expect(fn.constant).toBe(false);
		});

		it('marks arrays constant when elements are constant', function() {
			expect(parse('[1,2,3]').constant).toBe(true);
			expect(parse('[1, [2, [3]]]').constant).toBe(true);
			expect(parse('[1,2,a]').constant).toBe(false);
			expect(parse('[1, [2, [a]]]').constant).toBe(false);
		});

		it('marks objects constant when values are constant', function() {
			expect(parse('{a:1, b:2}').constant).toBe(true);
			expect(parse('{a:1, b: {c:3}}').constant).toBe(true);
			expect(parse('{a:1, b:cat}').constant).toBe(false);
			expect(parse('{a:1, b: {c:cat}}').constant).toBe(false);
		});

		it('marks this as non-constant', function() {
			expect(parse('this').constant).toBe(false);
		});

		it('marks non-computed lookup constant when object is constant', function() {
			expect(parse('{a:1}.a').constant).toBe(true);
			expect(parse('a.b').constant).toBe(false);
		});

		it('marks computed lookup constant when object and key are', function() {
			expect(parse('{a:1}["a"]').constant).toBe(true);
			expect(parse('a["b"]').constant).toBe(false);
			expect(parse('{a:1}[b]').constant).toBe(false);
			expect(parse('a[b]').constant).toBe(false);
		});

		it('marks functions calls non-constant', function() {
			expect(parse('a()').constant).toBe(false);
		});

		it('marks filters constants if arguments are', function() {
			register('myFilter', function() {
				return _.identity;
			});
			expect(parse('[1,2,3] | myFilter').constant).toBe(true);
			expect(parse('[1,2,a] | myFilter').constant).toBe(false);
			expect(parse('[1,2,3] | myFilter:12').constant).toBe(true);
			expect(parse('[1,2,3] | myFilter:a').constant).toBe(false);
		});

		it('marks assignment constant when both sides are', function() {
			expect(parse('1=2').constant).toBe(true);
			expect(parse('a=2').constant).toBe(false);
			expect(parse('1=b').constant).toBe(false);
			expect(parse('a=b').constant).toBe(false);
		});

		it('marks unaries constant when arguments are constant', function() {
			expect(parse('+13').constant).toBe(true);
			expect(parse('+a').constant).toBe(false);
		});

		it('marks binaries constant when both arguments are constant', function() {
			expect(parse('1 + 2').constant).toBe(true);
			expect(parse('1 + 2').literal).toBe(false);
			expect(parse('1 + b').constant).toBe(false);
			expect(parse('a + 1').constant).toBe(false);
			expect(parse('a + b').constant).toBe(false);
		});

		it('marks logical constant when both arguments are constant', function() {
			expect(parse('true && false').constant).toBe(true);
			expect(parse('true && false').literal).toBe(false);
			expect(parse('true && a').constant).toBe(false);
			expect(parse('a && false').constant).toBe(false);
			expect(parse('a && b').constant).toBe(false);
		});

		it('marks ternaries constant when all arguments are', function() {
			expect(parse('true ? 1:2').constant).toBe(true);
			expect(parse('a ? 1:2').constant).toBe(false);
			expect(parse('true ? a:2').constant).toBe(false);
			expect(parse('true ? 1:b').constant).toBe(false);
			expect(parse('a ? b:c').constant).toBe(false);
		});

		it('removes constant watches after first invocation', function() {
			var scope = new Scope();
			scope.$watch('[1,2,3]', function() {});
			scope.$digest();

			expect(scope.$$watchers.length).toBe(0);
		});

		it('accepts one-time watches', function() {
			var scope = new Scope();
			var a;
			scope.a = 12;
			scope.$watch('::a', function(n,o,s) {
				a = n;
			});
			scope.$digest();

			expect(a).toBe(12);
		});

		it('accepts one-time watches', function() {
			var scope = new Scope();
			scope.a = 12;
			scope.$watch('::a', function(n,o,s) {});
			scope.$digest();

			expect(scope.$$watchers.length).toBe(0);
		});

		it('does not remove one-time watches until value is defined', function() {
			var scope = new Scope();
			scope.$watch('::a', function(n,o,s) {});
			scope.$digest();
			expect(scope.$$watchers.length).toBe(1);

			scope.$digest();
			expect(scope.$$watchers.length).toBe(1);

			scope.a = 10;
			scope.$digest();
			expect(scope.$$watchers.length).toBe(0);
		});

		it('does not remove one-time watches until value stays defined', function() {
			var scope = new Scope();
			scope.a = 2;
			scope.$watch('::a', function(n,o,s) {});

			var unwatchDeleter = scope.$watch('a', function() {
				delete scope.a;
			});

			scope.$digest();
			expect(scope.$$watchers.length).toBe(2);

			scope.$digest();
			expect(scope.$$watchers.length).toBe(2);

			scope.a = 10;
			unwatchDeleter();
			scope.$digest();
			expect(scope.$$watchers.length).toBe(0);
		});

		it('does not remove one-time watches before all array items defined', function() {
			var scope = new Scope();
			scope.$watch('::[1,2,a]', function(n,o,s) {}, true);

			scope.$digest();
			expect(scope.$$watchers.length).toBe(1);

			scope.$digest();
			expect(scope.$$watchers.length).toBe(1);

			scope.a = 10;
			scope.$digest();
			expect(scope.$$watchers.length).toBe(0);
		});

		it('does not remove one-time watches before all array items defined', function() {
			var scope = new Scope();
			scope.$watch('::{a:1, b:2, c:d}', function(n,o,s) {}, true);

			scope.$digest();
			expect(scope.$$watchers.length).toBe(1);

			scope.$digest();
			expect(scope.$$watchers.length).toBe(1);

			scope.d = 10;
			scope.$digest();
			expect(scope.$$watchers.length).toBe(0);
		});

		it('does not re-evaluate an array if its contents do not change', function() {
			var scope = new Scope();
			var arr = [];
			scope.a = 1;
			scope.b = 2;
			scope.c = 3;
			scope.$watch('[a,b,c]', function(n,o,s) {
				arr.push(n);
			});

			// try {
				scope.$digest();
				expect(arr.length).toBe(1);
				expect(arr[0]).toEqual([1,2,3]);
			// } catch(e){console.log(arr);}

			scope.$digest();
			expect(arr.length).toBe(1);

			scope.c = 10;
			scope.$digest();
			expect(arr.length).toBe(2);
			expect(arr[1]).toEqual([1,2,10]);
		});

		it('testing toWatch', function() {
			expect(parse('[a,b,c]', true)({a: 1, b:2})).toEqual(3);
		});

	});
	
});