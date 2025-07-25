# uBO Lite

| Browser | Install from ... | Browser | Install from ... |
| --- | --- | --- | --- |
| <img src="https://github.com/user-attachments/assets/d5033882-0c94-424f-9e8b-e00ed832acf7" alt="Get uBO Lite for Chromium"> | <a href="https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh">Chrome Web Store</a> | <img src="https://github.com/user-attachments/assets/8a33b8ba-57ee-4a54-a83c-7d21f9b2dafb" alt="Get uBlock Origin Lite for Firefox"> | <a href="https://github.com/uBlockOrigin/uBOL-home/releases/download/uBOLite_2025.709.1525-beta/uBOLite.beta.firefox.signed.xpi">Self-distributed</a> (Beta) |
| <img src="https://github.com/user-attachments/assets/acff1f85-d3f0-49eb-928e-7c43c5ef8f6c" alt="Get uBlock Origin Lite for Microsoft Edge"> | <a href="https://microsoftedge.microsoft.com/addons/detail/ublock-origin-lite/cimighlppcgcoapaliogpjjdehbnofhn">Edge Add-ons</a> | <img src="https://github.com/user-attachments/assets/d267b13e-b403-4040-93ea-fff38fea8c1b" alt="Get uBlock Origin Lite for Safari"> | <a href="https://testflight.apple.com/join/JjTcThrV">TestFlight</a> (Beta) |

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
