/* jshint globalstrict: true*/
'use strict';

//takes expression string, returns function that executes expresssion in certain context
function parse(expr) {
	var lexer = new Lexer();
	var parser = new Parser(lexer);
	return parser.parse(expr);
}

//what for is that? we can deal without it, but it is educational purpose
var ESCAPE = {'n': '\n', 't':'\t', 'f':'\f', 'r':'\r', 'v':'\v', '\'':"\'", '"':'\"', '\\': '\\'};

//-------------------- Lexer
function Lexer() {

}

Lexer.escapeList = /[\n\t\f\r\v\'\"]/g;//what escape characters in readString we will replace with its unicode like \\u000a for \n
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
		){ 
			this.readNumber();
		} else if (this.isWhiteSpace()) {
			this.index++;
		} else if (this.isQuote()) {
			this.readString();
		} else if(this.isIdentStart()) {
			this.readIdent();
		} else if (this.isArray() || this.isObject()) {
			this.tokens.push({
				text: this.ch,
			});
			this.index++;
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

Lexer.prototype.readIdent = function() {
	var ident = [];
	var identRegex = /[a-zA-Z0-9$_]/;

	ident.push(this.ch);

	while(this.index < this.text.length) {
		this.inc();
		if(identRegex.test(this.ch)) {
			ident.push(this.ch);
		} else {
			break;
		}
	}

	ident = ident.join('');
	this.tokens.push({
		text: ident,
		identifier: true,
	});
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
	return (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r' || ch === '\v' || ch === '\f');
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

Lexer.prototype.isIdentStart = function() {
	var identRegex = /[a-zA-Z$_]/;
	return identRegex.test(this.ch);
};

Lexer.prototype.isArray = function() {
	var ch = this.ch;
	return (ch === '[' || ch === ']' || ch === ',');
};

Lexer.prototype.isObject = function() {
	var ch = this.ch;
	return (ch === '{' || ch === '}' || ch === ',' || ch === ':');
};

//--------------------

//-------------------- AST - is like parser; reads tokens from lexer and checks grammar
// for example, arrays will be checked here, not in lexer, becaues they are grammar constructs
function AST(lexer) {
	this.lexer = lexer;
}

//types of ast nodes
AST.Program = 'Program';
AST.Literal = 'Literal';
AST.ArrayExpression = 'ArrayExpression';
AST.ObjectExpression = 'ObjectExpression';
AST.Property = 'Property';

AST.prototype.constants = {
	'true' : {type: AST.Literal, value: true},
	'false' : {type: AST.Literal, value: false},
	'null' : {type: AST.Literal, value: null},
};

AST.prototype.build = function(text) {//ast building
	this.tokens = this.lexer.lex(text);
	return this.program();
};

//methods that creates AST nodes
AST.prototype.program = function() {
	return {type: AST.Program, body: this.primary()};
};

AST.prototype.primary = function() {
	if (this.tokens.length > 0) {
		var token = this.tokens[0];
		if(this.expect('[')) {
			return this.arrayDeclaration();
		} else if (this.expect('{')) {
			return this.objectDeclaration();
		} else if(this.constants.hasOwnProperty(token.text)) {
			return this.constants[this.consume().text];
		} else {
			return this.constant();	
		}
	} else {
		throw 'Expected primary, got nothing.';
	}
};

AST.prototype.constant = function() {
	return {type: AST.Literal, value: this.consume().value};
};

AST.prototype.identifier = function() {
	return {type: AST.Literal, value: this.consume().text};
};

//array grammar
AST.prototype.arrayDeclaration = function() {
	var elements = [];
	if(!this.peek(']')) {
		do {
			if(this.peek(']')) {
				break;
			}
			elements.push(this.primary());
		} while(this.expect(','));
	}
	this.consume(']');
	return {type: AST.ArrayExpression, elements: elements};
};

//object grammar
AST.prototype.objectDeclaration = function() {
	var props = [];
	var colon, prop;
	if(!this.peek('}')) {
		do {
			if(this.peek('}')) {
				break;
			}

			prop = {type: AST.Property};

			if(this.peek().identifier) {
				prop.attr = this.identifier();
			} else {
				prop.attr = this.primary();
				if(prop.attr.type !== AST.Literal) {
					throw 'Expected attribute literal, got something else.';
				}
			}
			
			colon = this.expect(':');

			if(colon) { //if colon exists, we have somthing like {a:5}
				prop.val = this.primary(); //val musn't be only Literal
				props.push(prop);
			} else { //if colon doesnt exist, we probably have something like {a,b} where a and b are variables
				throw 'Expected \':\', got something else.';
			}
		} while(this.expect(','));
	}
	this.consume('}');
	return {type: AST.ObjectExpression, props: props};
};

// return peek, not moving forward
AST.prototype.peek = function(e) {
	if(this.tokens.length > 0) {
		if(this.tokens[0].text === e || !e) {
			return this.tokens[0];
		}
	}
	/* return undefined; */
};

// 'e' may appear or not - if not, nothing happens; if exists moves forward in tokens queue
AST.prototype.expect = function(e) {
	var token = this.peek(e);
	if(token) {
		return this.tokens.shift();//shifts array, so index isn't necessary
	}
	/* return undefined; */
};

// consume means expression must appear, if not an error occurs but consume() return first token and moves forward
AST.prototype.consume = function(e) {
	var token = this.expect(e);
	if(!token) {
		throw 'Expected : \'' + e + '\' .';
	}
	return token;
};


//-------------------- Compiler
function ASTCompiler(ast) {
	this.ast = ast;
}

ASTCompiler.prototype.compile = function(text) {
	var ast = this.ast.build(text);//buduje drzewo ast
	this.state = {body: []};
	this.recurse(ast);//przechodzi po drzewie ast, ktore jest juz zbudowane i tworzy z niego funkcję, tj kompiluje drzewo

	// console.log(this.state.body.join(''));

	/* jshint -W054 */
	return new Function('scope', this.state.body.join(''));
	/* jshint +W054 */
};

ASTCompiler.prototype.recurse = function(ast) {
	var self, elements, props;
	switch(ast.type) {
		case AST.Program: 
			this.state.body.push('return ', this.recurse(ast.body), ' ;');
			break;
		case AST.Literal:
			return this.escape(ast.value);
		case AST.ArrayExpression: 
			self = this;
			elements = _.map(ast.elements, function(element) {
				return self.recurse(element);
			});
			return '[' +  elements.join(',')  +']';
		case AST.ObjectExpression : 
			self = this;
			props = _.map(ast.props, function(prop) {
				var attrName = self.recurse(prop.attr);//for ex: type:Literal, value: 'a' -must be literal, but may be ident - we have to turn it into string when this case
				var val = self.recurse(prop.val);//for ex: type: ArrayExpression
				return attrName + ':' + val;
			});
			return '{' +  props.join(',')  +'}';
	}
};

ASTCompiler.prototype.escape = function(value) {
	if(_.isString(value)) {
		return '\'' + value + '\'';
	} else if(value === null) {
		return 'null';
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