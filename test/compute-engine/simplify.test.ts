import { ComputeEngine } from '../../src/compute-engine';
import { Expression } from '../../src/math-json/types.ts';
import { simplify, exprToString } from '../utils';

export const ce = new ComputeEngine();

// \frac{\sin ^4\left(x\right)-\cos ^4\left(x\right)}{\sin ^2\left(x\right)-\cos ^2\left(x\right)}
// -> 1
// \frac{\sec \left(x\right)\sin ^2\left(x\right)}{1+\sec \left(x\right)}
// -> 1 - cos x
// \tan ^4\left(x\right)+2\tan ^2\left(x\right)+1
// -> \sec ^4\left(x\right)
// \tan ^2\left(x\right)\cos ^2\left(x\right)+\cot ^2\left(x\right)\sin ^2\left(x\right)
// -> 1

/**
 * A set of test cases for the simplification of expressions.
 * Each test case is a tuple of two expressions:
 * - The first expression is the input expression to simplify.
 * - The second expression is the expected simplified expression.
 */
const TEST_CASES: [Expression, Expression][] = [
  //
  // Arithmetic operations
  // - integers and float are simplified
  // - rational and square root of integers are preserved
  // (same behavior as Mathematica)
  //

  ['-23', -23], // Integers should stay as is
  ['0.3', 0.3], // Floating point should stay as is
  ['3/4', '3/4'], // Rational are reduced
  ['6/8', '3/4'], // Rational are reduced (during canonicalization)
  ['\\sqrt3', '\\sqrt3'],
  ['\\sqrt{3.1}', { num: '1.76068168616590091458' }],

  ['x+0', 'x'], // Zero is removed from addition
  ['-1234 - 5678', -6912],
  ['1.234 + 5678', 5679.234],
  ['1.234 + 5.678', 6.912],
  ['1.234 + 5.678 + 1.0001', 7.9121],
  ['2 + 4', 6],
  ['1/2 + 0.5', 1], // Floating point and exact should get simplified
  ['\\sqrt3 + 0.3', { num: '2.0320508075688772' }],
  ['\\sqrt3 + 1/2', '\\sqrt3 + 1/2'],
  ['\\sqrt3 + 3', '\\sqrt3 + 3'],
  ['3/4 + 2', '11/4'], // Rational are reduced, but preserved as exact values
  ['3/4 + 5/7', '41/28'], // Rational are reduced, but preserved as exact values

  ['3.1/2.8', '1.10714285714285714286'], // Floating point division

  [' 2x\\times x \\times 3 \\times x', '6x^3'], // Product of x should be simplified
  ['2(13.1+x)', '26.2+2x'], // Product of floating point should be simplified
  ['2(13.1+x) - 26.2 - 2x', 0],

  //
  // Numeric literals
  //
  ['\\sqrt3 - 2', '\\sqrt3 - 2'], // Should stay exact
  ['\\frac{\\sqrt5+1}{4}', '\\frac{\\sqrt5}{4}+\\frac14'], // Should stay exact

  //
  // Other simplifications
  //

  ['\\ln(3)+\\ln(\\frac{1}{3})', 0],
  //  ['\\frac{\\ln(9)}{\\ln(3)}', 2],
  //  ['e e^x e^{-x}', 'e'],
  //  ['e^x e^{-x}', 1],
  // [['Add', 1, 2, 1.0001], 4.0001],
  // ['2\\left(13.1+x\\right)-\\left(26.2+2x\\right)', 0],
  // ['\\sqrt{3}(\\sqrt2x + x)', '(\\sqrt3+\\sqrt6)x'],
  // ['\\sqrt[4]{16b^{4}}', '2b'],

  //
  // Negative Signs and Powers
  //
  ['(-x)^3', '-x^3'],
  /// ['(-x)^{4/3}', 'x^{4/3}'],
  /// ['(-x)^4', 'x^4'],
  ['(-x)^{3/5}', '-x^{3/5}'],
  ['1/x-1/(x+1)', '1/(x(x+1))'],
  ['\\sqrt[3]{-2}', '-\\sqrt[3]{2}'],

  //
  // Addition and Subtraction
  //
  ['-2+x', 'x-2'],
  ['x-(-1)', 'x+1'],
  ['x+(-1)', 'x-1'],

  //
  // Combine Like terms
  //
  ['x+2*x', '3*x'],
  ['2*\\pi * x^2-\\pi * x^2+2*\\pi', '\\pi * x^2+ 2\\pi'],

  //
  // Common Denominator
  //
  ['3/x-1/x', '2/x'],
  ['1/(x+1)-1/x', '-1/(x(x+1))'],

  //
  // Distribute
  //
  ['x*y+(x+1)*y', '2xy+y'],
  ['(x+1)^2-x^2', '2x+1'],
  ['2*(x+h)^2-2*x^2', '4xh+2h^2'],

  //
  // Multiplication
  //
  ['1*x', 'x'],
  ['-1*x', '-x'],
  ['(-2)*(-x)', '2*x'],
  ['2*(-x)', '-2*x'],

  //
  // Division
  //
  ['x/x', 'x/x'],
  ['\\pi/\\pi', 1],
  ['(\\pi+1)/(\\pi+1)', 1],
  ['1/(1/0)', NaN],
  ['1/(1/\\pi)', '\\pi'],
  ['1/(1/x)', '1/(1/x)'],
  ['y/(1/2)', '2*y'],
  ['x/(1/(-\\pi))', '-\\pi * x'],
  ['x/(a/\\pi)', '\\pi * x/a'],
  ['x/(a/b)', 'x/(a/b)'],
  ['(x/y)/(\\pi/2)', '(2*x)/(\\pi * y)'],
  ['2/3*5/x', '10/(3*x)'],
  ['a/b*c/d', '(a*c)/(b*d)'],
  ['2/\\pi * \\pi', '2'],
  ['x/1', 'x'],
  ['(-1)/x', '-1/x'],
  ['(-2)/(-x)', '2/x'],
  ['2/(-x)', '-2/x'],

  //
  // Operations Involving 0
  //
  ['0*\\pi', 0],
  ['x-0', 'x'],
  ['\\sin(x)+0', '\\sin(x)'],
  ['0/0', NaN],
  ['2/0', NaN],
  ['0^\\pi', 0],
  ['0^{-2}', NaN],
  ['0^{-\\pi}', NaN],
  ['0^0', NaN],
  ['2^0', 1],
  ['\\pi^0', 1],
  ['0/2', 0],
  ['\\sqrt{0}', 0],
  ['\\sqrt[n]{0}', 0],
  ['e^0', 1],
  ['|0|', 0],
  ['-0', 0],

  //
  // Ln
  //
  ['\\ln(xy)-\\ln(x)', '\\ln(y)'],
  ['\\ln(y/x)+\\ln(x)', '\\ln(x*y/x)'],
  ['e^{\\ln(x)+x}', 'x*e^x'],
  ['e^{\\ln(x)-2*x}', 'x*e^{-2*x}'],
  ['e^\\ln(x)', 'x'],
  ['e^{3\\ln(x)}', 'x^3'],
  ['e^{\\ln(x)/3}', 'x^{1/3}'],
  ['\\ln(e^x*y)', 'x+\\ln(y)'],
  ['\\ln(e^x/y)', 'x-\\ln(y)'],
  ['\\ln(y/e^x)', '\\ln(y)-x'],
  ['\\ln(0)', NaN],
  ['\\ln(1/x)', '-\\ln(x)'],
  ['\\ln(1)', 0],
  ['\\ln(e)', 1],
  ['\\ln(e^x)', 'x'],

  //
  // log
  //
  ['\\log_c(xy)-\\log_c(x)', '\\log_c(y)'],
  ['\\log_c(y/x)+\\log_c(x)', '\\log_c(xy/x)'],
  ['c^{\\log_c(x)+x}', 'x c^x'],
  ['c^{\\log_c(x)-2*x}', 'x c^{-2*x}'],
  ['c^\\log_c(x)', 'x'],
  ['c^{3\\log_c(x)}', 'x^3'],
  ['c^{\\log_c(x)/3}', 'x^{1/3}'],
  ['\\log_c(c^x*y)', 'x+\\log_c(y)'],
  ['\\log_c(c^x/y)', 'x-\\log_c(y)'],
  ['\\log_c(y/c^x)', '\\log_c(y)-x'],
  ['\\log_c(0)', NaN],
  ['\\log_c(1)', 0],
  ['\\log_c(c)', 1],
  ['\\log_c(c^x)', 'x'],
  ['\\log_2(1/x)', '-\\log_2(x)'],

  //
  // Change of Base
  //
  ['\\log_c(a)*\\ln(a)', '\\ln(c)'],
  ['\\log_c(a)/\\log_c(b)', '\\ln(a)/\\ln(b)'],
  ['\\log_c(a)/\\ln(a)', '1/\\ln(c)'],
  ['\\ln(a)/\\log_c(a)', '\\ln(c)'],

  //
  // Absolute Value
  //
  ['|\\pi|', '\\pi'],
  ['|-x|', '|x|'],
  ['|-\\pi|', '|\\pi|'],
  ['|\\pi * x|', '\\pi * x'],
  ['|\\frac{x}{\\pi}|', '\\frac{|x|}{\\pi}'],
  ['|\\frac{2}{x}|', '\\frac{2}{|x|}'],
  ['|\\infty|', '\\infty'],
  ['|-\\infty|', '\\infty'],
  ['|x|^4', 'x^4'],
  ['|x^3|', '|x|^3'],
  ['|x|^{4/3}', 'x^{4/3}'],
  ['|x^{3/5}|', '|x|^{3/5}'],

  //
  // Even Functions and Absolute Value
  //
  ['\\cos(|x+2|)', '\\cos(x+2)'],
  ['\\sec(|x+2|)', '\\sec(x+2)'],
  // ['\\cosh(|x+2|)','\\cosh(x+2)'],
  // ['\\sech(|x+2|)','\\sech(x+2)'],

  //
  // Odd Functions and Absolute Value
  //
  ['|\\sin(x)|', '\\sin(|x|)'],
  ['|\\tan(x)|', '\\tan(|x|)'],
  ['|\\cot(x)|', '\\cot(|x|)'],
  ['|\\csc(x)|', '\\csc(|x|)'],
  ['|\\arcsin(x)|', '\\arcsin(|x|)'],
  ['|\\arctan(x)|', '\\arctan(|x|)'],
  // ['|\\arccot(x)|', '\\arccot(|x|)'],
  // ['|\\arccsc(x)|', '\\arccsc(|x|)'],
  ['|\\sinh(x)|', '\\sinh(|x|)'],
  ['|\\tanh(x)|', '\\tanh(|x|)'],
  ['|\\coth(x)|', '\\coth(|x|)'],
  ['|\\csch(x)|', '\\csch(|x|)'],
  // ['|\\arcsinh(x)|', '\\arcsinh(|x|)'],
  // ['|\\arctanh(x)|', '\\arctanh(|x|)'],
  // ['|\\arccoth(x)|', '\\arccoth(|x|)'],
  // ['|\\arccsch(x)|', '\\arccsch(|x|)'],

  //
  // Logs and Infinity
  // ['\\ln(\\infty)', '\\infty'],
  ['\\log_4(\\infty)', '\\infty'],
  ['\\log_{0.5}(\\infty)', '-\\infty'],

  //
  // Powers and Infinity
  //
  ['2^\\infty', '\\infty'],
  ['0.5^\\infty', 0],
  ['\\pi^\\infty', '\\infty'],
  ['e^\\infty', '\\infty'],
  ['\\pi^{-\\infty}', 0],
  ['e^{-\\infty}', 0],
  ['2^{-\\infty}', 0],
  ['(1/2)^{-\\infty}', '\\infty'],
  ['(-\\infty)^4', '\\infty'],
  ['(\\infty)^{1.4}', '\\infty'],
  ['(-\\infty)^{1/3}', '-\\infty'],
  ['(-\\infty)^{-1}', 0],
  ['(\\infty)^{-2}', 0],
  ['1^{-\\infty}', NaN],
  ['1^{\\infty}', NaN],
  ['\\infty^0', NaN],
  ['\\sqrt[4]{\\infty}', '\\infty'],

  //
  // Multiplication and Infinity
  //
  ['0*\\infty', NaN],
  ['0*(-\\infty)', NaN],
  ['0.5*\\infty', '\\infty'],
  ['(-0.5)*(-\\infty)', '\\infty'],
  ['(-0.5)*\\infty', '-\\infty'],
  ['\\pi * (-\\infty)', '-\\infty'],

  //
  // Division and Infinity
  //
  ['(-\\infty)/\\infty', NaN],
  ['\\infty/0.5', '\\infty'],
  ['\\infty/(-2)', '-\\infty'],
  ['\\infty/0', NaN],
  ['(-\\infty)/1.7', '-\\infty'],
  ['(-\\infty)/(1-3)', '\\infty'],
  ['2/\\infty', 0],
  ['-100/(-\\infty)', 0],
  ['0/\\infty', 0],

  //
  // Addition and Subtraction and Infinity
  //
  ['\\infty-\\infty', NaN],
  ['-\\infty-\\infty', '-\\infty'],
  ['\\infty+\\infty', '\\infty'],
  ['\\infty+10', '\\infty'],
  ['\\infty-10', '\\infty'],
  ['-\\infty+10', '-\\infty'],
  ['-\\infty-10', '-\\infty'],
  ['-10-\\infty', '-\\infty'],

  //
  // Trig and Infinity
  //
  ['\\sin(\\infty)', NaN], // built-in
  ['\\cos(\\infty)', NaN], // built-in
  ['\\tan(\\infty)', NaN], // built-in
  ['\\cot(\\infty)', NaN], // built-in
  ['\\sec(\\infty)', NaN], // built-in
  ['\\csc(\\infty)', NaN], // built-in
  ['\\sin(-\\infty)', NaN], // built-in
  ['\\cos(-\\infty)', NaN], // built-in
  ['\\tan(-\\infty)', NaN], // built-in
  ['\\cot(-\\infty)', NaN], // built-in
  ['\\sec(-\\infty)', NaN], // built-in
  ['\\csc(-\\infty)', NaN], // built-in

  //
  // Inverse Trig and Infinity
  //
  ['\\arcsin(\\infty)', NaN], // built-in
  ['\\arccos(\\infty)', NaN], // built-in
  ['\\arcsin(-\\infty)', NaN], // built-in
  ['\\arccos(-\\infty)', NaN], // built-in
  ['\\arctan(\\infty)', '\\frac{\\pi}{2}'],
  ['\\arctan(-\\infty)', '-\\frac{\\pi}{2}'],
  // ['\\arccot(\\infty)', 0],
  // ['\\arccot(-\\infty)', '\\pi'],
  // ['\\arcsec(\\infty)', '\\frac{\\pi}{2}'],
  // ['\\arcsec(-\\infty)', '\\frac{\\pi}{2}'],
  // ['\\arccsc(\\infty)', 0],
  // ['\\arccsc(-\\infty)', 0],

  //
  // Hyperbolic Trig and Infinity
  //
  ['\\sinh(\\infty)', '\\infty'],
  ['\\sinh(-\\infty)', '-\\infty'],
  ['\\cosh(\\infty)', '\\infty'],
  ['\\cosh(-\\infty)', '\\infty'],
  ['\\tanh(\\infty)', 1],
  ['\\tanh(-\\infty)', -1],
  ['\\coth(\\infty)', 1],
  ['\\coth(-\\infty)', -1],
  ['\\sech(\\infty)', 0],
  ['\\sech(-\\infty)', 0],
  ['\\csch(\\infty)', 0],
  ['\\csch(-\\infty)', 0],

  //
  // Inverse Hyperbolic Trig and Infinity
  //
  // ['\\arcsinh(\\infty)', '\\infty'],
  // ['\\arcsinh(-\\infty)', '-\\infty'],
  // ['\\arccosh(\\infty)', '\\infty'],
  // ['\\arccosh(-\\infty)', NaN],
  // ['\\arctanh(\\infty)', NaN],
  // ['\\arctanh(-\\infty)', NaN],
  // ['\\arccoth(\\infty)', NaN],
  // ['\\arccoth(-\\infty)', NaN],
  // ['\\arcsech(\\infty)', NaN],
  // ['\\arcsech(-\\infty)', NaN],
  // ['\\arccsch(\\infty)', NaN],
  // ['\\arccsch(-\\infty)', NaN],

  //
  // Negative Exponents and Denominator
  //
  ['\\frac{2}{\\pi^{-2}}', '2\\pi^2'],
  ['\\frac{2}{x\\pi^{-2}}', '\\frac{2}{x} \\pi^2'],
  ['(3/\\pi)^{-1}', '\\pi/3'],
  ['(3/x)^{-1}', '(3/x)^{-1}'],
  ['(x/\\pi)^{-3}', '\\pi^3 / x^3'],
  ['(x/y)^{-3}', '(x/y)^{-3}'],
  ['(x^2/\\pi^3)^{-2}', '\\pi^6/x^4'],

  //
  // Power of Fraction in Denominator
  //
  ['x/(y/2)^3', '8*x/y^3'],
  ['x/(2/y)^3', 'x/(2/y)^3'],

  //
  // Powers: Division Involving x
  //
  ['x/x^3', '1/x^2'],
  ['(2*x)/x^5', '2/x^4'],
  ['x/x^{-2}', 'x/x^{-2}'],
  ['x^2/x', 'x^2/x'],
  ['x^{0.3}/x', '1/x^{0.7}'],
  ['x^{-3/5}/x', '1/x^{8/5}'],
  ['\\pi^2/\\pi', '\\pi'],
  ['\\pi/\\pi^{-2}', '\\pi^3'],
  ['\\sqrt[3]{x}/x', '1/x^{2/3}'],

  //
  // Powers: Multiplication Involving x
  //
  ['x^3*x', 'x^4'],
  ['x^{-2}*x', '1/x'],
  ['x^{-1/3}*x', 'x^{-1/3}*x'],
  ['\\pi^{-2}*\\pi', '1/\\pi'],
  ['\\pi^{-0.2}*\\pi', '\\pi^{0.8}'],
  ['\\sqrt[3]{x}*x', 'x^{4/3}'],

  //
  // Powers: Multiplication of Two Powers
  //
  ['x^2*x^{-3}', '1/x'],
  ['x^2*x^{-1}', 'x^2 x^{-1}'],
  ['x^2*x^3', 'x^5'],
  ['x^{-2}*x^{-1}', '1/x^3'],
  ['x^{2/3}*x^2', 'x^{8/3}'],
  ['x^{5/2}*x^3', 'x^{11/2}'],
  ['\\pi^{-1}*\\pi^2', '\\pi'],
  ['\\sqrt{x}*\\sqrt{x}', '(\\sqrt{x})^2'],
  ['\\sqrt{x}*x^2', 'x^{5/2}'],

  //
  // Powers: Division of Two Powers
  //
  ['x^2/x^3', '1/x'],
  ['x^{-1}/x^3', '1/x^4'], // built-in
  ['x/x^{-1}', 'x/x^{-1}'],
  ['\\pi / \\pi^{-1}', '\\pi^2'],
  ['\\pi^{0.2}/\\pi^{0.1}', '\\pi^{0.1}'],
  ['x^{\\sqrt{2}}/x^3', 'x^{\\sqrt{2}-3}'],

  //
  // Powers and Denominators
  //
  ['x/(\\pi/2)^3', '8x/\\pi^3'], // built-in
  ['x/(\\pi/y)^3', 'x/(\\pi/y)^3'], // built-in

  //
  // Double Powers
  //
  ['(x^1)^3', 'x^3'], // built-in
  ['(x^2)^{-2}', 'x^{-4}'], // built-in
  ['(x^{-2})^2', 'x^{-4}'], // built-in
  ['(x^{-2})^{-2}', '(x^{-2})^{-2}'], // built-in
  ['(x^{1/3})^8', 'x^{8/3}'], // built-in
  ['(x^3)^{2/5}', 'x^{6/5}'],
  ['(x^{\\sqrt{2}})^3', 'x^{3\\sqrt{2}}'],

  //
  // Powers and Roots
  //
  ['\\sqrt{x^4}', 'x^2'],
  ['\\sqrt{x^3}', 'x^{3/2}'],
  ['\\sqrt[3]{x^2}', 'x^{2/3}'],
  ['\\sqrt[4]{x^6}', 'x^{3/2}'],
  ['\\sqrt{x^6}', '|x|^3'],
  ['\\sqrt[4]{x^4}', '|x|'],

  //
  // Ln and Powers
  //
  ['\\ln(x^3)', '3\\ln(x)'],
  ['\\ln(x^\\sqrt{2})', '\\sqrt{2} \\ln(x)'],
  ['\\ln(x^2)', '2 \\ln(|x|)'],
  ['\\ln(x^{2/3})', '2/3 \\ln(|x|)'],
  ['\\ln(\\pi^{2/3})', '2/3 \\ln(\\pi)'],
  ['\\ln(x^{7/4})', '7/4 \\ln(x)'],
  ['\\ln(\\sqrt{x})', '\\ln(x)/2'],

  //
  // Log and Powers
  //
  ['\\log_4(x^3)', '3\\log_4(x)'],
  ['\\log_3(x^\\sqrt{2})', '\\sqrt{2} \\log_3(x)'],
  ['\\log_4(x^2)', '2\\log_4(|x|)'],
  ['\\log_4(x^{2/3})', '2/3 \\log_4(|x|)'],
  ['\\log_4(x^{7/4})', '7/4 \\log_4(x)'],
];

describe('SIMPLIFY', () => {
  for (const expr of TEST_CASES) {
    const a = typeof expr[0] === 'string' ? ce.parse(expr[0]) : ce.box(expr[0]);
    const b = typeof expr[1] === 'string' ? ce.parse(expr[1]) : ce.box(expr[1]);

    // const row = `[${typeof expr[0] === 'string' ? '"' + expr[0] + '"' : exprToString(expr[0])}, ${typeof expr[1] === 'string' ? '"' + expr[1] + '"' : exprToString(expr[1])}],`;

    // let comment: string;
    // if (a.simplify().isSame(b)) comment = '👍 built-in';
    // else comment = `🙁 ${a.simplify().toString()}`;

    // console.info(`${row} // ${comment}`);

    test(`simplify("${typeof expr[0] === 'string' ? expr[0] : a.toString()}") = "${typeof expr[1] === 'string' ? expr[1] : b.toString()}"`, () =>
      expect(a.simplify().json).toEqual(b.json));
  }
});

describe('SIMPLIFY', () => {
  test(`simplify(1 + 1e999) (expect precision loss)`, () =>
    expect(simplify('1 + 1e999')).toMatchInlineSnapshot(`
      {
        num: "1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001"
      }
    `));

  test(`\\frac34 + \\frac12`, () =>
    expect(simplify('\\frac34 + \\frac12')).toMatchInlineSnapshot(
      `["Rational", 5, 4]`
    ));

  test(`\\frac34 + 1e99`, () =>
    expect(simplify('\\frac34 + 1e99')).toMatchInlineSnapshot(`
      [
        "Rational",
        {
          num: "4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003"
        },
        4
      ]
    `));

  test(`1e149 + 1e150`, () =>
    expect(simplify('1e149 + 1e150')).toMatchInlineSnapshot(
      `{num: "11e+149"}`
    ));
});

describe('RELATIONAL OPERATORS', () => {
  // Simplify common coefficient
  test(`2a < 4b`, () =>
    expect(simplify('2a \\lt 4b')).toMatchInlineSnapshot(
      `["Less", "a", ["Multiply", 2, "b"]]`
    ));

  // Simplify coefficient with a common factor
  test(`2x^2 < 4x^3`, () =>
    expect(simplify('2x^2 \\lt 4x^3')).toMatchInlineSnapshot(
      `["Less", ["Add", ["Multiply", -2, ["Square", "x"]], "x"], 0]`
    ));

  test(`2a < 4ab`, () =>
    expect(simplify('2a < 4ab')).toMatchInlineSnapshot(
      `["Less", 1, ["Multiply", 2, "b"]]`
    ));
});
