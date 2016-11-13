/* jshint globalstrict: true*/
'use strict';

//takes expression string, returns function that executes expresssion in certain context
function parse(expr) {
	var lexer = new Lexer();
	var parser = new Parser(lexer);
	return parser.parse(expr);
}

//-------------------- Lexer
function Lexer() {

}

Lexer.prototype.lex = function(text) {//tokenization
	this.text = text;
	this.index = 0;
	this.ch = null;
	this.tokens = []; //tokeny postaci np: {text: '39', value: 39}
	while(this.index < this.text.length) {
		this.ch = this.text.charAt(this.index);
		if(this.isNumber()) {
			this.readNumber();
		} else if (this.isWhiteSpace()) {
			this.index++;
		}
		else {
			throw 'unexpected character in expression: ' + this.ch;
		}
	}
	return this.tokens;
};

Lexer.prototype.isNumber = function() {
	return (this.ch >= '0' && this.ch <= '9');
};

Lexer.prototype.isWhiteSpace = function() {
	var ch = this.ch;
	return (ch === ' ');
};

Lexer.prototype.readNumber = function() {
	var number = [];
	while(this.index < this.text.length) {
		this.ch = this.text.charAt(this.index);
		if(!this.isNumber()) {
			break;
		}
		number.push(this.ch);
		this.index++;
	}
	number = number.join('');
	this.tokens.push({
		text: number,
		value: Number(number)
	});
};

//-------------------- AST
function AST(lexer) {
	this.lexer = lexer;
}

//types of ast nodes
AST.Program = 'Program';
AST.Literal = 'Literal';

AST.prototype.build = function(text) {//ast building
	this.tokens = this.lexer.lex(text);
	return this.program();
};

//methods that creates AST nodes
AST.prototype.program = function() {
	return {type: AST.Program, body: this.constant()};
};

AST.prototype.constant = function() {
	return {type: AST.Literal, value: this.tokens[0].value};
};


//-------------------- Compiler
function ASTCompiler(ast) {
	this.ast = ast;
}

ASTCompiler.prototype.compile = function(text) {
	var ast = this.ast.build(text);
	this.state = {body: []};
	this.recurse(ast);

	/* jshint -W054 */
	return new Function(this.state.body.join(''));
	/* jshint +W054 */
};

ASTCompiler.prototype.recurse = function(ast) {
	switch(ast.type) {
		case AST.Program: 
			this.state.body.push('return ', this.recurse(ast.body), ';');
			break;
		case AST.Literal:
			return ast.value;
	}
};

//-------------------- Parser 

function Parser(lexer) {
	this.lexer = lexer;
	this.ast = new AST(this.lexer);
	this.astCompiler = new ASTCompiler(this.ast);
}

Parser.prototype.parse = function(text) {
	return this.astCompiler.compile(text);
};