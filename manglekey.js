function mangle(key) {
  out = [];
  for (var i = 0; i < key.length; i++) {
    out.push(key.charCodeAt(i) + 7);
  }
  return out;
}
function unmangle(chars) {
  return chars.map(function(i) { return String.fromCharCode(i - 7); }).join('');
}
var mangled = mangle('t76q54Gv');
console.log('mangled', mangled);
console.log('unmangled', unmangle(mangled));
