# Guided Galaxy Tour Implementation Plan

Goal: Replace quiz gates with the approved five-stop guided observation route.
Architecture: Keep the Canvas galaxy renderer, separate guided-tour state and UI in guided.js, and run both as classic deferred scripts from root index.html. No build or network dependency.
Approved design: Solar-system sky → ascent → face-on galaxy → edge-on galaxy → return. Record observations without correctness gates, then assemble an illustrated report.

- [x] Replace quiz controls with route navigation, smooth skippable transitions and observation prompts.
- [x] Add five photo records, persistent notes, face-on/edge-on comparison and editable perspective captions in the final report.
- [x] Update touch controls, reduced-motion handling, local storage recovery and README.
- [x] Verify route boundaries, skipping, records, persistence and report flow with Node smoke tests; report browser verification limitations.

Review focus: interrupted travel must not leave controls locked; missing records must not block progress; old quiz storage must not corrupt new state; touch/keyboard controls must remain available; report text must be escaped.
