/* jshint globalstrict: true */
/* global filter:false */
'use strict';

//takes expression string, returns function that executes expresssion in certain context
function parse(expr) {
	switch(typeof expr) {
		case 'string' :
			var lexer = new Lexer();
			var parser = new Parser(lexer);
			return parser.parse(expr);
		case 'function' : 
			return expr;
		default: 
			return function() {return undefined;};
	}
	
}

//what for is that? we can deal without it, but it is educational purpose
var ESCAPE = {'n': '\n', 't':'\t', 'f':'\f', 'r':'\r', 'v':'\v', '\'':"\'", '"':'\"', '\\': '\\'};

//-------------------- Lexer
function Lexer() {

}

Lexer.escapeList = /[\n\t\f\r\v\'\"]/g;//what escape characters in readString we will replace with its unicode like \\u000a for \n
Lexer.hexRegex = /[a-f0-9]{4}/ig;//regular expression for hexadecimal number

var OPERATORS = {
	'+': true,
	'-': true,
	'!': true,
	'*': true,
	'/': true,
	'%': true,
	'<': true,
	'>': true,
	'<=': true,
	'>=': true,
	'==': true,
	'!=': true,
	'===': true,
	'!==': true,
	'=': true,
	'||': true,
	'&&': true,
	'|': true,
};

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
		} else if (this.is('[],{}:.()?;')) {//array, object, function, object lookup, assignment, ternarny ?:, statement ;
			this.tokens.push({
				text: this.ch,
			});
			this.index++;
		}
		else { //operator or unexpected
			var op = this.ch;
			var peek = this.peek();
			if ((op === '=' || op === '!' || op === '<' || op === '>') && 
				(peek === '=')) {
				op += '=';
				this.index++;
				if(this.peek() === '=') {
					op += '=';
					this.index++;
				}
			} else if ((op === '&' && peek === '&') || 
				(op === '|' && peek === '|')) {
				op += peek;
				this.index++;
			}

			if(OPERATORS[op]) {
				this.tokens.push({
					text: op,
				});
				this.index++;
			} else {
				throw 'unexpected character in expression: ' + this.ch;
			}
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

Lexer.prototype.isFunction = function() {
	var ch = this.ch;
	return (ch === '(' || ch === ')');
};

Lexer.prototype.is = function(e) {
	return e.indexOf(this.ch) > -1 ? true:false;
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
AST.Identifier = 'Identifier';
AST.ThisExpression = 'ThisExpression';
AST.MemberExpression = 'MemberExpression';
AST.CallExpression = 'CallExpression';
AST.AssignmentExpression = 'AssignmentExpression';
AST.UnaryExpression = 'UnaryExpression';
AST.BinaryExpression = 'BinaryExpression';
AST.LogicalExpression = 'LogicalExpression';
AST.TernaryExpression = "TernaryExpression";

AST.prototype.constants = {
	'true' : {type: AST.Literal, value: true,},
	'false' : {type: AST.Literal, value: false},
	'null' : {type: AST.Literal, value: null},
	'this' : {type: AST.ThisExpression},
};

AST.prototype.build = function(text) {//ast building
	this.tokens = this.lexer.lex(text);
	return this.program();
};

//methods that creates AST nodes
AST.prototype.program = function() {
	var body = [];
	while(true) {
		if(this.tokens.length && !this.peek(';')) {
			body.push(this.filter());
		}	
		if(!this.expect(';')) {
			return {type: AST.Program, body: body};		
		}
	}
};

AST.prototype.primary = function() {
	var primary;
	if (this.tokens.length > 0) {
		var token = this.tokens[0];
		if(this.expect('(')) {
			primary = this.filter();
			this.consume(')');
		}
		else if(this.expect('[')) {
			primary = this.arrayDeclaration();
		} else if (this.expect('{')) {
			primary = this.objectDeclaration();
		} else if(this.constants.hasOwnProperty(token.text)) {
			primary = this.constants[this.consume().text];
		} else if(token.identifier) {
			primary = this.identifier();
		}
		else {
			primary = this.constant();	
		}

		var next;
		while((next = this.expect('.', '[', '('))) { //if dot, we expect non computed identifier; computed is [] - for example a[1+2]
			if(next.text === '[') {
				primary = {
					type: AST.MemberExpression,
					object: primary, 
					property: this.primary(),
					computed: true,
				};
				this.consume(']');
			} else if(next.text === '.') {
				if(!this.peek().identifier) {
					throw 'Expected identifier, got something else.';
				}
				primary = {
					type: AST.MemberExpression,
					object: primary, //for example a.b.c.d - object is (a.b.c) and property is d, and object is (a.b)  and prop is c and ...
					property: this.identifier(),
					computed: false,
				};
			} else if (next.text === '(') {
				primary = {
					type: AST.CallExpression, 
					callee: primary,
					arguments: this.parseArguments(),
				};
				this.consume(')');
			}
			
		}
		return primary;
	} else {
		throw 'Expected primary, got nothing.';
	}
};

AST.prototype.unary = function() {
	var token = this.expect('+', '-', '!');
	if(token) {
		return {
			type: AST.UnaryExpression, 
			operator: token.text,
			left: this.unary(),  //for example may be !!!a
		};
	} else {
		return this.primary();
	}
};

AST.prototype.multiplicative = function() {
	var left = this.unary();
	var token;
	while ((token = this.expect('*', '/', '%'))) {
		left = {
			type: AST.BinaryExpression,
			left: left, 
			operator: token.text,
			right: this.unary(),
		};
	}
	return left;
};

AST.prototype.additive = function() {
	var left = this.multiplicative();
	var token;
	while ((token = this.expect('+', '-'))) {
		left = {
			type: AST.BinaryExpression,
			left: left, 
			operator: token.text,
			right: this.multiplicative(),
		}; 
	}
	return left;
};


AST.prototype.relational = function() {
	var left = this.additive();
	var token;
	while ((token = this.expect('<', '>', '>=', '<='))) {
		left = {
			type: AST.BinaryExpression,
			left: left, 
			operator: token.text,
			right: this.additive(),
		}; 
	}
	return left;
};


AST.prototype.equality = function() {
	var left = this.relational();
	var token;
	while ((token = this.expect('==', '!=', '===', '!=='))) {
		left = {
			type: AST.BinaryExpression,
			left: left, 
			operator: token.text,
			right: this.relational(),
		}; 
	}
	return left;
};

AST.prototype.logicalAND = function() {
	var left = this.equality();
	var token;
	while ((token = this.expect('&&'))) {
		left = {
			type: AST.LogicalExpression,
			left: left, 
			operator: token.text,
			right: this.equality(),
		}; 
	}
	return left;
};

AST.prototype.logicalOR = function() {
	var left = this.logicalAND();
	var token;
	while ((token = this.expect('||'))) {
		left = {
			type: AST.LogicalExpression,
			left: left, 
			operator: token.text,
			right: this.logicalAND(),
		}; 
	}
	return left;
};

AST.prototype.ternarny = function() {
	var cond = this.logicalOR();
	var token = this.expect('?');
	if(token) {
		var left, right;
		left = this.assign();
		this.consume(':');
		right = this.assign();
		return {
			type: AST.TernaryExpression,
			left: left,
			right: right,
			cond: cond,
		};
	}
	return cond;
};

AST.prototype.assign = function() {
	var left = this.ternarny();
	if(this.expect('=')) {
		var right = this.ternarny();
		return {type: AST.AssignmentExpression, left: left, right: right};
	}
	return left;
};

AST.prototype.filter = function() {
	var left = this.assign();
	while (this.expect('|')) {
		var args = [left];//first argument is the left expression
		if(!this.peek().identifier) {
			throw 'filter expression expected filter name, got something else : "' +  this.peek() +'"';
		}
		left = {
			type: AST.CallExpression, 
			callee: this.identifier(), 
			arguments: args,
			filter: true,
		};
		while(this.expect(':')) { //here is something like a:b:12:'cat'
			args.push(this.assign());
		}
	}
	return left;
};

AST.prototype.constant = function() {
	return {type: AST.Literal, value: this.consume().value};//number or string
};

AST.prototype.identifier = function() {
	return {type: AST.Identifier, value: this.consume().text};//identifier that is: example 
};

AST.prototype.parseArguments = function() {
	var args = [];
	if(! this.peek(')')) {
		do {
			args.push(this.assign());
		} while(this.expect(','));
	}

	return args;
};

//array grammar
AST.prototype.arrayDeclaration = function() {
	var elements = [];
	if(!this.peek(']')) {
		do {
			if(this.peek(']')) {
				break;
			}
			elements.push(this.assign());
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
				prop.val = this.assign(); //val musn't be only Literal
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
AST.prototype.peek = function(e1,e2,e3,e4) {
	if(this.tokens.length > 0) {
		var text = this.tokens[0].text;
		if(text === e1 || text === e2 || text === e3 || text === e4 || 
			(!e1 && !e2 && !e3 && !e4) ){
			return this.tokens[0];
		}
	}
	/* return undefined; */
};

// 'e' may appear or not - if not, nothing happens; if exists moves forward in tokens queue
AST.prototype.expect = function(e1, e2, e3, e4) {
	var token = this.peek(e1,e2,e3,e4);
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

var CALL = Function.prototype.call;
var APPLY = Function.prototype.apply;
var BIND = Function.prototype.bind;

ASTCompiler.prototype.compile = function(text) {
	var ast = this.ast.build(text);//build ast tree
	this.state = {body: [], nextId: 0, vars: [], filters: {}};
	this.recurse(ast);//przechodzi po drzewie ast, ktore jest juz zbudowane i tworzy z niego funkcję, tj kompiluje drzewo

	//rebuilding function that we can pass function esnsureSafeMemberName to it and other arguments
	var resultCode = this.filterPrefix();
	resultCode += ' var fn = function(scope, locals) {';
	resultCode += this.state.vars.length? 'var ' +  this.state.vars.join(',') + ';' : '';
	resultCode += this.state.body.join('');
	resultCode += '}; return fn;';

	// console.log(resultCode);

	/* jshint -W054 */
	return new Function(
		'ensureSafeMemberName, ensureSafeObject, ensureSafeFunction, ifDefined, filter', 
		resultCode)(
		this.ensureSafeMemberName, 
		this.ensureSafeObject,
		this.ensureSafeFunction,
		this.ifDefined, 
		filter);
	/* jshint +W054 */
};

ASTCompiler.prototype.recurse = function(ast, context, create) {
	var self = this, elements, props, v;
	var left, right, body;
	switch(ast.type) {
		case AST.Program: 
			body = this.state.body;
			for(var i = 0; i < ast.body.length-1; i++) {
				body.push(this.recurse(ast.body[i]), ';');
			}
			body.push(' return ', this.recurse(ast.body[i]), ';');
			break;
		case AST.Literal:
			return this.escape(ast.value);
		case AST.ThisExpression:
			return 'scope';
		case AST.Identifier:
			this.ensureSafeMemberName(ast.value);
			v = this.nextId();
			if(create) {
				this.if_(this.not(this.getHasOwnProperty('locals', ast.value)) + 
					'&& scope && ' +
					this.not(this.getHasOwnProperty('scope', ast.value)),
					this.assign(this.nonComputedMember('scope', ast.value), '{}'));
			}

			//assigning to v - this is always necessary, because we always use 'v', so it must be initialized always
			this.if_(this.getHasOwnProperty('locals', ast.value), 
					this.assign(v, this.nonComputedMember('locals', ast.value)));
			this.if_(this.isUndefined(v) + ' && scope', 
					this.assign(v, this.nonComputedMember('scope', ast.value)));
			
			if(context) {//... but if we have context, 'if code logic' is here, but we always need variable 'v'
				context.context = this.getHasOwnProperty('locals', ast.value) +  '? locals:scope';
				context.name = ast.value;
			}
			//here we use 'v' 
			this.ensureSafeObjectCode(v);
			return v;
		case AST.ArrayExpression: 
			elements = _.map(ast.elements, function(element) {
				return self.recurse(element);
			});
			return '[' +  elements.join(',')  +']';
		case AST.ObjectExpression : 
			props = _.map(ast.props, function(prop) {
				var key = prop.attr;
				var attrName = key.type === AST.Identifier ? key.value : self.escape(key.value) ;//for ex: type:Literal, value: 'a' -must be literal, but may be ident - we have to turn it into string when this case
				var val = self.recurse(prop.val);//for ex: {type: ArrayExpression}
				return attrName + ':' + val;
			});
			return '{' +  props.join(',')  +'}';
		case AST.MemberExpression: //in recurse we go deep to the first object
			v = this.nextId();
			left = this.recurse(ast.object, undefined, create);//left is for example: scope.obj
			if(context) {
				context.context = left;
			}
			if(ast.computed) {
				right = this.recurse(ast.property);	
				this.state.body.push(' ensureSafeMemberName(' + right +'); ');
				if(create) {
					this.if_(this.not(this.computedMember(left, right)), 
						this.assign(this.computedMember(left, right), '{}'));
				}
				this.if_(left, this.assign(v, this.computedMember(left, right)));
				if(context) {
					context.name = right;
					context.computed = true;
				} 
			} else {
				this.ensureSafeMemberName(ast.property.value);

				if(create) {
					this.if_(this.not(this.nonComputedMember(left, ast.property.value)), 
						this.assign(this.nonComputedMember(left, ast.property.value), '{}'));
				}
				this.if_(left, this.assign(v, this.nonComputedMember(left, ast.property.value)));	
				if(context) {
					context.name = ast.property.value;
					context.computed = false;
				} 
			}
			this.ensureSafeObjectCode(v);
			return v;
		case AST.CallExpression: 
			var callee, args, callContext;
			if(ast.filter) {//that means this is filter expression - filters are functions
				callee = this.filter(ast.callee.value);
				args = _.map(ast.arguments, function(arg) {
					return self.recurse(arg);
				});
				return callee + '(' + args.join(',') + ') ';
			} else {
				callContext = {};
				callee = this.recurse(ast.callee, callContext);//for example returns v1
				args = _.map(ast.arguments, function(arg) {
					return self.recurse(arg);
				});
				if(callContext.name) {
					if(callContext.computed) {
						callee = this.computedMember(callContext.context, callContext.name);
					} else {
						callee = this.nonComputedMember(callContext.context, callContext.name);
					}
				}
				this.ensureSafeFunctionCode(callee);
				// this.ensureSafeObjectCode(callee + '(' + args.join(',') +')');
				return callee + ' && ' +  'ensureSafeObject(' + callee + '(' + args.join(',') +') ) ';
				// return callee + ' && ' + callee + '(' + args.join(',') +')';
			}
			break;
		case AST.AssignmentExpression: 
			var leftContext = {};
			this.recurse(ast.left, leftContext, true);
			var leftExpr;//for example, we have to assign to scope.a = 1, not assigning to v0 = 1 - thats why we use context
			if(leftContext.computed) {
				leftExpr = this.computedMember(leftContext.context, leftContext.name);
			} else {
				leftExpr = this.nonComputedMember(leftContext.context, leftContext.name);
			}
			return this.assign(leftExpr, this.recurse(ast.right));
		case AST.UnaryExpression : 
			left = this.recurse(ast.left);
			return  ' ' + ast.operator + '(ifDefined(' + left + ', 0) )';
		case AST.BinaryExpression : 
			left = this.recurse(ast.left);
			right = this.recurse(ast.right);
			if(ast.operator === '+' || ast.operator === '-') {
				left = ' ifDefined(' + left + ', 0) ';
				right = ' ifDefined(' + right + ', 0) ';
			}
			return  '(' + left + ') ' + ast.operator + ' (' + right + ') ' ;
		case AST.LogicalExpression : 
			v = this.nextId();
			this.state.body.push(this.assign(v, this.recurse(ast.left)));
			this.if_(ast.operator === '&&' ? v: this.not(v), 
				this.assign(v, this.recurse(ast.right)));
			return v;
		case AST.TernaryExpression : 
			var cond = this.recurse(ast.cond);
			left = this.recurse(ast.left);
			right = this.recurse(ast.right);
			return '(' + cond + ') ? (' + left + ' ) : ( ' + right + ' ) ';
			// v = this.nextId();
			// var vtest = this.nextId();
			// this.addCode(this.assign(vtest, cond));
			// this.if_(vtest, this.assign(v, left));
			// this.if_(this.not(vtest), this.assign(v, right));
			// return v;
	}
};

//adds if clause to the output code; adding attempts before adding 'return' code
ASTCompiler.prototype.if_ = function(condition, statement) {
	var code = 'if (' + condition + ') {' + statement + '} ';
	this.state.body.push(code);
};

ASTCompiler.prototype.assign = function(ident, value) {
	return ident + ' = ' + value + ' ; ';
};

ASTCompiler.prototype.filter = function(name) {
	if(!this.state.filters.hasOwnProperty(name)) {
		this.state.filters[name] = this.nextId(true);
	}
	return this.state.filters[name];
};

//adds to compiled code, declarations with filters
ASTCompiler.prototype.filterPrefix = function() {
	var self = this;
	if(_.isEmpty(this.state.filters)) {
		return ' ';
	} else {
		var parts = _.map(this.state.filters, function(varName, filterName) {
			return varName + ' = ' + ' filter(' + self.escape(filterName) + ') ';
		});
		return 'var ' + parts.join(',') + ';';
	}
};

ASTCompiler.prototype.addCode = function(code) {
	this.body.state.push(code);
};

ASTCompiler.prototype.not = function(expr) {
	return '!(' + expr + ')';
};

ASTCompiler.prototype.isUndefined = function(value) {
	return '(typeof ' + value + ' === \'undefined\')';
};

ASTCompiler.prototype.getHasOwnProperty = function(obj, prop) {
	return obj + ' &&  (' + this.escape(prop) + ' in ' + obj + ') ';
};

ASTCompiler.prototype.nextId = function(skip) {
	var id = 'v' + this.state.nextId++;
	if(!skip) {
		this.state.vars.push(id);
	}
	return id;
};

ASTCompiler.prototype.ensureSafeObjectCode = function(obj) {
	this.state.body.push(' ensureSafeObject(' + obj +'); ');
};

ASTCompiler.prototype.ensureSafeFunctionCode = function(obj) {
	this.state.body.push(' ensureSafeFunction(' + obj +'); ');
};

ASTCompiler.prototype.nonComputedMember = function(left, right) {
	return '(' + left + ').' + right;
};

ASTCompiler.prototype.computedMember = function(left, right) {
	return '(' + left + ')[' + right + ']';
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

ASTCompiler.prototype.ensureSafeMemberName = function(name) {
	if(name === 'constructor' || name === '__proto__' || name === '__defineSetter__' ||
		name === '__defineGetter__' || name === '__lookupSetter__' || name === '__lookupGetter__') {
		throw 'Attempting to access a disallowed field in Angular expressions!';
	}
};

ASTCompiler.prototype.ensureSafeObject = function(obj) {
	if(!obj) {
		return;
	}
	if(obj.document && obj.location && obj.alert && obj.setInterval) {
		throw 'Referencing window in Angular expressions is disallowed!';
	} else if (obj.children && (obj.nodeName || (obj.attr && obj.prop && obj.find))) {
		throw 'Referencing DOM nodes in Angular expressions is disallowed!';
	} else if (obj.constructor === obj) {//Function only has this 
		throw 'Referencing Function in Angular expressions is disallowed!';
	} else if (obj.getOwnPropertyNames && obj.getOwnPropertyDescriptor) {
		throw 'Referencing Object in Angular expressions is disallowed!';
	}  
	//safe functions we can also check here, but I've added another method below
	// else if(obj === CALL || obj === APPLY || obj === BIND) {
	// 	throw 'Referencing call, apply or bind in Angular expressions is disallowed!';
	// }

	return obj;
};

ASTCompiler.prototype.ensureSafeFunction = function(obj) {
	if(obj) {
		if(obj.constructor === obj) {
			throw 'Referencing Function in Angular expressions is disallowed!';
		} else if(obj === CALL || obj === APPLY || obj === BIND) {
			throw 'Referencing call, apply or bind in Angular expressions is disallowed!';
		}
	}
};

ASTCompiler.prototype.ifDefined = function(value, def) {
	return typeof value === 'undefined' ? def:value;
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