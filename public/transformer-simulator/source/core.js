/* ---- tiny transformer core (no DOM) ---- */
function makeModel(M) {
  return { M: M, P: M.params, V: M.vocab.length, T: M.T, D: M.D, H: M.H, DH: M.DH, F: M.F, vocab: M.vocab };
}

function vecMat(x, W) {            // x: [a], W: [a][b] -> [b]
  var b = W[0].length, out = new Array(b).fill(0);
  for (var i = 0; i < x.length; i++) {
    var xi = x[i], row = W[i];
    for (var j = 0; j < b; j++) out[j] += xi * row[j];
  }
  return out;
}
function addv(a, b) { var o = new Array(a.length); for (var i = 0; i < a.length; i++) o[i] = a[i] + b[i]; return o; }
function layerNorm(x, g, b) {
  var n = x.length, mu = 0, i;
  for (i = 0; i < n; i++) mu += x[i]; mu /= n;
  var v = 0; for (i = 0; i < n; i++) v += (x[i] - mu) * (x[i] - mu); v /= n;
  var inv = 1 / Math.sqrt(v + 1e-5), y = new Array(n), xh = new Array(n);
  for (i = 0; i < n; i++) { xh[i] = (x[i] - mu) * inv; y[i] = xh[i] * g[i] + b[i]; }
  return { y: y, xhat: xh, mean: mu, inv: inv };
}
function gelu(x) { return 0.5 * x * (1 + Math.tanh(0.7978845608028654 * (x + 0.044715 * x * x * x))); }
function softmax(z) {
  var m = -Infinity, i; for (i = 0; i < z.length; i++) if (z[i] > m) m = z[i];
  var e = new Array(z.length), s = 0;
  for (i = 0; i < z.length; i++) { e[i] = Math.exp(z[i] - m); s += e[i]; }
  for (i = 0; i < z.length; i++) e[i] /= s;
  return e;
}
function norm2(v) { var s = 0; for (var i = 0; i < v.length; i++) s += v[i] * v[i]; return Math.sqrt(s); }

var DEFAULT_OPT = { beta: 1, head: [true, true], mlp: true, pos: true };

/* forward pass over a window of token ids; returns full trace */
function forward(m, ids, opt) {
  opt = Object.assign({}, DEFAULT_OPT, opt || {});
  var P = m.P, D = m.D, H = m.H, DH = m.DH, n = ids.length, i, j, h, d;
  var emb = [], posv = [], x0 = [];
  for (i = 0; i < n; i++) {
    emb.push(P.E[ids[i]]);
    posv.push(opt.pos ? P.Pos[i] : new Array(D).fill(0));
    x0.push(addv(emb[i], posv[i]));
  }
  var ln1 = x0.map(function (x) { return layerNorm(x, P.g1, P.b1); });
  var a = ln1.map(function (o) { return o.y; });
  var q = a.map(function (r) { return vecMat(r, P.Wq); });
  var k = a.map(function (r) { return vecMat(r, P.Wk); });
  var v = a.map(function (r) { return vecMat(r, P.Wv); });
  var S = [], A = [], headOut = [], mix = [];
  var att = []; for (i = 0; i < n; i++) att.push(new Array(D).fill(0));
  for (h = 0; h < H; h++) {
    var lo = h * DH, Sh = [], Ah = [], Ho = [], Mx = [];
    for (i = 0; i < n; i++) {
      var row = new Array(n).fill(-Infinity), raw = new Array(n).fill(0);
      for (j = 0; j <= i; j++) {
        var dot = 0; for (d = 0; d < DH; d++) dot += q[i][lo + d] * k[j][lo + d];
        raw[j] = opt.beta * dot / Math.sqrt(DH);
        row[j] = raw[j];
      }
      Sh.push(raw);
      var pr = softmax(row); Ah.push(pr);
      var o = new Array(DH).fill(0);
      for (j = 0; j <= i; j++) for (d = 0; d < DH; d++) o[d] += pr[j] * v[j][lo + d];
      Mx.push(o);
      // contribution of this head to the residual: o @ Wo[lo:lo+DH, :]
      var c = new Array(D).fill(0);
      for (d = 0; d < DH; d++) { var wr = P.Wo[lo + d]; for (j = 0; j < D; j++) c[j] += o[d] * wr[j]; }
      if (!opt.head[h]) c = new Array(D).fill(0);
      Ho.push(c);
      for (j = 0; j < D; j++) att[i][j] += c[j];
    }
    S.push(Sh); A.push(Ah); headOut.push(Ho); mix.push(Mx);
  }
  var x1 = x0.map(function (x, i) { return addv(x, att[i]); });
  var ln2 = x1.map(function (x) { return layerNorm(x, P.g2, P.b2); });
  var hpre = [], hact = [], mlpOut = [], x2 = [];
  for (i = 0; i < n; i++) {
    var pre = addv(vecMat(ln2[i].y, P.W1), P.c1);
    var act = pre.map(gelu);
    var out = addv(vecMat(act, P.W2), P.c2);
    if (!opt.mlp) out = new Array(D).fill(0);
    hpre.push(pre); hact.push(act); mlpOut.push(out);
    x2.push(addv(x1[i], out));
  }
  var logits = x2.map(function (x) { return vecMat(x, P.U); });
  var lens0 = x0.map(function (x) { return vecMat(x, P.U); });
  var lens1 = x1.map(function (x) { return vecMat(x, P.U); });
  return { ids: ids, n: n, emb: emb, posv: posv, x0: x0, ln1: ln1, a: a, q: q, k: k, v: v,
           S: S, A: A, mix: mix, headOut: headOut, att: att, x1: x1, ln2: ln2, hpre: hpre, hact: hact,
           mlpOut: mlpOut, x2: x2, logits: logits, lens0: lens0, lens1: lens1, opt: opt };
}

/* ---- sampling math ---- */
function entropyBits(p) { var h = 0; for (var i = 0; i < p.length; i++) if (p[i] > 0) h -= p[i] * Math.log2(p[i]); return h; }
function klNats(p, q) { var s = 0; for (var i = 0; i < p.length; i++) if (p[i] > 1e-12) s += p[i] * Math.log(p[i] / Math.max(q[i], 1e-12)); return s; }
function argsortDesc(p) { return p.map(function (x, i) { return i; }).sort(function (a, b) { return p[b] - p[a]; }); }

/* temperature -> top-k -> top-p. returns the full chain for display */
function shapeDist(logits, tau, topK, topP) {
  var V = logits.length;
  var base = softmax(logits);
  var scaled = softmax(logits.map(function (z) { return z / Math.max(tau, 1e-3); }));
  var order = argsortDesc(scaled);
  var keep = new Array(V).fill(false), i;
  var kk = Math.max(1, Math.min(topK, V));
  for (i = 0; i < kk; i++) keep[order[i]] = true;
  var massK = 0; for (i = 0; i < kk; i++) massK += scaled[order[i]];
  // top-p on the renormalised top-k set
  var cum = 0, cut = kk;
  for (i = 0; i < kk; i++) {
    cum += scaled[order[i]] / massK;
    if (cum >= topP) { cut = i + 1; break; }
  }
  for (i = cut; i < V; i++) keep[order[i]] = false;
  var final = new Array(V).fill(0), z = 0;
  for (i = 0; i < V; i++) if (keep[i]) z += scaled[i];
  for (i = 0; i < V; i++) if (keep[i]) final[i] = scaled[i] / z;
  return { base: base, scaled: scaled, keep: keep, final: final, order: order, keptMass: z, nKept: cut };
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function sampleFrom(p, rnd) {
  var u = rnd(), c = 0;
  for (var i = 0; i < p.length; i++) { c += p[i]; if (u < c) return i; }
  for (i = p.length - 1; i >= 0; i--) if (p[i] > 0) return i;
  return 0;
}
function cosine(a, b) {
  var s = 0, na = 0, nb = 0;
  for (var i = 0; i < a.length; i++) { s += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return s / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

if (typeof module !== 'undefined') module.exports = { makeModel: makeModel, forward: forward, shapeDist: shapeDist, softmax: softmax, entropyBits: entropyBits, klNats: klNats, cosine: cosine, mulberry32: mulberry32, sampleFrom: sampleFrom };
