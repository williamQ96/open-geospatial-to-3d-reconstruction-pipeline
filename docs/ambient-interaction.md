# Reusable density, walking feedback and issue drafts

**English** | [简体中文](zh-CN/ambient-interaction.md)

The browser template supplies these optional, place-independent interactions. Downloaded wildlife/music, local route choices, branding and feedback reports belong downstream.

## One density control

Use one native range input with **No / Low / Mid / High**, keyboard support, named ticks and `aria-valuetext`. Default to **Mid** for an inhabited scene. Change actual active populations, rather than showing a label or opacity effect. **No** removes both moving actors and static props, their simulation work and their collision bodies, preserving the playable hero and navigation.

`ambience.js` defines the shared target table. Low/Mid/High target respectively 2/8/20 walkers, 0/2/5 bicycles, 0/2/5 scooters, 1/4/10 cars, 2/8/20 squirrels and 2/5/14 props. These are template presets, not measured campus populations. Invalid routes or occupied placements can reduce actual counts. Consumers should validate visible counts and performance at all four levels.

`life.js` uses lightweight upright capsules with horizontal segments/radii and vertical intervals. Shape dimensions vary by class. New actors avoid player/existing bodies; NPCs stop/yield before overlap, and player movement checks dynamic bodies at each small movement substep. Source building collision remains independent. Side offsets reduce head-on traffic conflicts; congestion can still stop actors. This is approximate collision/yielding, not rigid-body physics or complete traffic AI. Disabling a population must remove its collision bodies too.

Optional profile `wildlife: {asset_url, yaw_correction}` loads a downstream static GLB factory. `activity.squirrels.routes_enu_m` supplies `[east,north]` paths, checked against building envelopes with graph fallback where possible. The template does not bundle or fetch a particular animal. Archive the original open asset, license evidence and adapted editable/exported versions downstream. Remove unused imported materials/images from the adaptation and reopen its editable source to verify dependencies; an export-only image count is insufficient.

## Sound and gentle motion

Optional profile `audio: {music_url, footstep_url}` uses safe local relative URLs. Sound defaults enabled. Attempt playback, catch browser autoplay rejection and retry on the first user gesture. Expose the waiting state and an adjacent master sound button controlling both BGM and steps. Pause audio in hidden tabs. Unconfigured profiles hide the button and request no music. Do not promise audible autoplay before browser permission/gesture requirements are met.

Drive footsteps from actual horizontal displacement while grounded in Follow/First person. Input alone is insufficient: being blocked must not sound like walking. Idle, airborne, Overview and dialogs suppress steps. `createWalkMotion` separates this cadence from small first-person camera offsets (maximum approximately 0.018 m vertical, 0.009 m sideways, 0.0025 rad roll). Do not modify player coordinates or route origins for a camera effect. Offer a motion checkbox and honor `prefers-reduced-motion`; footsteps remain usable when visual sway is disabled. Follow's camera does not sway.

## Feedback belongs to the map

Optional profile `feedback: {repository: 'owner/project'}` plus `iteration` enables a native GitHub issue draft form. Require content; title and coordinates are optional. Coordinates begin empty and require explicit inclusion. An omitted title uses a timestamp-based feedback draft identifier plus iteration, never a guessed GitHub issue number.

Open a prefilled downstream `issues/new` URL; the reporter signs in and confirms creation on GitHub. Retain the draft and provide a fallback link for popup blockers. Long encoded drafts use a copy/paste fallback without truncating content. Do not claim submission before GitHub confirmation or embed write tokens in a static site. Draft contents/locations are not analytics events. Tell reporters that GitHub receives the draft fields and confirmed issues in public repositories are public. Anonymous direct submission would be a separate backend design with abuse controls, outside this template.

## Validation

Test crossing capsules, height separation, fast player movement, NPC yielding and empty clean-mode bodies. Verify density counts, real actor movement and separate draw-call budgets for immersion/clean views. Verify sound default/mute/unlock, footsteps from movement, idle silence, both walking modes and reduced-motion suppression. Test required feedback content, optional location, safe repository URLs, UTF-8 encoding, long drafts and a phone-width form without creating real issues. Retain the existing three-view, search, minimap and stable navigation-origin tests.

Use these controls in the [early playable/community iteration loop](iterative-community-modeling.md). Record implementation lessons here; keep local scene progress and feedback downstream.
