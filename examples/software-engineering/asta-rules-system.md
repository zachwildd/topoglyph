# TopoGlyph 10.0: Opening Up the Rule

> An extension of TopoGlyph 9.0 that zooms in on the `⟔` glyph. Where v9
> treated a rule as an opaque oracle, v10 gives rules internal structure:
> Hoare-triple shape, selector resolution, multi-semantics, spec/observed
> property duality, predicate composition with quantification, and failure
> attribution. This is the notation needed to design, debug, and reason
> about ASTA's Rules & Flows DSL — not just consume rules from the outside.

## Motivation: Rules Aren't Predicates

TopoGlyph 9.0 represented a rule as a single glyph `⟔` and verification as a
binary relation `state ⊨ ⟔` / `state ⊭ ⟔`. That's adequate when you only need
to talk about rules as oracles — judges that say pass/fail.

But ASTA uses rules in at least five ways:

1. **Verification** — judge an observed state.
2. **Generation** — given a page and state, produce `(action, expected_state)`
   pairs to actively *trigger* the rule.
3. **Synthesis** — given a target assertion, plan actions that lead to a
   state where it can be evaluated.
4. **Type-checking** — statically reject ill-formed rules at edit time.
5. **Documentation** — render the rule to human-readable prose.

These are not different *rules*. They are different *semantic interpretations
of the same syntactic artifact*. Ohm's `extendSemantics` mechanism is built
to support exactly this: one grammar, one parse tree, many evaluations.

A rule, viewed correctly, is **a topological cell with multiple projections**.
TopoGlyph 9.0's `⟔` glyph collapses all those projections into one symbol.
v10 opens it up.

The second motivation is that rules have *internal sub-topology* that v9
can't express:

- A rule is shaped like a **Hoare triple** `{G} W {T}` — precondition,
  action, postcondition — not a flat predicate.
- Its operands are **selectors** that resolve at runtime to *sets* of
  components, so quantification (`∀`, `∃`, `⨯¹`) is essential.
- Its predicates compare **observed properties** against **declared specs**
  or **inferred expectations** — two distinct sources of "expected value."
- Its operators are **runtime-polymorphic**: a `is` comparison's meaning
  depends on operand types, which can't be known until evaluation.

Each of these is a place where production rules go wrong, and each one needs
notation precise enough to argue about independently.

---

## New Modules

### 1. Rule Internal Structure Module — The Hoare Triple

A rule is a triple, not a flat oracle.

| Glyph | Meaning |
|---|---|
| `⟔ = ⟬G ∥ W ∥ T⟭` | Rule as Hoare triple (Given / When / Then) |
| `G` | Precondition predicate over state |
| `W` | Action sequence (possibly empty for invariants) |
| `T` | Postcondition predicate over state |
| `⟔ⁱ = ⟬T⟭` | Invariant rule (no G, no W — must always hold) |
| `⟔ᵃ = ⟬G ∥ T⟭` | Assertion rule (G must imply T; no actions) |
| `⟔ʰ = ⟬G ∥ W ∥ T⟭` | Hoare rule (full triple) |
| `s ⊨ G` | State satisfies precondition |
| `s ⥋(W) s′` | State transitions to s′ under W |
| `s′ ⊨ T` | Resulting state satisfies postcondition |

The full verification semantics in v10 notation:

```
s ⊨ ⟔ʰ   ⟺   (s ⊨ G)  ⟹  (s ⥋(W) s′  ⟹  s′ ⊨ T)
s ⊨ ⟔ᵃ   ⟺   (s ⊨ G)  ⟹  (s ⊨ T)
s ⊨ ⟔ⁱ   ⟺   s ⊨ T   (must hold in every reachable state)
```

This already lets us state things v9 could not. For example: an invariant
violation is *not* the same kind of failure as a Hoare triple violation.
An invariant says "this should *never* be false anywhere"; a Hoare triple
says "this should be true *after that action* under *that precondition*."
Failure-attribution semantics differ.

### 2. Selector & Resolution Module

In ASTA, selectors are first-class values. They are *abstract references*
that resolve to sets of components at runtime.

| Glyph | Meaning |
|---|---|
| `~σ` | Semantic selector (abstract class — e.g., `~form`, `~error_message`) |
| `$x` | Named binding (concrete reference — e.g., `$loginForm`) |
| `~σ ⇝ₛ Ⓒ_set` | Resolution: in state s, selector σ resolves to set of concretes |
| `~σ ⇝ₛ ∅` | Empty resolution (no matching components in this state) |
| `~σ ⇝ₛ {Ⓒ}` | Unique resolution (exactly one match) |
| `~σ ⇝ₛ Ⓒ_set, ∣Ⓒ_set∣ > 1` | Multi-resolution (ambiguous; rule must quantify) |
| `$x ≜ Ⓒ` | Variable binding to a concrete component |
| `~σ₁ / ~σ₂` | Hierarchical selector (find σ₂ within σ₁) |
| `~σ₁ ⊓ ~σ₂` | Intersection (must match both classes) |
| `~σ [k]` | Indexed selection (k-th match) |
| `~σ [p ≡ v]` | Filter selector (only matches with property p = v) |

The critical observation: **the same rule, applied to two different page
states, may resolve to entirely different concrete components.** Resolution
is state-dependent.

```
⟦~error_message ⇝ₛ X⟧
   when s = clean form:  X = ∅          (no error visible)
   when s = invalid input: X = {Ⓒerr}   (one error visible)
   when s = multi-field invalid: X = {Ⓒe₁, Ⓒe₂, …}  (multiple)
```

The rule that says `~error_message is not ~visible` is genuinely ambiguous
about which case it intends until quantification is applied. This is the
source of a real ASTA bug noted in the wiki: `null is not ~visible` should
evaluate to true, because the rule is implicitly *∀-quantified* over the
empty resolution.

### 3. Quantification Module

Selectors yield sets; predicates need quantifiers.

| Glyph | Meaning |
|---|---|
| `∀ Ⓒ ∈ ~σ : P(Ⓒ)` | For all matches, P holds |
| `∃ Ⓒ ∈ ~σ : P(Ⓒ)` | At least one match satisfies P |
| `⨯¹ Ⓒ ∈ ~σ : P(Ⓒ)` | Exactly one match satisfies P (uniqueness) |
| `∄ Ⓒ ∈ ~σ : P(Ⓒ)` | No matches satisfy P (equivalent to ∀¬P) |
| `∀_∅` | Vacuously true on empty resolution (`∀ x ∈ ∅ : P(x)` = ⊤) |
| `∃_∅` | Vacuously false on empty resolution (`∃ x ∈ ∅ : P(x)` = ⊥) |

The default quantifier in ASTA rules is *implicit ∀*: `~error is ~visible`
desugars to `∀ Ⓒ ∈ ~error : Ⓒ ⊨ ~visible`. Making the quantifier explicit
exposes the vacuous cases that cause confusion in practice:

```
~err is not ~visible    ≡    ∀ Ⓒ ∈ ~err : ¬visible(Ⓒ)
                         ≡    ⊤ when ~err ⇝ₛ ∅      [vacuously true]
```

### 4. Property Duality Module — Spec vs Observed vs Inferred

A component carries three layers of property:

| Glyph | Meaning |
|---|---|
| `Ⓒ ⊳ᵒ p` | Observed property (live runtime value from DOM/state) |
| `Ⓒ ⊳ˢ p` | Spec property (declared expectation, e.g., from test data) |
| `Ⓒ ⊳ⁱ p` | Inferred property (derived from structure/heuristics) |
| `Ⓒ ⊳ᵒ p ≜ Ⓒ ⊳ˢ p` | By-specification rule (observed equals declared) |
| `Ⓒ ⊳ᵒ p ≜ Ⓒ ⊳ⁱ p` | By-inference rule (observed equals derived) |
| `Ⓒ ⊳ᵒ p ≜ v` | By-literal rule (observed equals constant) |

This is precisely the distinction in the ASTA Forms Testing doc:

```
By specification:  ∀ $field ∈ ~field :
                     $field ⊳ᵒ label    ≜ $field ⊳ˢ label
                   ∧ $field ⊳ᵒ required ≜ $field ⊳ˢ required
                   ∧ $field ⊳ᵒ min      ≜ $field ⊳ˢ min
                   ∧ $field ⊳ᵒ max      ≜ $field ⊳ˢ max

By inference:      ~form ⊨ ~invalid   when  ∃ Ⓒ ∈ ~field : Ⓒ ⊨ ~invalid
```

Spec-based and inference-based rules differ in *where the expected value
comes from*, which has real consequences:

- A spec-rule failure means the application diverges from declared
  intent → file a bug against the app.
- An inference-rule failure may mean the inference heuristic is wrong
  → file a bug against the rule itself or the ontology.

The notation makes this distinction explicit.

### 5. Multi-Semantics Module — Same AST, Many Projections

This is the conceptual heart of v10. A rule is parsed once and then
projected through multiple semantic interpretations.

| Glyph | Meaning |
|---|---|
| `⌬ᴳ ⥥ AST(⟔)` | Grammar produces a parse tree from the rule's source text |
| `⟦AST⟧ᵥ` | Verification semantics (state → pass/fail) |
| `⟦AST⟧ᵍ` | Generation semantics (page+state → (action, expected) pairs) |
| `⟦AST⟧ₛ` | Synthesis semantics (goal → action sequence) |
| `⟦AST⟧ₜ` | Type-check semantics (well-typed? static error reporting) |
| `⟦AST⟧_d` | Documentation semantics (render to prose) |
| `⟦AST⟧ₒ` | Operand-validity semantics (e.g., regex check at edit time) |

A rule is a single artifact that is *meant* to be evaluated in all of these
modes. The notation captures their relationship as projections:

```
                source text
                    │
                  ⌬ᴳ_lex
                    │
                  ⌬ᴳ_syn
                    │
                    ▼
                   AST
              ╱  ╱  │  ╲  ╲
             ╱  ╱   │   ╲  ╲
        ⟦·⟧ₜ ⟦·⟧ᵥ ⟦·⟧ᵍ ⟦·⟧ₛ ⟦·⟧_d
        (edit) (run) (test) (plan) (UI)
```

This explicitly names what Ohm's `extendSemantics` lets you do, and what is
otherwise hidden behind "the eval method." Most rule-system bugs are not
parse failures — they are *one semantic mode silently disagreeing with
another* (e.g., the rule type-checks but generation produces an empty set,
or documentation reads correctly but verification rejects the parse-valid
example).

### 6. Operator Polymorphism & Type Resolution Module

Because variables are dynamically typed in the ASTA DSL, operators are
*operand-type-dependent*. Their semantics fork at runtime.

| Glyph | Meaning |
|---|---|
| `op : (τ₁, τ₂) → τ₃` | Operator signature (typed dispatch) |
| `op_τ` | Operator instance specialized to type τ |
| `Γ ⊢ e : τ` | Expression e has type τ in environment Γ |
| `Γ ⊢? e : any` | Type indeterminate until runtime (passed/global var) |
| `op[τ₁ ⊗ τ₂]` | Operator dispatch table (operand type product) |
| `⊥_op(τ₁, τ₂)` | Operator undefined for this type combination |

Concretely, the `is` operator has many dispatch cells:

```
is[StringValue ⊗ StringValue]      → string equality
is[PageComponentValue ⊗ SelectorValue]  → component satisfies selector class
is[PageComponentValue ⊗ PageComponentValue] → identity (≜) match
is[NoneValue ⊗ SelectorValue]      → vacuously satisfied (∀_∅)
is[NumberValue ⊗ NumberValue]      → numeric equality
is[ArrayValue ⊗ anything]          → ⊥ (or element-wise, depending on choice)
```

The notation makes it cleanly visible *which cells are defined* and which
fall into `⊥_op`. ASTA's runtime-error story is largely about handling
these undefined cells gracefully.

### 7. Generation & Synthesis Module — Rules as Sources of Test Actions

This is the most ASTA-specific contribution: rules are not only *judges*,
they are *sources* of test actions.

| Glyph | Meaning |
|---|---|
| `⟦⟔⟧ᵍ(s, Ⓟ) → {(a, eₛ)}` | Generate (action, expected-state) pairs for page Ⓟ in state s |
| `⟦⟔⟧ₛ(T) → W*` | Synthesize an action sequence W* that establishes T |
| `⟔ ⟶ᵍ a ⥋ eₛ` | Rule generates one action with an expected effect |
| `target(T) ⊰⥍ W*` | Reachability path from current state to T-satisfying state |
| `⟔ ↬ ⟔ʷ` | Witness rule (W component is fully realized by the synthesizer) |

The bidirectional usability of rules:

```
verification:  ⟔ acts on (state)     → judgment
generation:    ⟔ acts on (page, state) → set of (action, expectation)
synthesis:     ⟔ acts on (target T)  → action sequence reaching T
documentation: ⟔ acts on (nothing)   → prose
```

These are four distinct *evaluations* of the same parse tree. Every
production rule system that's interesting in its own right has this
property — Cypress assertions, Gherkin steps, Alloy specs, QuickCheck
properties. ASTA happens to have all four modes co-resident.

### 8. Rule Lattice & Composition Module

Rules form a partial order by *strength* (logical implication).

| Glyph | Meaning |
|---|---|
| `⟔₁ ⊏ ⟔₂` | `⟔₂` is strictly stronger (`⟔₂ ⊨ s ⟹ ⟔₁ ⊨ s`) |
| `⟔₁ ⊑ ⟔₂` | `⟔₂` is at least as strong as `⟔₁` |
| `⟔₁ ⊓ ⟔₂` | Conjunction (both must hold) |
| `⟔₁ ⊔ ⟔₂` | Disjunction (at least one must hold) |
| `⊤_⟔` | Trivially satisfied rule (any state passes) |
| `⊥_⟔` | Inconsistent rule (no state satisfies) |
| `⟔₁ ⊕ ⟔₂` | XOR — exactly one holds (rare, sometimes useful for state space) |

A rule library forms a *lattice* under `⊑`. Coverage in v9 was a frontier
over `⫷app⫸`; v10 adds a frontier over the *rule lattice*: which rules
are checked (and how strongly).

```
⫷rules⫸  partially ordered by ⊑
   │
   ⩥cᴿ   coverage frontier on rules (which assertions are exercised)
   │
   ▦ᴿ    rules currently being verified per run
```

### 9. Failure Attribution Module

When `⊭` fires, *what* failed must be attributed.

| Glyph | Meaning |
|---|---|
| `⟔ ⊃ {a₁, a₂, …}` | Rule contains multiple assertions |
| `⊭(aᵢ)` | Individual assertion failure |
| `⊭(aᵢ) ⥥ ⊭(⟔)` | Assertion failure propagates to rule failure |
| `⊭(⟔) ⥥ ●issue(⟔, Ⓒ, sᵒ, sᵉ)` | Rule failure produces an issue record |
| `⊭_G(⟔)` | Vacuous failure — precondition didn't hold (rule didn't apply) |
| `⊭_W(⟔)` | Action failure — When clause didn't execute |
| `⊭_T(⟔)` | Postcondition failure — Then clause violated |

The triage matters. A `⊭_G` is not a bug; the rule simply didn't apply. A
`⊭_W` is an environment/infrastructure failure (couldn't click the button).
A `⊭_T` is the real semantic violation worth filing. ASTA's enhancement
discussion about "error logged on Assertion vs error logged on Rule" is
exactly the question of which level of `⊭` to attach the log entry to.

### 10. DSL Gate Stratification Module

v9 collapsed all of "the rules grammar" into `⌬ᴳ`. v10 separates the layers.

| Glyph | Meaning |
|---|---|
| `⌬ᴳ_lex` | Lexical gate (tokens well-formed) |
| `⌬ᴳ_syn` | Syntactic gate (parses against grammar) |
| `⌬ᴳ_str` | Structural gate (e.g., Given contains only context assertions) |
| `⌬ᴳ_typ` | Type gate (operands have permitted types) |
| `⌬ᴳ_ops` | Operand-validity gate (e.g., regex compiles, numeric range) |
| `⌬ᴳ_run` | Runtime semantics gate (operator-type dispatch defined) |

Most edit-time tooling lives at `⌬ᴳ_lex …  ⌬ᴳ_str`. Runtime errors live at
`⌬ᴳ_run`. The gate that catches an error determines whether the user sees
it as a syntax error, a type error, or a runtime exception — a UX choice
that maps directly to which gate is responsible.

---

## Worked Examples

### Example 1 — A Form Field Spec Rule

Natural language: *Every form field's observed label, required-ness, min,
and max must match its declared specification.*

```
⟔_fieldSpec  =  ⟬ G ∥ T ⟭

  G :  ∀ $f ∈ ~field :
         $f ⊳ˢ ≠ ⊥        (a spec exists for this field)

  T :  ∀ $f ∈ ~field :
           $f ⊳ᵒ label    ≜ $f ⊳ˢ label
         ∧ $f ⊳ᵒ required ≜ $f ⊳ˢ required
         ∧ $f ⊳ᵒ min      ≜ $f ⊳ˢ min
         ∧ $f ⊳ᵒ max      ≜ $f ⊳ˢ max
```

Verification semantics:

```
⟦⟔_fieldSpec⟧ᵥ (state s)
   =  let F = ~field ⇝ₛ {Ⓒ_set}
      if F = ∅       :  ⊤        [∀_∅ — vacuously true]
      if ∃ $f ∈ F : $f ⊳ˢ = ⊥   :  ⊭_G   [rule doesn't apply]
      else           :  ⋀_{$f ∈ F} (4 property equalities)
```

Generation semantics — what test actions does this rule imply? *None
directly* — it is an assertion rule (`⟔ᵃ`), pure verification. Its
generation projection is `∅`.

### Example 2 — A Hoare Triple for Form Submission

Natural language: *Given a valid form, when submit is clicked, then the
form transitions to a success state and no error message is visible.*

```
⟔_submitValid  =  ⟬ G ∥ W ∥ T ⟭

  G :  $form ≜ ~form
     ∧ $form ⊨ ~valid
     ∧ $form ⊳ᵒ submit ⇝ {Ⓒ_submit}, ⨯¹

  W :  click($form / ~submit)

  T :  ~form ⊨ ~submitted
     ∧ ∀ Ⓒ ∈ ~error_message : ¬visible(Ⓒ)
```

Three semantic projections:

```
⟦⟔_submitValid⟧ᵥ (s)    →  pass / ⊭_G / ⊭_W / ⊭_T
⟦⟔_submitValid⟧ᵍ (s, Ⓟ) →  if G ⊨ s : { (click(Ⓒ_submit), s' ⊨ T) }
⟦⟔_submitValid⟧ₛ (T)    →  if ¬(G ⊨ s) : ⊰⥍ to fill form valid, then click
```

Note that the generation projection is *non-empty* here: this is a Hoare
rule, so it actively contributes to the test-action work queue. A session
agent prioritizing by coverage frontier (`⩥c`) will draw test actions from
`⟦⟔⟧ᵍ` across the rule library.

### Example 3 — The `null is not ~visible` Bug

The ASTA Forms wiki notes a real defect: *"assert/rule `~error_message is
not ~visible` is recorded as an error when there is no error message — but
`null is not ~visible` should be true."*

In v10:

```
~error_message ⇝ₛ ∅            (no error messages on the page)

surface form:    ~error_message is not ~visible
desugared:       ∀ Ⓒ ∈ ~error_message : ¬visible(Ⓒ)
under ∀_∅:       ⊤
```

The bug is at `⌬ᴳ_run` — the runtime semantics dispatched on an
unanticipated operand combination:

```
is[NoneValue ⊗ SelectorValue]   currently lands in ⊥_op
                                should land in ∀_∅ = ⊤
```

TopoGlyph 10.0 makes the missing dispatch cell explicit. The fix is a
single cell of the operator's dispatch table, not a change to the rule.

### Example 4 — A By-Inference Rule

Natural language: *A form is invalid if any of its fields is invalid.*

```
⟔_formInferInvalid  =  ⟬ T ⟭                  [invariant, ⟔ⁱ]

  T :  ∀ $form ∈ ~form :
         ($form ⊳ⁱ valid_state)
         ≜
         ( ∀ Ⓒ ∈ $form / ~field :
              ¬(Ⓒ ⊨ ~invalid) )
```

This is structurally a *definition*, not an external assertion. It defines
the inferred property `~form ⊳ⁱ valid_state` in terms of more primitive
observations. Then by-inference rules of the form `~form is ~valid` consult
this derived property.

The notation makes it explicit that `⊳ⁱ` properties have their own little
sub-derivation graph — and that an inference rule that depends on another
inference rule introduces a derivation chain whose failure mode is
*ontological*, not behavioral. If the inference is wrong, the rule reports
a bug that doesn't exist.

---

## Integration with TopoGlyph 9.0

The v10 modules slot in cleanly under v9's `⟔`:

```
v9 view:                    v10 view (zoomed in):

⟔ ⊳ Ⓦ                       ⟔ = ⟬G ∥ W ∥ T⟭ ⊳ Ⓦ
                                G, T are predicates over ~σ-resolutions
                                W is a sequence of ⥋(⌑) actions
                                ⟔ projects via ⟦·⟧ᵥ, ⟦·⟧ᵍ, ⟦·⟧ₛ, ⟦·⟧ₜ, ⟦·⟧_d
                                ⊭ refines into ⊭_G, ⊭_W, ⊭_T

s ⊨ ⟔                       s ⊨ G  ⟹  s ⥋(W) s′  ⟹  s′ ⊨ T

⊭ ⥥ ●issue                  ⊭_T ⥥ ●issue(⟔, Ⓒ, sᵒ, sᵉ)
                            ⊭_G ⥥ ⥥ ▤coverage   (rule didn't apply)
                            ⊭_W ⥥ ●flake_log    (infrastructure issue)

⌬ᴳ                          ⌬ᴳ_lex → ⌬ᴳ_syn → ⌬ᴳ_str → ⌬ᴳ_typ → ⌬ᴳ_ops → ⌬ᴳ_run
```

The v9 session-agent loop becomes more discriminating:

```
ⓢ interpret task result:
   for each assertion a in ◍assertions:
      if ⊨(a):        ⥥ ▦
      else case ⊭(a) of:
        ⊭_G:  ⥥ ▥                       (rule didn't trigger; no action)
        ⊭_W:  ⥥ ●flake_log               (infra retry; not a bug)
        ⊭_T:  ⥥ ●issue(⟔, Ⓒ, sᵒ, sᵉ)    (real defect)
```

The work queue gets richer too. Pulling work from rules now considers each
rule's *generation projection*, not just its applicability:

```
work_queue ← ⋃_{⟔ ∈ ●rules}  ⟦⟔⟧ᵍ(current_state)   filtered by ⩥cᴿ
```

A rule whose generation projection is `∅` (a pure assertion rule like
example 1) contributes no work but participates in `▦` via passive
verification. A Hoare rule (example 2) actively populates the queue.

---

## Meta-Insight: Rules Are Topological Cells

The deepest contribution of TopoGlyph 10.0 is conceptual: a rule is not a
predicate. A rule is a **topological cell** — a single syntactic artifact
that admits multiple *projections* (semantics), each producing a different
kind of object:

```
         AST(⟔)
       ╱   │   ╲
      ╱    │    ╲
   ⟦·⟧ᵥ  ⟦·⟧ᵍ  ⟦·⟧ₛ  ⟦·⟧_d  ⟦·⟧ₜ
   pred  action  plan   prose  type-check
```

This shape — *one declared artifact, many computed projections* — is the
defining structural property of declarative DSLs in general. Gherkin/Cucumber
steps have it (one step definition, executed as test + rendered in
reports). Alloy specifications have it (one model, both bounded check and
counterexample generation). QuickCheck properties have it (one property,
both used for assertion and as a generator). React/JSX components have it
(one render function, used by the DOM and by the test renderer and by
the static analyzer).

Most rule-system pathologies are *projection inconsistencies*: a rule that
type-checks but generates nothing; a rule that documents correctly but
fails verification on its own canonical example; a rule whose synthesis
projection cannot reach its own precondition. These are not parse errors;
they are *topology faults* — different projections of the same cell
disagreeing about its shape.

TopoGlyph 10.0 names those projections so they can be reasoned about
separately. The notation forces every rule's designer to ask: *under each
of my semantic projections, what is this rule's image?* — and to ensure
those images agree.

ASTA's rule system is sophisticated precisely *because* it uses all five
projections. Most "rule engines" use only one (verification) and pretend
the others don't exist. TopoGlyph 10.0 is the notation for systems that
take all the projections seriously — and for the failure modes that only
arise when you do.

---

## Forward References

The Hoare-triple structure introduced here generalizes to **Flows**, which
v9 treats as a separate glyph `⟕`. A flow is, in this notation,
essentially a rule with `T = ⊤` and a richer `W` — a guaranteed-shape
action sequence with no postcondition obligation, used as a shortcut
in synthesis. A future TopoGlyph 11.0 could open up `⟕` along the same
axes (procedure body, parameter binding, scope, return value, side-effect
declaration) — but the conceptual move is the same: opaque glyph →
internally structured cell with multiple projections.
