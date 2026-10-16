A basic opening range:

```pkr-range
AA,KK,QQ,JJ,TT,AKs,AQs,AJs,KQs,AKo
```

A weighted range — mixed frequencies render as partially filled cells:

```pkr-range
AA,KK,QQ,JJ:0.75,TT:0.5,AKs,AQs:0.5,KQs:0.25,AKo:0.5
```

Suit-specific hands are preserved when you edit other combos:

```pkr-range
AhKh,AsKs:0.5,QQ
```

An empty block starts a new range — click Edit and paint:

```pkr-range
```

An invalid range shows the parser error instead of the grid:

```pkr-range
AA,KK,ZZ
```

Frequencies must be between 0 and 1:

```pkr-range
AKs:1.5
```
