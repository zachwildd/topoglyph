---
module: software-engineering/asta-autonomous-testing
extends: [core]
---

# TopoGlyph 9.0: Autonomous Software Testing — Modeling ASTA

A specialization of TopoGlyph for the cognitive topology of an autonomous software-testing agent (ASTA). Prior TopoGlyph levels modeled cognition between peer minds, evolving reality frameworks, and collective intelligence. ASTA is a different beast: a *single observer* probing an *opaque non-cognitive system* (a deployed web application), continuously building a *map* of a *territory it cannot see directly*, and checking *invariants* against *step-bounded* observations.

The asymmetries that make this domain distinct:
- The other side of the channel is not a cognitive agent — it's a black-box system. Multi-agent notation (`⦿₁⦿₂`) doesn't apply.
- There is exactly one ground truth (the running app); the model is a derived representation. Reality-interface notation (`⌖`, `⌘`) wrongly suggests symmetric realities.
- Truth is established per *step* — a triplet `(state_before, action, state_after)` — not per global proposition. Existing temporal notation (`⌒⌒⌒`, `∿∿∿`) is about pacing, not about evaluation windows.
- Identity is *hypothesized*: "is this page the same as one I've seen before?" must be a first-class operation, not an assumed primitive.

**Domain inputs**
- A deployed web application (the *territory*) with hidden internal state and observable surface (DOM, network, console).
- A set of *assets* — rules (invariants), flows (action scripts), datasets — scoped to a workspace / application / variant hierarchy.
- The agent's current *model* — a graph of pages and elements accumulated across prior runs.

**Domain output**
- A *run report*: which model components were visited, which rules passed/failed/were inconclusive, which beliefs were generated, and which regions of the app remain unmapped.

## Limitations of Prior TopoGlyph for This Domain

1. **Observer–System asymmetry.** Existing collaborative-cognition glyphs (`⦿ₙ`, `⨸`, `⨹`) assume two cognitive peers exchanging insight. ASTA observes a non-cognitive system through a narrow channel; the system has no model of the observer. We need glyphs for *probe* and *observable response* across an *opacity boundary*.
2. **Map vs. Territory.** Reality-interface notation (`⌖⦗R₁⦘ ⌘ ⌖⦗R₂⦘`) suggests two realities of equal status. In testing, only one is canonical: the app. The model is a *representation that can drift*. We need explicit drift, staleness, and verification operators.
3. **Step-bounded invariants.** Rules are not global propositions — they are checked against `(page_before, action, page_after)` triplets. Prior TopoGlyph lacks a notation for the *step* as an atomic topological unit and for *evaluation context* on that step.
4. **Identity under uncertainty.** Whether two observed pages are "the same node in the model" is a hypothesis under partial information. Prior TopoGlyph has isomorphism (`⥇`) but no operator for *probabilistic equivalence* with merge/split semantics.
5. **Asset hierarchy and parallel variants.** Workspace > Application > Variant is a *deliberate scoping container*, not an emergent niche (`⧰`). Variants (staging, prod) are *parallel realities of the same app* whose differences are themselves diagnostic signal.
6. **Belief / observation distinction.** Beliefs are agent-generated *expectations* (causal from actions, observational from noticed data). They are *not* the same as the observations they're compared against. We need to mark which is which.
7. **Coverage and gaps.** The agent must reason about *what it hasn't seen*. The unmapped frontier is a first-class element, not an absence.

## Core Modules

### 1. Observer–System Dynamics Module

The fundamental asymmetric channel between agent and system-under-test.

| Glyph | Meaning |
|---|---|
| `◬` | Agent (the cognitive observer) |
| `⬢` | System under test (opaque, non-cognitive) |
| `▦` | Inferred hidden state of the SUT (the agent's hypothesis) |
| `↪ₐ` | Probe — action emitted by agent into SUT |
| `↩ₒ` | Observable — response surfaced by SUT (DOM, network, console, screenshot) |
| `┄┄┄` | Opacity boundary (what the agent cannot see directly) |
| `⊜` | Behavioral equivalence (two systems indistinguishable from observations alone) |

**Reading**: `◬ ↪ₐ ┄┄┄ ⬢⦗▦⦘ ↩ₒ ◬` → "Agent emits a probe across the opacity boundary into the SUT (whose internal state ▦ is hypothesized, not seen), and receives an observable response."

The opacity boundary `┄┄┄` is the key structural fact. Every claim the agent makes about the SUT must trace back to an observable that crossed this boundary.

### 2. Map–Territory Module

The model as a derived representation of the app, with explicit drift semantics.

| Glyph | Meaning |
|---|---|
| `▤` | Map node — page/element as represented in the model |
| `▥` | Territory node — page/element as it actually exists in the running app |
| `▢` | Unexplored frontier — known to exist (linked from a visited node) but uncrawled |
| `▒` | Stale node — previously mapped, may have changed since last verification |
| `⊝` | Map–Territory drift — model says X, territory shows Y |
| `⇡ᴹ` | Map-update operation (new observation revises the model) |
| `⇣ⱽ` | Verification probe (deliberately re-visit to refresh staleness) |
| `▣` | Partially-mapped (some children of this node enumerated, some not) |

**Reading**: `▤(loginPage) ⊝ ▥(loginPage)` → "The map's representation of the login page disagrees with the territory's current state — drift detected, requires re-mapping."

Coverage is read directly off the model: count `▤`/`▣`/`▢` to get explored / partially-explored / frontier proportions. `▒` flags regions where the agent's confidence has decayed.

### 3. Step-Composition Module

The atomic unit of agent cognition: a single transition through the app.

| Glyph | Meaning |
|---|---|
| `π` | Page-state (snapshot of observable state at one moment) |
| `α` | Action operator (click, fill, navigate, key) |
| `⟨π, α, π'⟩` | **Step triplet** — the atomic evaluation unit |
| `≼ᶜ` | Causal belief — "action α caused this transition" |
| `≼ᵒ` | Observational belief — "something was noticed in π'; causal source uncertain" |
| `↯` | Counterfactual — "I expected π'ₑ but observed π'" |
| `⊞ₛ` | Step-sequence composition (chained triplets) |

**Reading**: `⟨π, α=click(submit), π'⟩ ≼ᶜ ▦(orderCreated) ↯ ▦(orderFailed)` → "After clicking submit in state π, observed transition to π'. Causal belief: an order was created. Counterfactual: the observed state actually indicates failure — belief and observation diverge."

Step-triplets are the substrate on which rules evaluate. Compare to prior TopoGlyph's `⦗■⦘ → ⦗■⦘` — that arrow elides the action; the step-triplet preserves it as the load-bearing middle term.

### 4. Invariant Specification & Evaluation Module

Rules as observer-driven invariants checked against step-triplets.

| Glyph | Meaning |
|---|---|
| `⊢R` | Invariant declaration (a rule R asserting some condition) |
| `⊢R @ ⟨π, α, π'⟩` | Invariant *evaluated against* a step-triplet |
| `✓` | Pass |
| `✗` | Fail |
| `?` | Inconclusive (insufficient signal or evaluator declined) |
| `⊩w` | Witness — specific observation evidencing the outcome |
| `⊪w` | Refutation — specific observation contradicting the invariant |
| `⊢R ↾ Sₐ` | Scope restriction — rule R restricted to step-set Sₐ |

**Reading**: `⊢R("submit creates order") @ ⟨π, α=click(submit), π'⟩ → ✗ ⊪w(toast="error")` → "Rule R evaluated on this step: failed; refutation witness is the error toast in π'."

Distinguish this from prior TopoGlyph's value-evaluation (`⋋`) which is about preference. Here `⊢R` is *truth-conditional on a bounded observation window*.

### 5. Identity Under Uncertainty Module

The duplicate-detection problem made explicit.

| Glyph | Meaning |
|---|---|
| `≃?` | Identity hypothesis — these two observations *may* refer to the same node |
| `≃!` | Confirmed equivalence — supported by sufficient signal |
| `≄` | Disambiguated — proven distinct |
| `⊕ᴹ` | Merge operation — collapse two map nodes into one |
| `⊖ᴹ` | Split operation — separate a wrongly-merged node |
| `⨉ᶠ` | Identity-signal vector (URL, title, DOM fingerprint, component set) |
| `≂` | Same identity, different presentation (e.g., responsive variant) |

**Reading**: `π₁ ⨉ᶠ π₂ → ≃? → ⇣ⱽ → ≃! → ⊕ᴹ` → "Two pages share enough identity-signal features to hypothesize equivalence; a verification probe confirms; merge them in the model."

The `⊕ᴹ`/`⊖ᴹ` pair is bidirectional: bad merges must be reversible when later observations contradict.

### 6. Scoped Hierarchy & Variant Module

Workspace > Application > Variant as a deliberate, declarative scoping structure.

| Glyph | Meaning |
|---|---|
| `⟦W⟧` | Workspace scope (org-level container) |
| `⟦A⟧` | Application scope (the web app under test) |
| `⟦V⟧` | Variant scope (a deployment: staging, prod, branch preview) |
| `↘ₐ` | Asset descent — asset visible to children of this scope |
| `↗ₐ` | Asset ascent — asset promoted to a broader scope |
| `‖Vₛ ‖ Vₚ‖` | Parallel variants — same app, different deployments |
| `⊝ᵥ` | Cross-variant drift — same rule yields different outcomes across variants |

**Reading**: `⟦W⟧ ⊃ ⟦A⟧ ⊃ ‖⟦Vₛ⟧ ‖ ⟦Vₚ⟧‖` with `⊢R @ Vₛ → ✓` and `⊢R @ Vₚ → ✗` yields `⊝ᵥ` → "Same rule passes on staging, fails on prod — cross-variant drift, diagnostic signal that prod has regressed relative to staging."

Variants are not parallel realities in the cosmological sense — they are *intentional parallel deployments* whose differences are themselves the test signal.

### 7. Agency-Mode Module

Two fundamentally different cognitive postures the agent operates in.

| Glyph | Meaning |
|---|---|
| `⤳` | Autonomous exploration — agent chooses next action from frontier `▢` |
| `▶` | Scripted flow — deterministic playback of a fixed action sequence |
| `⊕ᴳ` | Goal-directed — action selection conditioned on an objective |
| `⇌ᵐ` | Mode switch — transition between exploration / flow / goal |
| `⌖ᶠ` | Frontier-selection policy (how to pick next `▢` to expand) |

**Reading**: `⤳ ⌖ᶠ(maximize-coverage) → ▢ ⇡ᴹ → ▤` then `⇌ᵐ → ▶(checkout-flow) → ⊢R @ each step` → "Autonomous exploration drives coverage-expansion until a flow is triggered; the agent switches to deterministic playback and evaluates rules on each step of the flow."

The mode distinction matters because rules and beliefs *mean different things* in each. A rule that fails during `⤳` may indicate a bug *or* an off-path state the rule wasn't designed for; the same failure during `▶` is unambiguous.

## Composite Reading: The Run

A *run* in ASTA is a topological structure composed from all the above:

```
⟦W⟧ ⊃ ⟦A⟧ ⊃ ⟦V⟧
  ◬ ⇌ᵐ ⤳                                    agent enters exploration mode
   ↪ₐ ┄┄┄ ⬢⦗▦⦘ ↩ₒ                          probe → SUT → observable
    π ⇡ᴹ ▤ (new map node)                   model updated
     ⨉ᶠ ≃? ▤'(prior) → ≃! → ⊕ᴹ             identity check — merge
      → ▢ (frontier expanded)               new frontier nodes registered
   ⇌ᵐ ▶(flow_X)                            switch to scripted flow
    ⟨π, α, π'⟩ ⊞ₛ ⟨π', α', π''⟩...         step sequence
     ⊢R₁ @ each → ✓✓✗ ⊪w(...)              rule evaluation per step
      ≼ᶜ ▦(orderCreated) ↯ ▦(orderFailed)  belief vs. observation diverges
   ⇌ᵐ ⤳ (resume exploration)
    ▒ → ⇣ⱽ → ⊝ detected → ⇡ᴹ                stale node verified, drift repaired
⟦Run Report⟧:
  coverage = |▤| / (|▤| + |▢|)
  outcomes = {⊢R : (✓, ✗, ?) per (step, rule)}
  beliefs = {≼ᶜ, ≼ᵒ} captured during run
  drift_events = {⊝}
```

A run is read as: the agent, scoped to a variant, alternates between exploration and flow modes; each step is a triplet on which rules evaluate; the map is continuously updated by `⇡ᴹ`; identity hypotheses `≃?` are resolved into merges or disambiguations; drift `⊝` is detected and repaired; the closing report aggregates coverage, rule outcomes, beliefs, and drift events.

## Worked Examples

### Example 1: Step Evaluation with Belief Divergence

A user clicks "submit" on a checkout form. The agent expects an order-created state; the app shows an error toast.

```
π(checkout, cart=[item₁]) 
   ↪ₐ α=click(submit)  ┄┄┄  ⬢⦗▦?⦘
   ↩ₒ π'(toast="payment declined", cart=[item₁])
⟨π, α, π'⟩ 
   ≼ᶜ ▦(orderCreated)        causal belief: submit should create order
   ↯
   ≼ᵒ ▦(paymentDeclined)     observation: belief contradicted by toast
⊢R("submit-creates-order") @ ⟨π, α, π'⟩ → ✗ ⊪w(toast="payment declined")
⊢R("error-shows-toast") @ ⟨π, α, π'⟩ → ✓ ⊩w(toast.visible)
```

Reading: one step, two rules. Rule 1 fails (the causal belief was contradicted); rule 2 passes (an observational rule about error display is satisfied by the same evidence that refuted rule 1). The witness `⊪w`/`⊩w` is *the same DOM element* — it functions differently for each rule.

This is the kind of fine-grained, step-bounded reasoning that flat propositional notation can't express.

### Example 2: Duplicate Detection During Crawl

The agent visits a product page; later, autonomous exploration arrives at what looks like the same page via a different navigation path.

```
Visit 1: ⤳ → ↪ₐ click(productLink₁) → π₁(url=/p/123, title="Widget", components={A,B,C})
   ⇡ᴹ ▤₁
Visit 2: ⤳ → ↪ₐ click(productLink₂) → π₂(url=/products/123, title="Widget", components={A,B,C})
   ⨉ᶠ(π₂) = ⟨url=/products/123, title="Widget", components={A,B,C}⟩
   ⨉ᶠ(π₁) ⨉ᶠ(π₂) → high overlap → ≃?
   ⇣ⱽ: re-probe both URLs, compare DOM fingerprints → ≃!
   ⊕ᴹ: merge ▤₂ into ▤₁; record both URLs as aliases
```

Reading: identity-signal vector overlap raises a hypothesis; a deliberate verification probe confirms; merge collapses the two map nodes into one with two URL aliases. If later observation reveals divergent behavior under the two URLs, `⊖ᴹ` would split them back apart.

### Example 3: Cross-Variant Drift

A rule passes on staging, fails on prod. The drift itself is the test signal.

```
⟦A⟧ ⊃ ‖⟦Vₛ⟧ ‖ ⟦Vₚ⟧‖
⊢R("login-redirects-to-dashboard")
  @ Vₛ ⟨π_login, α=submit, π'⟩ → ✓ ⊩w(location=/dashboard)
  @ Vₚ ⟨π_login, α=submit, π'⟩ → ✗ ⊪w(location=/login?error=expired-session)
⊝ᵥ detected
   ↗ₐ surface to user: "Rule R drifted across variants — prod regression candidate"
```

Reading: the *same* rule, *same* step shape, *different* variant — the agent surfaces the inconsistency as a likely regression. The cross-variant operator `⊝ᵥ` produces diagnostic signal that no single-variant evaluation could.

### Example 4: Flow + Rule + Belief Generation

A scripted checkout flow runs; rules evaluate per step; the agent generates new beliefs from observed data.

```
⇌ᵐ ▶(checkout-flow)
  ⟨π₀(cart=[A,B]), α=click(checkout), π₁(form)⟩
    ⊢R("cart-preserved") → ✓ ⊩w(π₁.cart == π₀.cart)
    ≼ᵒ ▦(form-shows-shipping-options)        observational belief generated
  ⟨π₁, α=fill(addressForm), π₂⟩
    ⊢R("address-validated") → ? (no validation message observed; inconclusive)
  ⟨π₂, α=click(pay), π₃(confirmation)⟩
    ≼ᶜ ▦(orderCreated)                       causal belief from action
    ⊢R("confirmation-shows-order-id") → ✓ ⊩w(text matches /Order #\d+/)
⟦Flow Report⟧:
  steps: 3 | ✓: 2 | ✗: 0 | ?: 1
  beliefs generated: {≼ᵒ: form-shipping, ≼ᶜ: orderCreated}
```

Reading: each step contributes both rule outcomes and beliefs. The inconclusive (`?`) step is preserved — it doesn't pass, doesn't fail, and signals where rule design may need sharpening. Beliefs accumulate as a side-product of the run and become substrate for future natural-language rule evaluation.

### Example 5: Coverage Reasoning

The agent reports on what it knows it doesn't know.

```
⟦Model snapshot⟧
  |▤| = 47  fully mapped
  |▣| = 12  partially mapped (some links uncrawled)
  |▢| = 23  frontier (known to exist, not yet visited)
  |▒| = 8   stale (not re-verified in last N runs)

⌖ᶠ(maximize-coverage) → next-action policy:
  priority₁: ▢ nodes reachable from high-traffic ▤ nodes
  priority₂: ▒ nodes whose staleness exceeds threshold (→ ⇣ⱽ)
  priority₃: ▣ → ▤ completion (enumerate remaining children)
```

Reading: the unmapped is a first-class element of the model. The agent's exploration policy is literally a function over the cardinalities of `▤`/`▣`/`▢`/`▒` and the topology between them. "What we haven't tested" is no less concrete than "what we've tested."

## Meta-Insight: Testing as Cartographic Cognition

ASTA, read through this extension, is a *cartographer* more than a *judge*. The agent's primary cognitive labor is map-making under partial observation; rule evaluation is a derived operation that runs *on top of* the map–territory relationship.

The structural lessons that fall out:

1. **The opacity boundary is load-bearing.** Every confident assertion the agent can make traces back through `┄┄┄` to a specific `↩ₒ`. Rules that don't bind to an observable cannot be evaluated — they collapse to `?`.

2. **The step is the atom.** Global rules are illusions; in practice every rule binds to *some* step-set `Sₐ`. Making this explicit (`⊢R ↾ Sₐ`) clarifies what the rule is even asking.

3. **Identity is hypothesis, not given.** The duplicate-detection problem is not infrastructure — it is the *epistemic backbone* of the model. Without `≃?`/`⊕ᴹ`/`⊖ᴹ`, the map fragments and coverage becomes meaningless.

4. **Beliefs and observations are different categories.** Conflating them is the single most common modeling error in autonomous-agent design. `≼ᶜ`/`≼ᵒ` vs. `↩ₒ` keeps them distinct.

5. **Variants are diagnostic, not redundant.** `⊝ᵥ` across `‖Vₛ ‖ Vₚ‖` is one of the highest-signal events the system can produce. The notation makes this explicit rather than burying it in run-comparison heuristics.

6. **Coverage is the dual of the map.** `▢` is not a placeholder for "todo" — it is a structurally-known unknown, and policies for picking the next `▢` to expand are the agent's actual cognitive strategy.

TopoGlyph 9.0 thus gives ASTA's design a vocabulary in which its core operations — probing, mapping, evaluating, hypothesizing identity, drifting across variants, generating beliefs — are first-class topological elements rather than implementation details. Where earlier TopoGlyph levels modeled how minds *think*, this level models how an agent *learns a system it cannot see*.
