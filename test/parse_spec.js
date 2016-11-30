/* jshint globalstrict: true */
/* global parse: false */

describe("parse", function(){

	it('can parse an integer', function() {
		var fn = parse('0002');
		expect(fn).toBeDefined();
		expect(fn()).toBe(2);

		// try {
		// 	console.log(new Lexer().lex('42 43 458 1 01 '));
		// } catch (e) {
		// 	console.log(e);
		// }
	});

	it('can parse a float', function() {
		var fn = parse('4.2');
		expect(fn()).toBe(4.2);

		// try {
		// 	console.log(new Lexer().lex('0.42 4.3 458.0001 1 001.999999999  1.2.3'));
		// } catch (e) {
		// 	console.log(e);
		// }
	});

	it('can parse a float without an integer part', function() {
		var fn = parse('.25');
		expect(fn()).toBe(0.25);

		// try {
		// 	console.log(new Lexer().lex('.35 .456 0.32 2.'));
		// } catch (e) {
		// 	console.log(e);
		// }
	});

	it('can parse a scientific notation', function() {
		var fn = parse('.25e2');
		expect(fn()).toBe(25);

		// try {
		// 	console.log(new Lexer().lex('.35e2 34e2 25E3 45e+3 .45e+2 25e-2 25e1.2'));
		// } catch (e) {
		// 	console.log(e);
		// } //ciekawy jest ostatni przypadek, tj: 25e1.2 - odczyta jako 250 i 0.2
	});

	// it('can parse negative integer', function() {
	// 	var fn = parse('-25');
	// 	expect(fn).toBeDefined();
	// 	expect(fn()).toBe(-25);
	// });

	it('can parse strings in double quotes', function() {
		var fn = parse('"hello world"');
		expect(fn()).toBe('hello world');
		// try {
		// 	console.log(new Lexer().lex('"hello world 23 45"'));
		// } catch (e) {
		// 	console.log(e);
		// }
	});

	it('can parse strings in single quotes', function() {
		var fn = parse("'hello world'");
		expect(fn()).toBe('hello world');
	});

	it('can parse strings in special cases', function() {
		var fn = parse("'hello world 1234 !@#$%^&*()'");
		expect(fn()).toBe('hello world 1234 !@#$%^&*()');

		// try {
		// 	console.log(new Lexer().lex('"hello world 1234 !@#$%^&*(),<>/?" 23.5 .5'));
		// } catch (e) {
		// 	console.log(e);
		// }
	});

	it('can parse string escape characters', function() {
		var a = 'ala\\nma';
		try {
			var fn = parse("'" + a +"'");
			expect(fn()).toEqual("ala\nma");
			// console.log(fn());
		} catch (e) {
			console.log(e);
		}

		// var lex;
		// try {
		// 	lex = new Lexer();
		// 	lex.lex("'a\nb'");
		// 	console.log(lex.tokens);
		// } catch (e) {
		// 	console.log(e, lex.tokens);
		// }
	});

	it('can parse string escape characters', function() {
		var a = 'ala\\\'ma';
		try {
			var fn = parse("'" + a +"'");
			expect(fn()).toEqual("ala\'ma");
			// console.log(fn());
		} catch (e) {
			console.log(e);
		}
	});

	it('can parse string escape characters', function() {
		var a = 'ala\\\"ma\"';
		try {
			var fn = parse("'" + a +"'");
			expect(fn()).toEqual("ala\"ma\"");
			// console.log(fn());
		} catch (e) {
			console.log(e);
		}
	});

	it('can parse string special cases like \\n', function() {
		var a = 'ala\nma\nkota';
		try {
			var fn = parse("'" + a +"'");
			expect(fn()).toEqual("ala\nma\nkota");
			// console.log(fn());
		} catch (e) {
			console.log(e);
		}
	});

	it('can parse string with wrong escape characters like \\c \\d \\e etc and treats them like normal characters', function() {
		var a = '\\ala ma \\kota';
		try {
			var fn = parse("'" + a +"'");
			expect(fn()).toEqual("ala ma kota");
			// console.log(fn());
		} catch (e) {
			console.log(e);
		}
	});

	it('will not parse string with missmatching quotes', function() {
		expect(function(){parse("'ala\"")}).toThrow();
	});


	it('can parse unicode characters', function() {
		var a = 'ala\\u000ama';
		try {
			var fn = parse("'" + a +"'");
			expect(fn()).toEqual("ala\nma");
			// console.log(fn());
		} catch (e) {
			console.log(e);
		}
	});

	it('will not parse string with invalid unicode escapes', function() {
		expect(function(){parse("'\\u00MK'")}).toThrow();

		// var lex;
		// try {
		// 	lex = new Lexer();
		// 	lex.lex("'\\u0001'");
		// 	console.log(lex.tokens);
		// } catch (e) {
		// 	console.log(e, lex.tokens);
		// }
	});

	it('will parse null', function() {
		expect(parse('null')()).toEqual(null);

		// var lex;
		// try {
		// 	lex = new Lexer();
		// 	lex.lex("2$false_@23 23");
		// 	console.log(lex.tokens);
		// } catch (e) {
		// 	console.log(e, lex.tokens);
		// }
	});

	it('will parse true', function() {
		expect(parse('true')()).toBe(true);
	});

	it('will parse false', function() {
		expect(parse('false')()).toBe(false);
	});

	it('will parse empty array []', function() {
		expect(parse('[]')()).toEqual([]);
		// var fn = parse('[]');
		// console.log(fn());

		// var tokens;
		// try {
		// 	ast = new AST(new Lexer());
		// 	tokens = ast.build("[]");
		// 	console.log(tokens);
		// } catch (e) {
		// 	console.log(e, tokens);
		// }
	});


	it('will parse complex array', function() {
		var fn = parse('[1,2,3, "ala ma kota 123# o imieniu \'karmel\'", [1,2, .25, true, [100, false]]]');
		expect(fn()).toEqual([1,2,3, "ala ma kota 123# o imieniu \'karmel\'", [1,2, .25, true, [100, false]]]);
		
		// var tokens;
		// try {
		// 	ast = new AST(new Lexer());
		// 	tokens = ast.build("[1,2,3,'ala ma kota', .23, true, false, null,1, [1,2], [10,20, [100, 200]]]");
		// 	console.log(tokens);
		// } catch (e) {
		// 	console.log(e, tokens);
		// }
	});

	it('will parse empty object', function() {
		try {
			var fn = parse('{}');
			expect(fn()).toEqual({});
			// console.log(fn());
		} catch(e) {
			console.log(e);
		}

	});

	it('will parse complex object', function() {
		try {
			var fn = parse('{a:1, b:2, "ola" : "ma kota", .23: true, ala: [1,2], 1: {a:1, b:2, c: [1,2,3, {y:100, z:101}]}}');
			expect(fn()).toEqual({a:1, b:2, "ola" : "ma kota", .23: true, ala: [1,2], 1: {a:1, b:2, c: [1,2,3, {y:100, z:101}]}});
			// console.log(fn());
		} catch(e) {
			console.log(e);
		}

		// var tokens;
		// try {
		// 	ast = new AST(new Lexer());
		// 	tokens = ast.build("{ala:1, ola:.24, 24: [1,2], 25: {a:1, b:2}}");
		// 	console.log(tokens);
		// } catch (e) {
		// 	console.log(e, tokens);
		// }
	});

	it('looks up an attribute from the scope', function() {
		try {
			var fn = parse('aKey');
			expect(fn({aKey: 101})).toEqual(101);
			// console.log(fn({aKey:102}));
		} catch(e) {
			console.log(e);
		}

	});

	it('returns undefined when looking up attribute from undefined', function() {
		try {
			var fn = parse('bKey');
			expect(fn()).toBeUndefined();
			// console.log(fn({aKey:102}));
		} catch(e) {
			console.log(e);
		}
	});

	it('will parse \'this\'', function() {
		try {
			var fn = parse('this');
			var obj = {a:1, b:2};
			expect(fn(obj)).toEqual(obj);
			// console.log(fn(obj));
		} catch(e) {
			console.log(e);
		}
	});

	it('looks up a 2-part identifier path from scope', function() {
		try {
			var fn = parse('a.b');
			var obj = {a: {b:102}};
			expect(fn(obj)).toEqual(102);
			// console.log(fn(obj));
		} catch(e) {
			console.log(e);
		}
	});

	it('looks up a 4-part identifier path from scope', function() {
		try {
			var fn = parse('a.b.c.d');
			var obj = {a: {b: {c: {d: 103}}}};
			expect(fn(obj)).toEqual(103);
			// console.log(fn(obj));
		} catch(e) {
			console.log(e);
		}

	});


	it('looks up a object.identifier path from scope', function() {
		try {
			var fn = parse('{a:11}.a');
			expect(fn()).toEqual(11);
			// console.log(fn());
		} catch(e) {
			console.log(e);
		}

	});

	it('looks up a 3-part identifier path from scope', function() {
		try {
			var fn = parse('a.b.c');
			var obj = {a: {b: {c:103}}};
			expect(fn(obj)).toEqual(103);
			// console.log(fn(obj));
		} catch(e) {
			console.log(e);
		}

	});
	

});