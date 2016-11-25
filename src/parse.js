/* jshint globalstrict: true*/
'use strict';

//takes expression string, returns function that executes expresssion in certain context
function parse(expr) {
	var lexer = new Lexer();
	var parser = new Parser(lexer);
	return parser.parse(expr);
}

//what for is that? we can deal without it, but it is educational purpose
var ESCAPE = {'n': '\\n', 't':'\\t', 'f':'\\f', 'r':'\\r', 'v':'\\v', '\'':"\\'", '"':'\\"', '\\': '\\'};

//-------------------- Lexer
function Lexer() {

}

Lexer.escapeList = /[\n\t\f\r\v]/g;//what escape characters in readString we will replace with its unicode like \\u000a for \n
Lexer.hexRegex = /[a-f0-9]{4}/ig;//regular expression for hexadecimal number

Lexer.prototype.lex = function(text) {//tokenization
	this.text = text;
	this.index = 0;
	this.ch = null;
	this.tokens = []; //tokens like: {text: '39', value: 39}

	while(this.index < this.text.length) {
		this.ch = this.text.charAt(this.index);

		if(this.isNumber() ||
			(this.isDot() && this.isNumber(this.peek())) //somtehing like this: .25
			// || (this.isPlusMinus() && this.isNumber(this.peek())) 
		){ 
			this.readNumber();
		} else if (this.isWhiteSpace()) {
			this.index++;
		} else if (this.isQuote()) {
			this.readString();
		}
		else {
			throw 'unexpected character in expression: ' + this.ch;
		}
	}
	return this.tokens;
};

//get char in text at position index+1, if exists, or null otherwise
Lexer.prototype.peek = function() {
	return this.index < this.text.length-1 ? this.text.charAt(this.index+1) : null;
};

Lexer.prototype.inc = function() {
	this.index++;
	this.ch = this.text.charAt(this.index);
};

Lexer.prototype.toUnicode = function(c) {
	return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
};

//---------- lexer read'Something' functions

Lexer.prototype.readNumber = function() {
	var number = [];
	var dotFlag = false;//prevents reading something like that: 12.45.24.4 - this is not a float
	var scientific = false;//setted when 'e' or 'E' readed
	var self = this;
	function add() {
		number.push(self.ch);
		self.index++;
		self.ch = self.text.charAt(self.index);
	}

	while(this.index < this.text.length) {
		if(this.isDot() && !scientific) { //!scienticif means not something like this: 4e0.23
			if(!dotFlag) {
				dotFlag = true;
				add();
			} else {
				break;
			}
		} else if (this.isScientificSymbol()) {
			if(!scientific) {
				scientific = true;
				add();
				if(this.isPlusMinus()) {
					add();
				}
			} else {
				break;
			}
			
		} else if(this.isNumber()) {
			add();
		} else {
			break;
		}
		
	}
	number = number.join('');
	this.tokens.push({
		text: number,
		value: Number(number)
	});
};

Lexer.prototype.readString = function() {
	var string = [];
	var quoteType = this.ch;
	var self = this;
	var escapeMode = false;
	function add() {
		string.push(self.ch);
	}

	while(this.index < this.text.length) {
		this.inc();
		if(escapeMode) {//checking escape cases, if this one exists 
			var repl = ESCAPE[this.ch];
			if(this.ch === 'u') {
				var hex = this.text.substring(this.index+1, this.index+5);
				if(!Lexer.hexRegex.test(hex)) {
					throw 'wrong unicode character sequence';
				}
				string.push(String.fromCharCode(parseInt(hex, 16)));
				this.index += 4;//move to the last unicode character, and then inc() move to one further
			} else if(repl) {
				string.push(repl);
			} else {
				string.push(this.ch);
			}
			
			escapeMode = false;
		}
		else if(this.ch === quoteType) {//ends lexing single string
			this.inc();//go to the next character
			string = string.join('');

			//replaces special characters like \n\t with its unicode symbol for ex. \\u000a for \n
			string = string.replace(Lexer.escapeList, Lexer.prototype.toUnicode);
			this.tokens.push({
				text: quoteType + string + quoteType,
				value: string,
			});
			return ;
		} 
		else if (this.ch === '\\') {
			escapeMode = true;
		} 
		else {
			add();
		}
	}

	throw 'Unmatched quote';
	
};

//--------- lexer isSomething functions

Lexer.prototype.isNumber = function(char) {
	var ch;
	if(typeof char === 'undefined') {
		ch = this.ch;
	} else {
		ch = char;
	}
	return (ch >= '0' && ch <= '9');
};

Lexer.prototype.isPlusMinus = function() {
	var ch = this.ch;
	return (ch === '+' || ch === '-');
};

Lexer.prototype.isWhiteSpace = function() {
	var ch = this.ch;
	return (ch === ' ');
};

Lexer.prototype.isDot = function() {
	var ch = this.ch;
	return (ch === '.');
};

Lexer.prototype.isScientificSymbol = function() {
	var ch = this.ch;
	return (ch === 'e' || ch === 'E') ;
};

Lexer.prototype.isQuote = function() {
	var ch = this.ch;
	return (ch === '\'' || ch === '\"');
};

Lexer.prototype.isStringCharacter = function() {
	var ch = this.ch;
	return (this.isCharacter() || this.isNumber() || this.isWhiteSpace());
};

Lexer.prototype.isCharacter = function() {
	var ch = this.ch.toLowerCase();
	return (ch >= 'a' && ch <= 'z');
};

//--------------------

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

AST.prototype.string = function() {
	return {type: AST.Literal, value: this.tokens[0].value};
};


//-------------------- Compiler
function ASTCompiler(ast) {
	this.ast = ast;
}

ASTCompiler.prototype.compile = function(text) {
	var ast = this.ast.build(text);//buduje drzewo ast
	this.state = {body: []};
	this.recurse(ast);//przchodzi po drzewie ast, ktore jest juz zbudowane i tworzy z niego funkcję, tj kompiluje drzewo

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
			return this.escape(ast.value);
	}
};

ASTCompiler.prototype.escape = function(value) {
	if(_.isString(value)) {
		return '\'' + value + '\'';
	} else {
		return value;
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