# Multi-stage task memory

## Goal

1. **Reliable base64 images** – So ads work on sites that block external image URLs (CORS/CSP). Prefer API returning base64; fix GET_IMAGE path when conversion fails.
2. **Generic ad integrator with duck containers** – Create new divs with class `duck` for placement instead of relying on existing headers/containers; make ads look built-in for the site.

## Constraint

Only change files under `custom/`. Do not modify `chromium/`, `firefox/`, or core uBOL files (build script may be referenced in docs only).

## Stages

- **Stage 1**: B64 logging + debug mode for all ad UI.
- **Stage 2**: Fix base64 conversion/import path (worker converts image URLs to base64 when fetching API ads; ~10% size).
- **Stage 3**: Positioning of ads in different containers; improve selectability of divs for custom ads – introduce **duck** containers (new divs with class `duck`) and generic integrator that injects into these instead of replacing existing headers/containers.
- **Stage 4**: Tune placement and styling so ads look native per site (optional per-domain overrides).

## Done / Next

- **Done**: Stage 1 – B64 logging, config comment. Images: content uses API-supplied base64 (dataUrl/imageData) or GET_IMAGE per request; prefer API base64 to avoid CORS/CSP issues.
- **Next**: Stage 3 – Positioning ads in containers; improve selectability of divs for custom ads (duck containers + generic integrator).

## Console errors on CNN

When using an ad/tracking blocker (e.g. uBlock), CNN’s page will show many `net::ERR_BLOCKED_BY_CLIENT` and third-party script errors (tag.wknd.ai, chartbeat, Permutive, boltPlayer, etc.). These come from CNN’s own scripts and the blocker; they are **not** from the custom ad injector. The injector does not perform those requests. No change in the injector will remove these console errors.
