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
});