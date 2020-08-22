/*
 * Copyright (C) 2019- Roki. All rights reserved.
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, 
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

const perm = (() => { // Reference: https://rosettacode.org/wiki/Permutations_with_repetitions#ES6
    'use strict';
    const replicateM = (n, f) => {
        const loop = x => x <= 0 ? [[]] : liftA2(cons, f, loop(x - 1));
        return loop(n);
    };

    const liftA2 = (f, a, b) => listApply(a.map(curry(f)), b);
    const listApply = (fs, xs) => [].concat.apply([], fs.map(f => [].concat.apply([], xs.map(x => [f(x)]))));
    const curry = f => a => b => f(a, b);
    const cons = (x, xs) => [x].concat(xs);
    return replicateM;
})();

const MessageWindow = (() => {
    'use strict';

    const se_table = [["error_panel", "error_message"], ["success_panel", "success_message"]];

    class MessageWindow {
        write(s, b) {
            if (s !== null && typeof b === "boolean") {
                document.getElementById(se_table[Number(!b)][0]).style.display = "none";
                document.getElementById(se_table[Number(b)][0]).style.display = "block";
                document.getElementById(se_table[Number(b)][1]).innerHTML = s;
                MathJax.Hub.Typeset(document.getElementById(se_table[Number(b)][1]));
            }
        }

        close() {
            se_table.forEach(e => document.getElementById(e[0]).style.display = "none");
        }
    }

    return MessageWindow;
})();

const token = {
    eof: "eof",
    illegal: "illegal",
    lparen: "(",
    rparen: ")",
    not: "~",
    and: "&",
    or: "|",
    implication: "->",
    equivalence: "<->",
    variable: 'var'
};
     
const Lexer = (() => {
    'use strict';

    class Lexer {
        constructor(formula) {
            this.formula = formula.replace(/\s/g, '');
            this.i = 0;
        }

        rewind() {
            this.i = 0;
        }

        var_count() {
            let s = new Set();
            this.tokenize((kind, data) => {
                if (kind === token.variable) s.add(data); 
                return true;
            });
            this.rewind();
            return s.size;
        }

        is_alpha(c) {
            return c >= 'A' && c <= 'Z';
        }

        next(i) {
            if (typeof i !== "number") return false;
            if (i == null) i = 1;
            
            if (i > 0) {
                if (this.i + i >= this.formula.length) return false; // out of bounds
                for (let j = 0; j < i; ++j) this.next_token();
            } else {
                if (this.i + i < 0) return false;

                const rev_read = () => {
                    switch (this.formula[this.i]) {
                        case token.lparen:
                            return Object.freeze({kind: token.lparen, data: null});
                        case token.rparen:
                            return Object.freeze({kind: token.rparen, data: null});
                        case token.not:
                            return Object.freeze({kind: token.not, data: null});
                        case token.and:
                            return Object.freeze({kind: token.and, data: null});
                        case token.or:
                            return Object.freeze({kind: token.or, data: null});
                        case '>':
                            if (this.i - 2 >= 0 && this.formula[this.i - 1] === '-' && this.formula[this.i - 2] === '<') {
                                return Object.freeze({kind: token.equivalence, data: null});
                            } else if (this.i - 1 >= 0 && this.formula[this.i - 1] === '-') {
                                return Object.freeze({kind: token.implication, data: null});
                            } else {
                                return Object.freeze({kind: token.illegal, data: null}); // invalid
                            }
                            break;
                        default:
                            if (this.is_alpha(this.formula[this.i])) 
                                return Object.freeze({kind: token.variable, data: this.i});
                            }
                            break;
                    }
                };

                for (let j = 0; j < -i; ++j) {
                    --this.i;
                    switch (rev_read().kind) {
                        case token.lparen:
                        case token.rparen:
                        case token.not:
                        case token.and:
                        case token.or:
                        case token.variable:
                            break;
                        case token.equivalence:
                            this.i -= 2;
                            break;
                        case token.implication:
                            --this.i;
                    }
                }
            }

            return true;
        }

        read() { 
            if (this.formula.length <= this.i) return Object.freeze({kind: token.eof, data: null});

            switch (this.formula[this.i]) {
                case token.lparen:
                    return Object.freeze({kind: token.lparen, data: null});
                case token.rparen:
                    return Object.freeze({kind: token.rparen, data: null});
                case token.not:
                    return Object.freeze({kind: token.not, data: null});
                case token.and:
                    return Object.freeze({kind: token.and, data: null});
                case token.or:
                    return Object.freeze({kind: token.or, data: null});
                case '-':
                    if (this.i + 1 >= this.formula.length || this.formula[this.i + 1] !== '>') return Object.freeze({kind: token.illegal, data: null});
                    else {
                        return Object.freeze({kind: token.implication, data: null});
                    } 
                case '<':
                    if (this.i + 2 >= this.formula.length || !(this.formula[this.i + 1] === '-' && this.formula[this.i + 2] === '>')) return Object.freeze({kind: token.illegal, data: null});
                    else {
                        return Object.freeze({kind: token.equivalence, data: null});
                    } 
                default:
                    if (this.is_alpha(this.formula[this.i])) {
                        return Object.freeze({kind: token.variable, data: this.formula[this.i]});
                    } else {
                        return Object.freeze({kind: token.illegal, data: null});
                    }
            }
        }

        next_token() {
            const val = this.read();
            
            switch (val.kind) {
                case token.eof:
                case token.illegal:
                    return val;
                case token.lparen:
                case token.rparen:
                case token.not:
                case token.and:
                case token.or:
                case token.variable:
                    ++this.i;
                    return val;
                case token.implication:
                    this.i += 2;
                    return val;
                case token.equivalence:
                    this.i += 3;
                    return val;
                default:
                    return Object.freeze({kind: token.illegal, data: null});
            }
        }

        tokenize(f) {
            if (typeof f !== "function") return false;
            for (let tk = this.next_token(); tk.kind !== token.eof && tk.kind !== token.illegal; tk = this.next_token()) {
                if (!f(tk.kind, tk.data)) return false;
            }
            return true;
        }
    }

    return Lexer;
})();

/*
 *
 * EBNF:
 * parse0 = parse1, {("<->"), parse1};
 * parse1 = parse2, {("->"), parse2};
 * parse2 = parse3, {("|"), parse3};
 * parse3 = parse4, {("&"), parse4};
 * parse4 = ["~", parse4], P | "(", parse0, ")";
 *
 */
const Parser = (() => {
    const is_var = Symbol('is_var'), new_var = Symbol('new_var'), varname = Symbol('varname'), 
        parse0 = Symbol('parse0'), parse1 = Symbol('parse1'), parse2 = Symbol('parse2'), parse3 = Symbol('parse3'), parse4 = Symbol('parse4');

    class Parser {
        constructor(formula) {
            this.lexer = new Lexer(formula);
            const var_c = this.lexer.var_count();
            if (var_c > 17) {
                throw Object.freeze({message: "Maximum number of variables exceeded", name: "Memory Error Exception"}); 
            }
               
            this.pattern = perm(var_c, [true, false]);
            this.pattern_i = 0;
            this.pattern_j = 0;
            this.var_map = new Map();
            this.formula_map = [];
        }

        [parse4]() {
            const tk = this.lexer.next_token();

            switch (tk.kind) {
                case token.variable:
                    if (!this.var_map.has(tk.data)) this.var_map.set(tk.data, this.pattern[this.pattern_i][this.pattern_j++]);
                    return this.var_map.get(tk.data);
                case token.lparen:
                    const val = this[parse0]();
                    const ntk = this.lexer.read();
                    if (ntk.kind !== token.rparen) {
                        throw Object.freeze({message: "No matching closing bracket ')' found", name: "Syntax Error Exception"});
                    } else {
                        this.lexer.next_token();
                    }
                    return val;
                case token.not:
                    return !this[parse4]();
                default:
                    throw Object.freeze({message: "Invalid formula", name: "Syntax Error Exception"});
            }
        }

        [parse3]() {
            let val = this[parse4]();
            for (let tk = this.lexer.read(); tk.kind === token.and; tk = this.lexer.read()) {
                this.lexer.next_token();
                const res = this[parse4]();
                val = val && res; // DO NOT something like `val && this[parse4]()` to prevent short circuit evaluation.
            }
            return val;
        }

        [parse2]() {
            let val = this[parse3]();
            for (let tk = this.lexer.read(); tk.kind === token.or; tk = this.lexer.read()) {
                this.lexer.next_token();
                const res = this[parse3]();
                val = val || res; // DO NOT something like `val || this[parse3]()` to prevent short circuit evaluation.
            }
            return val;
        }

        [parse1]() {
            let val = this[parse2]();
            for (let tk = this.lexer.read(); tk.kind === token.implication; tk = this.lexer.read()) {
                this.lexer.next_token();
                const res = this[parse2]();
                val = !val || res; // DO NOT something like `val || this[parse2]()` to prevent short circuit evaluation.
            }
            return val;
        }

        [parse0]() {
            let val = this[parse1]();
            for (let tk = this.lexer.read(); tk.kind === token.equivalence; tk = this.lexer.read()) {
                this.lexer.next_token();
                const val2 = this[parse1]();
                val = (!val || val2) && (!val2 || val);
            }
            return val;
        }

        parse() {
            const val = this[parse0]();
            this.reset();
            return val;
        }

        reset() {
            this.pattern_j = 0;
            this.var_map.clear();
            this.lexer.rewind();
        }

        generate_table() {
            let res_string = '';
            let is_tautology = true;
            for (let i = 0; i < this.pattern.length; ++i) {
                res_string += '\\((';
                
                const val = this[parse0]();
                let c = 0;
                for (let key of this.var_map.keys()) {
                    res_string += key;
                    res_string += '=' + (this.var_map.get(key) ? 'T' : 'F');
                    if (this.var_map.size - 1 !== c) res_string += ', ';
                    ++c;
                }
                this.reset();
                is_tautology = is_tautology && val;
                res_string += ')\\): ' + (val ? '\\(T\\)' : '\\(F\\)') + '<br />';
                this.advance_pattern();
            }
            if (is_tautology) {
                res_string += '<strong>Your logical formula is tautology!</strong>';
            }
            return res_string;
        }

        advance_pattern() {
            ++this.pattern_i;
        }
    }

    return Parser;
})();

var message_window = null;

const main = (() => {
    'use strict';

    message_window = new MessageWindow();
})();

function update() {
    'use strict';
    
    if (message_window == null) return;
    message_window.close();

    const form = document.getElementById('func').value;
    if (form.length === 0) return;

    try {
        const parser = new Parser(form);
        message_window.write(parser.generate_table(), true);
    } catch (e) {
        message_window.write(e.message, false);
    }
}

function close_window() {
    message_window.close();
}
