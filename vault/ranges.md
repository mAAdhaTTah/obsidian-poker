A basic opening range:

```pkr-range
AA,KK,QQ,JJ,TT,AKs,AQs,AJs,KQs,AKo
```

A weighted range — mixed frequencies render as partially filled cells:

```pkr-range
AA,KK,QQ,JJ:0.75,TT:0.5,AKs,AQs:0.5,KQs:0.25,AKo:0.5
```

Shorthand runs expand to every combo they cover:

```pkr-range
77+,A2s+,KTs+,QJs,ATo+,KQo,66-22:0.5
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

A strategy with several actions, a named remainder and dead hands:

```pkr-range
Raise 2.5bb:
  range: QQ+,AKs,AQs:0.5,A5s:0.5
  color: red
Call: JJ-99,AQs:0.5,AJs,KQs
Fold:
dead: 22-55
```

Without a named remainder, the rest of the range is left empty:

```pkr-range
3-bet: QQ+,AKs
Call: JJ-TT,AQs
```

Actions that add up to more than 1 for a hand are an error:

```pkr-range
Raise: AKs:0.75
Call: AKs:0.5
```
