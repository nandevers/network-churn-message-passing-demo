# Network Churn Message-Passing Demo

An interactive, self-contained browser demo of one intuition from network-aware churn analysis: when a member's churn-risk signal changes, connected members may receive a weighted message, and their neighbors may receive messages in later rounds.

**Live demo:** https://nandevers.github.io/network-churn-message-passing-demo/  
**Portfolio:** https://nandevers.github.io/

## Important scope

At Nextel, Fernando Barbosa developed a proprietary graph-based churn model called **Favorites**. The historical model combined network influence, message-passing ideas and probabilistic graphical-model concepts. Fernando recalls a historical ROC-AUC of approximately **0.80–0.85**.

The original model, source code, parameters, evaluation data and artifacts are not available to share. The reported historical metric has not been independently verified or reproduced in this repository.

This repository is a **new synthetic teaching illustration**, not the Favorites model, not a recreation of its implementation, and not evidence of its reported performance. The graph, member labels, baseline values and tie weights are invented. No customer, carrier or subscriber data is included. It is not a churn prediction product and should not be used for decisions.

## Run locally

Open `index.html` in a modern browser. The demo uses plain HTML, CSS and JavaScript; it has no build step or third-party runtime dependencies.

## How the illustration works

Twelve synthetic members are connected by undirected ties with invented strengths. One selected member begins with an elevated signal of 0.92. In each synchronous round, all other members update from the preceding round:

```
p_i(t+1) = 1 - (1 - p_i^0) × ∏_{j ∈ N(i)} (1 - β × w_ji × p_j(t))
```

- `p_i^0` is an illustrative baseline for member `i`.
- `β` is the user-controlled message strength.
- `w_ji` is the invented tie strength between members `j` and `i`.
- `p_j(t)` is the illustrative signal for member `j` in the prior round.

This noisy-OR-style equation is chosen to make weighted exposure and message passing understandable. It is not asserted to match the proprietary Favorites formulation. It has no fitted parameters, learned network weights, survival process, censoring, calibrated probabilities, intervention effects or measured predictive performance.

## Why a real deployment needs much more

A production churn system would need a defined prediction horizon and outcome, timestamp-valid network construction, leakage and selection-bias checks, temporal validation, appropriate customer-level baselines, calibration, fairness and privacy review, robustness tests, operational monitoring, and a governed intervention policy. Network dependence also means independence assumptions in a simple noisy-OR may be inappropriate.

## Files

- `index.html` — accessible demo structure, controls and professional context.
- `styles.css` — responsive design, synthetic graph styling and reduced-motion support.
- `graph.js` — graph data, synchronous update rule, controls and animated messages.

## License

No license is included. All project prose and implementation are shared for review and demonstration; contact the author before reuse beyond applicable platform terms.
