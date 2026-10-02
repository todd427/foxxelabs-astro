import numpy as np, json, re, sys

rng = np.random.default_rng(7)

# ---------------- corpus: small, structured, learnable ----------------
corpus = """
the cat sat on the mat . the dog sat on the rug . the cat saw the dog . the dog saw the cat .
the cat chased the mouse . the dog chased the cat . the mouse ate the cheese . the cat ate the fish .
the dog ate the bone . the bird sat on the roof . the bird saw the cat . the cat ran to the door .
the dog ran to the park . the mouse ran to the hole . a cat sat on a mat . a dog sat on a rug .
the big cat sat on the mat . the small dog sat on the rug . the big dog chased the small cat .
the small mouse ate the cheese . the black cat saw the white dog . the white dog chased the black cat .
the cat sat on the roof . the dog sat on the mat . the bird sat on the rug . the mouse sat on the door .
the cat and the dog sat on the mat . the dog and the cat ran to the park .
the cat ate the fish and the dog ate the bone . the mouse ran to the hole and the cat sat on the mat .
"""
toks = corpus.split()
vocab = sorted(set(toks))
V = len(vocab)
stoi = {w: i for i, w in enumerate(vocab)}
ids = np.array([stoi[w] for w in toks])

T = 8        # context length
D = 16       # d_model
H = 2        # heads
DH = D // H  # d_head
F = 32       # mlp hidden

def init(*shape, s=0.08):
    return (rng.standard_normal(shape) * s).astype(np.float64)

P = {
    'E': init(V, D, s=0.1),
    'Pos': init(T, D, s=0.1),
    'Wq': init(D, D), 'Wk': init(D, D), 'Wv': init(D, D), 'Wo': init(D, D),
    'g1': np.ones(D), 'b1': np.zeros(D),
    'W1': init(D, F), 'c1': np.zeros(F),
    'W2': init(F, D), 'c2': np.zeros(D),
    'g2': np.ones(D), 'b2': np.zeros(D),
    'U': init(D, V, s=0.1),
}
# pre-LN transformer, 1 layer, weights untied; no final LayerNorm, so logits = x2 @ U directly

def ln_f(x, g, b, eps=1e-5):
    mu = x.mean(-1, keepdims=True)
    var = ((x - mu) ** 2).mean(-1, keepdims=True)
    inv = 1.0 / np.sqrt(var + eps)
    xh = (x - mu) * inv
    return xh * g + b, (xh, inv, g)

def ln_b(dy, cache):
    xh, inv, g = cache
    dg = (dy * xh).reshape(-1, xh.shape[-1]).sum(0)
    db = dy.reshape(-1, xh.shape[-1]).sum(0)
    dxh = dy * g
    n = xh.shape[-1]
    dx = inv * (dxh - dxh.mean(-1, keepdims=True) - xh * (dxh * xh).mean(-1, keepdims=True))
    return dx, dg, db

def gelu(x):
    c = np.sqrt(2 / np.pi)
    return 0.5 * x * (1 + np.tanh(c * (x + 0.044715 * x ** 3)))

def gelu_d(x):
    c = np.sqrt(2 / np.pi)
    u = c * (x + 0.044715 * x ** 3)
    t = np.tanh(u)
    return 0.5 * (1 + t) + 0.5 * x * (1 - t ** 2) * c * (1 + 3 * 0.044715 * x ** 2)

def softmax(x):
    x = x - x.max(-1, keepdims=True)
    e = np.exp(x)
    return e / e.sum(-1, keepdims=True)

mask = np.triu(np.ones((T, T), dtype=bool), 1)

def forward(P, X, Y=None):
    B, Tn = X.shape
    c = {}
    x0 = P['E'][X] + P['Pos'][:Tn]
    c['x0'] = x0
    a, c['ln1'] = ln_f(x0, P['g1'], P['b1'])
    c['a'] = a
    q = a @ P['Wq']; k = a @ P['Wk']; v = a @ P['Wv']
    qh = q.reshape(B, Tn, H, DH).transpose(0, 2, 1, 3)
    kh = k.reshape(B, Tn, H, DH).transpose(0, 2, 1, 3)
    vh = v.reshape(B, Tn, H, DH).transpose(0, 2, 1, 3)
    s = qh @ kh.transpose(0, 1, 3, 2) / np.sqrt(DH)
    s = np.where(mask[:Tn, :Tn], -1e9, s)
    A = softmax(s)
    oh = A @ vh
    o = oh.transpose(0, 2, 1, 3).reshape(B, Tn, D)
    att = o @ P['Wo']
    x1 = x0 + att
    c.update(q=qh, k=kh, v=vh, A=A, o=o, x1=x1)
    m, c['ln2'] = ln_f(x1, P['g2'], P['b2'])
    c['m'] = m
    hpre = m @ P['W1'] + P['c1']
    hact = gelu(hpre)
    mlp = hact @ P['W2'] + P['c2']
    x2 = x1 + mlp
    c.update(hpre=hpre, hact=hact, x2=x2)
    logits = x2 @ P['U']
    c['logits'] = logits
    c['X'] = X
    if Y is None:
        return logits, None, c
    pr = softmax(logits)
    c['pr'] = pr
    loss = -np.log(pr[np.arange(B)[:, None], np.arange(Tn)[None, :], Y] + 1e-12).mean()
    return logits, loss, c

def backward(P, c, Y):
    B, Tn = c['X'].shape
    G = {k: np.zeros_like(v) for k, v in P.items()}
    dl = c['pr'].copy()
    dl[np.arange(B)[:, None], np.arange(Tn)[None, :], Y] -= 1
    dl /= (B * Tn)
    G['U'] = c['x2'].reshape(-1, D).T @ dl.reshape(-1, V)
    dx2 = dl @ P['U'].T
    dx1 = dx2.copy()
    dmlp = dx2
    G['c2'] = dmlp.reshape(-1, D).sum(0)
    G['W2'] = c['hact'].reshape(-1, F).T @ dmlp.reshape(-1, D)
    dhact = dmlp @ P['W2'].T
    dhpre = dhact * gelu_d(c['hpre'])
    G['c1'] = dhpre.reshape(-1, F).sum(0)
    G['W1'] = c['m'].reshape(-1, D).T @ dhpre.reshape(-1, F)
    dm = dhpre @ P['W1'].T
    dx1b, G['g2'], G['b2'] = ln_b(dm, c['ln2'])
    dx1 += dx1b
    dx0 = dx1.copy()
    datt = dx1
    G['Wo'] = c['o'].reshape(-1, D).T @ datt.reshape(-1, D)
    do = datt @ P['Wo'].T
    doh = do.reshape(B, Tn, H, DH).transpose(0, 2, 1, 3)
    A = c['A']
    dA = doh @ c['v'].transpose(0, 1, 3, 2)
    dvh = A.transpose(0, 1, 3, 2) @ doh
    ds = A * (dA - (dA * A).sum(-1, keepdims=True))
    ds = np.where(mask[:Tn, :Tn], 0, ds) / np.sqrt(DH)
    dqh = ds @ c['k']
    dkh = ds.transpose(0, 1, 3, 2) @ c['q']
    dq = dqh.transpose(0, 2, 1, 3).reshape(B, Tn, D)
    dk = dkh.transpose(0, 2, 1, 3).reshape(B, Tn, D)
    dv = dvh.transpose(0, 2, 1, 3).reshape(B, Tn, D)
    a2 = c['a'].reshape(-1, D)
    G['Wq'] = a2.T @ dq.reshape(-1, D)
    G['Wk'] = a2.T @ dk.reshape(-1, D)
    G['Wv'] = a2.T @ dv.reshape(-1, D)
    da = dq @ P['Wq'].T + dk @ P['Wk'].T + dv @ P['Wv'].T
    dx0b, G['g1'], G['b1'] = ln_b(da, c['ln1'])
    dx0 += dx0b
    np.add.at(G['E'], c['X'], dx0)
    G['Pos'][:Tn] = dx0.sum(0)
    return G

# ---------------- gradient check ----------------
def gradcheck():
    X = rng.integers(0, V, (2, T)); Y = rng.integers(0, V, (2, T))
    _, _, c = forward(P, X, Y)
    G = backward(P, c, Y)
    worst = 0
    for name in P:
        flat = P[name].reshape(-1)
        for _ in range(4):
            i = rng.integers(0, flat.size)
            old = flat[i]
            h = 1e-5
            flat[i] = old + h; lp = forward(P, X, Y)[1]
            flat[i] = old - h; lm = forward(P, X, Y)[1]
            flat[i] = old
            num = (lp - lm) / (2 * h)
            ana = G[name].reshape(-1)[i]
            rel = abs(num - ana) / max(1e-8, abs(num) + abs(ana))
            worst = max(worst, rel)
            if rel > 1e-4:
                print('MISMATCH', name, i, num, ana, rel)
    print('gradcheck worst rel err: %.2e' % worst)
    return worst

w = gradcheck()
assert w < 1e-4, 'gradient check failed'

# ---------------- train with Adam ----------------
n = len(ids) - T - 1
def batch(bs):
    st = rng.integers(0, n, bs)
    X = np.stack([ids[s:s + T] for s in st])
    Y = np.stack([ids[s + 1:s + T + 1] for s in st])
    return X, Y

m_ = {k: np.zeros_like(v) for k, v in P.items()}
v_ = {k: np.zeros_like(v) for k, v in P.items()}
b1, b2, eps, lr0 = 0.9, 0.999, 1e-8, 3e-3
steps = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
for t in range(1, steps + 1):
    X, Y = batch(32)
    _, loss, c = forward(P, X, Y)
    G = backward(P, c, Y)
    lr = lr0 * (0.5 * (1 + np.cos(np.pi * t / steps)) * 0.9 + 0.1)
    for k in P:
        m_[k] = b1 * m_[k] + (1 - b1) * G[k]
        v_[k] = b2 * v_[k] + (1 - b2) * G[k] ** 2
        mh = m_[k] / (1 - b1 ** t); vh = v_[k] / (1 - b2 ** t)
        P[k] -= lr * mh / (np.sqrt(vh) + eps)
    if t % 250 == 0 or t == 1:
        print(t, 'loss %.4f' % loss, flush=True)

# final eval loss over all windows
Xs = np.stack([ids[s:s + T] for s in range(n)]); Ys = np.stack([ids[s + 1:s + T + 1] for s in range(n)])
_, fl, _ = forward(P, Xs, Ys)
print('final full-corpus loss %.4f  (uniform baseline %.4f)' % (fl, np.log(V)))

def rnd(a): return np.round(a, 4).tolist()
out = {'vocab': vocab, 'T': T, 'D': D, 'H': H, 'DH': DH, 'F': F, 'loss': float(fl),
       'params': {k: rnd(v) for k, v in P.items()}}
json.dump(out, open('model.json', 'w'), separators=(',', ':'))
nparams = sum(v.size for v in P.values())
print('V=%d params=%d' % (V, nparams))

# sanity: greedy continuations
def greedy(prompt, n=8):
    ws = prompt.split()
    for _ in range(n):
        x = np.array([[stoi[w] for w in ws[-T:]]])
        lg, _, _ = forward(P, x)
        ws.append(vocab[int(lg[0, -1].argmax())])
    return ' '.join(ws)
for p in ['the cat', 'the dog sat on', 'the big', 'the mouse ate', 'a dog']:
    print(greedy(p))
