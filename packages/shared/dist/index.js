function l(e, n = "YYYY-MM-DD") {
  const t = typeof e == "string" ? new Date(e) : e, r = t.getFullYear(), o = String(t.getMonth() + 1).padStart(2, "0"), c = String(t.getDate()).padStart(2, "0"), i = String(t.getHours()).padStart(2, "0"), s = String(t.getMinutes()).padStart(2, "0"), u = String(t.getSeconds()).padStart(2, "0");
  return n.replace("YYYY", String(r)).replace("MM", o).replace("DD", c).replace("HH", i).replace("mm", s).replace("ss", u);
}
function p(e, n) {
  let t = null;
  return (...r) => {
    t && clearTimeout(t), t = setTimeout(() => e(...r), n);
  };
}
function f(e, n) {
  let t;
  return (...r) => {
    t || (e(...r), t = !0, setTimeout(() => t = !1, n));
  };
}
function a(e) {
  if (e === null || typeof e != "object") return e;
  if (e instanceof Date) return new Date(e.getTime());
  if (e instanceof Array) return e.map((t) => a(t));
  const n = {};
  for (const t in e)
    Object.prototype.hasOwnProperty.call(e, t) && (n[t] = a(e[t]));
  return n;
}
export {
  p as debounce,
  a as deepClone,
  l as formatDate,
  f as throttle
};
