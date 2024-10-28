# uBO Lite

<p align="center">
  <a href="https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh">
    <img src="https://user-images.githubusercontent.com/585534/107280622-91a8ea80-6a26-11eb-8d07-77c548b28665.png" alt="Get uBO Lite for Chromium">
  </a>
  <a href="https://microsoftedge.microsoft.com/addons/detail/ublock-origin-lite/cimighlppcgcoapaliogpjjdehbnofhn">
    <img src="https://user-images.githubusercontent.com/585534/107280673-a5ece780-6a26-11eb-9cc7-9fa9f9f81180.png" alt="Get uBlock Origin Lite for Microsoft Edge">
  </a>
  <br>
  <sub><a href="https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ)">Frequently asked questions (FAQ)</a></sub>
</p>

## Description

**uBO Lite** (uBOL) is a **permission-less** content blocker based on the [MV3 API](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3).

uBOL operates entirely declaratively, meaning no permanent process is required for filtering. The browser handles CSS/JS injection for content filtering, ensuring that uBOL does not consume CPU or memory resources while blocking content. The service worker process is only active when interacting with the popup panel or options pages.

uBOL does not require broad "read/modify data" [permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions) at install time, limiting its capabilities compared to uBlock Origin or other content blockers that need such permissions upfront.

**However**, users can *explicitly* grant extended permissions for specific sites to enhance filtering using declarative cosmetic and scriptlet injections. 

To grant permissions on a given site, open the popup panel and select a higher filtering mode like Optimal or Complete.

![uBOL's popup panel: no permission](https://user-images.githubusercontent.com/585534/195468156-d7e63ab9-abfa-443c-a8f6-e646a29b801e.png)

The browser will alert you to the implications of granting additional permissions, and you must decide whether to accept or decline:

![uBOL's popup panel: browser warning](https://user-images.githubusercontent.com/585534/195342593-2b82b740-70a3-4507-a0e5-d7aee803b286.png)

If you accept the request, uBOL can better filter content on the current site:

![uBOL's popup panel: permissions to inject content](https://user-images.githubusercontent.com/585534/195342612-85d109d9-9006-4eb5-95a5-fec8a4f233ea.png)

You can set the default filtering mode from uBOL's options page. If you choose Optimal or Complete as the default, you will need to grant uBOL permission to modify and read data on all websites:

![uBOL's options: Default filtering mode](https://user-images.githubusercontent.com/585534/195343335-a0aa103e-621e-4137-9bcf-9821dc881be1.png)

The default ruleset includes at least uBlock Origin's default filter set:

- uBlock Origin's built-in filter lists
- EasyList
- EasyPrivacy
- Peter Lowe’s Ad and tracking server list

You can enable additional rulesets by visiting the options page — click the _Cogs_ icon in the popup panel.

Please note that this is still a work in progress, with the following goals:

- No broad host permissions at install time — extended permissions are granted explicitly by the user on a per-site basis.
- Entirely declarative for reliability and CPU/memory efficiency.

## Changelog

See the [_Releases_ section](https://github.com/uBlockOrigin/uBOL-home/releases).

Previous releases can be found in the [_Releases_ section of the uBlock repo](https://github.com/gorhill/uBlock/releases?q=uBOL).

## Issues

All uBO Lite-related issues (including filter-related ones) can be reported [here](https://github.com/uBlockOrigin/uBOL-home/issues).

## Admin Policies

uBOL exposes settings that can be defined by administrators through [managed storage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/managed). See [Managed settings](https://github.com/uBlockOrigin/uBOL-home/wiki/Managed-settings).

## Frequently Asked Questions (FAQ)

For more information, check the [_Wiki_](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ)).
