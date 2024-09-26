# uBO Lite

<p align="center">
<a href="https://chrome.google.com/webstore/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh"><img src="https://user-images.githubusercontent.com/585534/107280622-91a8ea80-6a26-11eb-8d07-77c548b28665.png" alt="Get uBO Lite for Chromium"></a>
<a href="https://microsoftedge.microsoft.com/addons/detail/ublock-origin-lite/cimighlppcgcoapaliogpjjdehbnofhn"><img src="https://user-images.githubusercontent.com/585534/107280673-a5ece780-6a26-11eb-9cc7-9fa9f9f81180.png" alt="Get uBlock Origin Lite for Microsoft Edge"></a>
<br>
<sub><a href="https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ)">Frequently asked questions (FAQ)</a></sub>
</p>

## Description

**uBO Lite** (uBOL), a **permission-less** [MV3 API-based](https://developer.chrome.com/docs/extensions/mv3/intro/) content blocker.

uBOL is entirely declarative, meaning there is no need for a permanent uBOL process for the filtering to occur, and CSS/JS injection-based content filtering is [performed reliably](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/registerContentScripts) by the browser itself rather than by the extension. This means that uBOL itself does not consume CPU/memory resources while content blocking is ongoing -- uBOL's service worker process is required _only_ when you interact with the popup panel or the option pages.

uBOL does not require broad "read/modify data" [permission](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions) at install time, hence its limited capabilities out of the box compared to uBlock Origin or other content blockers requiring broad "read/modify data" permissions at install time.

**However**, uBOL allows you to *explicitly* grant extended permissions on specific sites of your choice so that it can better filter on those sites using declarative cosmetic and scriptlet injections.

To grant extended permissions on a given site, open the popup panel and pick a higher filtering mode such as Optimal or Complete.

![uBOL's popup panel: no permission](https://user-images.githubusercontent.com/585534/195468156-d7e63ab9-abfa-443c-a8f6-e646a29b801e.png)

The browser will then warn you about the effects of granting the additional permissions requested by the extension on the current site, and you will have to tell the browser whether you accept or decline the request:

![uBOL's popup panel: browser warning](https://user-images.githubusercontent.com/585534/195342593-2b82b740-70a3-4507-a0e5-d7aee803b286.png)

If you accept uBOL's request for additional permissions on the current site, it will be able to better filter content for the current site:

![uBOL's popup panel: permissions to inject content](https://user-images.githubusercontent.com/585534/195342612-85d109d9-9006-4eb5-95a5-fec8a4f233ea.png)

You can set the default filtering mode from uBOL's options page. If you pick the Optimal or Complete mode as the default one, you will need to grant uBOL the permission to modify and read data on all websites:

![uBOL's options: Default filtering mode](https://user-images.githubusercontent.com/585534/195343335-a0aa103e-621e-4137-9bcf-9821dc881be1.png)

The default ruleset corresponds to at least uBlock Origin's default filterset:

- uBlock Origin's built-in filter lists
- EasyList
- EasyPrivacy
- Peter Lowe’s Ad and tracking server list

You can enable more rulesets by visiting the options page -- click the _Cogs_ icon in the popup panel.

Keep in mind this is still a work in progress, with these end goals:

- No broad host permissions at install time -- extended permissions are granted explicitly by the user on a per-site basis.

- Entirely declarative for reliability and CPU/memory efficiency.

## Changelog

See [_Releases_ section](https://github.com/uBlockOrigin/uBOL-home/releases).

Previous releases can be found in [_Releases_ section of uBlock repo](https://github.com/gorhill/uBlock/releases?q=uBOL_).

## Issues

All uBO Lite-related issues (including filter-related ones) [go here](https://github.com/uBlockOrigin/uBOL-home/issues).

## Admin policies

uBOL exposes settings to be defined by administrators through [managed storage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/managed):

#### `noFiltering`

An array of hostnames (string) for which no filtering will occur.

#### `disableFirstRunPage`

A boolean which if set to `true` will prevent uBOL's first-run page to be opened.

## Frequently asked questions (FAQ)

See [_Wiki_](https://github.com/uBlockOrigin/uBOL-home/wiki/Frequently-asked-questions-(FAQ)).
