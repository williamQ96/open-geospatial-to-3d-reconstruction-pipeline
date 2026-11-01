# First-level beta experiments

**English** | [简体中文](zh-CN/beta-functions.md)

Expose **Beta functions** as a first-level settings tab beside Settings and About. Keep it distinct from developer inspection hidden inside About. Experiments are discoverable, opt-in and off by default; choosing a tab alone never enables one.

`src/beta.js` registers experiments with an ID, title, description and reversible `start`/`stop` lifecycle. Only one experiment is active at a time. Each feature captures any map state it overrides, restores it when stopped, and disposes its temporary instances/resources. Stop the old experiment before starting another. Report activation errors and leave ordinary exploration usable. Preserve all three cameras, navigation, search, labels and mobile controls.

Keep experimental rules/parameters and tests in a separate template module. Do not replace geographic data, permanently change the user's density preference or route all future tools through the developer menu. Runtime simulation pauses during dialogs. A compact active-mode badge explains the current mode.

The first reusable example is [ZOMBIE SCHOOL!!!](beta/zombie-school.md): a non-combat chase sandbox with a shared original cartoon-monster asset generator. Downstreams may adopt, disable or replace experiments independently. Local maps, feedback and development history remain downstream; reusable lifecycle/validation lessons belong in the methodology log.
