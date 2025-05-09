# uBO Lite

| Chrome | Edge | Firefox |
| :------: | :----: | :-------: |
| <a href="https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh"><img src="https://user-images.githubusercontent.com/585534/107280622-91a8ea80-6a26-11eb-8d07-77c548b28665.png" alt="Get uBO Lite for Chromium"></a><br>&nbsp; | <a href="https://microsoftedge.microsoft.com/addons/detail/ublock-origin-lite/cimighlppcgcoapaliogpjjdehbnofhn"><img src="https://user-images.githubusercontent.com/585534/107280673-a5ece780-6a26-11eb-9cc7-9fa9f9f81180.png" alt="Get uBlock Origin Lite for Microsoft Edge"></a><br>&nbsp; | <a href="https://addons.mozilla.org/addon/ublock-origin/](https://github.com/uBlockOrigin/uBOL-home/releases/download/uBOLite_2025.5.7.895-beta/uBOLite.beta.firefox.signed.xpi"><img src="https://user-images.githubusercontent.com/585534/107280546-7b9b2a00-6a26-11eb-8f9f-f95932f4bfec.png" alt="Get uBlock Origin for Firefox"></a><br><sup>Beta</sup> |

## Description

[Frequently asked questions (FAQ)](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ))

**uBO Lite** (uBOL) is an efficient content blocker based on the [MV3 API](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3).

uBOL operates entirely declaratively, meaning no permanent process is required for filtering. The browser handles CSS/JS injection for content filtering, ensuring that uBOL does not consume CPU or memory resources while blocking content. The service worker process is only active when interacting with the popup panel or options pages.

The default ruleset includes at least uBlock Origin's default filter set:

- uBlock Origin's built-in filter lists
- EasyList
- EasyPrivacy
- Peter Lowe’s Ad and tracking server list

You can enable additional rulesets by visiting the options page — click the _Cogs_ icon in the popup panel.

## Changelog

See the [_Releases_ section](https://github.com/uBlockOrigin/uBOL-home/releases).

Previous releases can be found in the [_Releases_ section of the uBlock repo](https://github.com/gorhill/uBlock/releases?q=uBOL).

## Issues

All uBO Lite-related issues (including filter-related ones) can be reported [here](https://github.com/uBlockOrigin/uBOL-home/issues).

## Admin Policies

uBOL exposes settings that can be defined by administrators through [managed storage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/managed). See [Managed settings](https://github.com/uBlockOrigin/uBOL-home/wiki/Managed-settings).

## Frequently Asked Questions (FAQ)

For more information, check the [_Wiki_](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ)).
