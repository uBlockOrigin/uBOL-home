----------

### 2025.906.1308

- [Move redirect/removeParams/modifyHeaders rules to static rulesets](https://github.com/gorhill/uBlock/commit/4fbcabbc66)

----------

###  2025.831.1814 

- [Ensure ui is visible even after failure](https://github.com/gorhill/uBlock/commit/d1a29d9899)
- [Merge AdGuard mobile filters with uBO's own mobile filters](https://github.com/gorhill/uBlock/commit/bc05f31cc2)
- Updated filter lists

----------

###  2025.825.1605 

- [Fix regression in managing redirect rules](https://github.com/gorhill/uBlock/commit/69fa0c2e09)
- Updated filter lists

----------

###  2025.824.1755 

- [Improve built-in parser to convert filters to DNR rules](https://github.com/gorhill/uBlock/commit/cb62e38f50)
- [Support custom filters using CSS pseudo-elements](https://github.com/gorhill/uBlock/commit/bc4e829427)
- Updated filter lists

----------

###  2025.818.1918

- [Add support for `regexSubstitution` from `uritransform`](https://github.com/gorhill/uBlock/commit/fad0af591f)
- [Improve internal error reporting in troubleshooting info](https://github.com/gorhill/uBlock/commit/25d9964b1e)
- [Fix unremovable custom filters created using older versions](https://github.com/gorhill/uBlock/commit/d54c4a7052)
- [Fix custom filter list being unscrollable](https://github.com/gorhill/uBlock/commit/718b3cdb97)
- Safari-specific:
  - [Workaround for `urlFilter` with path part ending with `^`](https://github.com/gorhill/uBlock/commit/5957656a5b)
  - [Do not inject CSS in embedded contexts](https://github.com/gorhill/uBlock/commit/4d2cfd1487)
- Updated filter lists

----------

### 2025.812.1339

- [Fix target URL when reporting from a strict-blocked page](https://github.com/gorhill/uBlock/commit/18f9acd844)
- [Share console error in troubleshooting information](https://github.com/gorhill/uBlock/commit/28ea00fd11)
- [Fix potentially unremovable custom filters](https://github.com/gorhill/uBlock/commit/a1a5f3690f)
- [Disable "strict blocking" by default in Safari](https://github.com/gorhill/uBlock/commit/19a3de901c)
- [Add "EasyList -- Notifications"](https://github.com/gorhill/uBlock/commit/cf70f2abbc)
- [Normalize request method names to lowercase in _Develop_ converter](https://github.com/gorhill/uBlock/commit/b9956a8d18)
- [Remove spurious console message in content script](https://github.com/gorhill/uBlock/commit/dfa47baddf)
- [Propagate DNR API errors to "Filter lists" pane](https://github.com/gorhill/uBlock/commit/93206e3241)
- [Fix browser permissions scanning at launch](https://github.com/gorhill/uBlock/commit/e645fe7468)
- [Add spinner as visual feedback when rulesets are being registered](https://github.com/gorhill/uBlock/commit/b6829698cc)
- [Prevent scrolling taking over moving dialog in picker](https://github.com/gorhill/uBlock/commit/2d2de3a53b)
- Updated filter lists

----------

### 2025.804.1547

- [Add support for custom procedural cosmetic filters](https://github.com/gorhill/uBlock/commit/32bf5ebde3)
- Updated filter lists

----------

### 2025.728.1406

- Updated filter lists

----------

### 2025.725.1450

- [Merge all `:style()` filters with procedural filters](https://github.com/gorhill/uBlock/commit/fed7f4a0b8)
- [Remove hostname normalization regarding filtering mode](https://github.com/gorhill/uBlock/commit/d7686a815e)
- [Fix potential exception in procedural operator `:matches-attr`](https://github.com/gorhill/uBlock/commit/e07e7bbd09)
- Updated filter lists

----------

### 2025.718.1921

- [Make the slider continuous rather than granular](https://github.com/gorhill/uBlock/commit/2c91bfc872)
- [Fix compatibility layer code](https://github.com/gorhill/uBlock/commit/cc7e7894c7)
- [Load procedural CSS code on demand](https://github.com/gorhill/uBlock/commit/e75e128a34)
- [Normalize rulesets read from package](https://github.com/gorhill/uBlock/commit/6bfa7245f3)
- [Adjust CSS for small display](https://github.com/gorhill/uBlock/commit/1a8238e03e)
- Updated filter lists

----------

### 2025.711.1256

- [Slightly rework popup panel layout](https://github.com/gorhill/uBlock/commit/f88ffcea04)
- Updated translations
- Updated filter lists

----------

### 2025.709.1622

- [Fix spurious filter conversion when pasting in editor](https://github.com/gorhill/uBlock/commit/6b7f929ec5)
- [Add support for custom CSS-based cosmetic filters](https://github.com/gorhill/uBlock/commit/0b0294af4f)
    - This is a first release of the feature, and as such only plain CSS-based filters are supported
- Updated filter lists

----------

### 2025.703.1440

- [Fix calculation of priority value when converting redirect filters](https://github.com/gorhill/uBlock/commit/eec2045645)
- [Fix regression in syntax highlighting of dark theme](https://github.com/gorhill/uBlock/commit/9c08e902bd)
- [Add access to troubleshooting info in About pane](https://github.com/gorhill/uBlock/commit/9bcfc8ff1c)
- [Fix newline assistant in mode editor](https://github.com/gorhill/uBlock/commit/27936f476e)
- Updated filter lists

----------

### 2025.624.1503

- [Add support to exclude lists from specific platforms](https://github.com/gorhill/uBlock/commit/e33bfc1f01)
- [Add ability to convert pasted filters to DNR rules](https://github.com/gorhill/uBlock/commit/e8fb0e1cc9)
- Updated filter lists

----------

### 2025.619.2143

- [Expand "Develop" pane](https://github.com/gorhill/uBlock/commit/b50341089d)
- Updated filter lists

----------

### 2025.612.1428

- [Collect/apply highly generic cosmetic exceptions across lists](https://github.com/gorhill/uBlock/commit/76d8b97869)
- [Properly refresh "Developer mode" checkbox on changes](https://github.com/gorhill/uBlock/commit/508138764d)
- Updated filter lists

----------

### 2025.605.2042

- Updated filter lists

----------

### 2025.603.859

- Updated filter lists

----------

### 2025.601.2131

- [Add support for custom DNR rules](https://github.com/gorhill/uBlock/commit/9339a75952)
    - Documentation: [Dashboard/Develop](https://github.com/uBlockOrigin/uBOL-home/wiki/Dashboard:-Develop)
- Updated filter lists

----------

### 2025.525.2314

- [Remove CERT.PL's Warning List](https://github.com/gorhill/uBlock/commit/686eefd6b0)
- [Add to troubleshooting info whether webext API calls failed](https://github.com/gorhill/uBlock/commit/2076d42239)
- [Give admins ability to prevent usage of zapper](https://github.com/gorhill/uBlock/commit/ecc64ae1)
- [Allow body element to vertically scroll](https://github.com/gorhill/uBlock/commit/4eae23065e)
- [Add support to convert header= option to DNR rules](https://github.com/gorhill/uBlock/commit/408b538e75)
- [Add browser info in troubleshooting data](https://github.com/gorhill/uBlock/commit/be8b6238d3)
- Updated filter lists

----------

### 2025.518.1611

- [Add "AdGuard -- Mobile Ads"](https://github.com/gorhill/uBlock/commit/ed10973717)
- [Use CodeMirror editor for list of no-filtering websites](https://github.com/gorhill/uBlock/commit/fd5da3fcd2)
- [Add ability to reset zapper selection on mobile devices](https://github.com/gorhill/uBlock/commit/d12e7817d2)
- Fine-tuning of various CSS properties
- Updated filter lists

----------

### 2025.512.1008

- [Mind discarded regex- or path-based entries when determining genericity](https://github.com/gorhill/uBlock/commit/3292f128d2)
- [Just force a reload when URL doesn't change](https://github.com/gorhill/uBlock/commit/3ff54b7f2a)
- [New approach to toggle toolbar icon not requiring extra permissions](https://github.com/gorhill/uBlock/commit/cc2760f4d6)
- Updated filter lists

----------

### 2025.5.5.1364

- [Fix strict-block exceptions causing duplicate rule ids](https://github.com/gorhill/uBlock/commit/58f5c53fbbf3e8173a84bd49ff38846f739f9346)
- Updated filter lists

----------

### 2025.5.4.1310

- Updated filter lists

----------

### 2025.4.27.1394

- [Add more managed policies](https://github.com/gorhill/uBlock/commit/a56e13156f)
- [Reflect no-filtering mode on the toolbar icon](https://github.com/gorhill/uBlock/commit/203b2235aa)
- [Separate EasyList, EasyPrivacy, PGL lists from uBlock filters](https://github.com/gorhill/uBlock/commit/0e5dec7fbb)
- Updated filter lists

----------

### 2025.4.21.839

- [Add admin setting `defaultFiltering`](https://github.com/gorhill/uBlock/commit/b8adf5b027)
- [Mitigate issues when hitting regex-based rules limit](https://github.com/gorhill/uBlock/commit/ec19e352b1)
- [Mind excluded `to=` hostnames in strict-block rules](https://github.com/gorhill/uBlock/commit/e20e6addf0)
- Updated filter lists

----------

### 2025.4.13.1188


- [Remove "permission-less" status at install time](https://github.com/gorhill/uBlock/commit/01e36db23a)
- Updated filter lists

----------

### 2025.4.6.1238

- Updated filter lists

----------

### 2025.4.1.700

- Emergency release due to bad filter potentially causing breakage
- Updated filter lists

----------

### 2025.3.30.1290

- Updated filter lists

----------

### 2025.3.23.1241

- [Bring back element zapper](https://github.com/gorhill/uBlock/commit/ab458b492a)
- [Add support for explicit `generichide` filter option](https://github.com/gorhill/uBlock/commit/98b011f64c)
- Updated filter lists

----------

### 2025.3.16.1281

- [Avoid re-entrance when registering content scripts](https://github.com/gorhill/uBlock/commit/c3187d85e8)
- [Improve generic cosmetic filtering](https://github.com/gorhill/uBlock/commit/a009623d97)
- [Minor changes to account for Edge build](https://github.com/gorhill/uBlock/commit/94db43c4ad)
- Updated filter lists

----------

### 2025.3.8.1350

- [Add support for ancestor context syntax in scriptlets](https://github.com/gorhill/uBlock/commit/d006fd06e7)
- [Add test suite list to available rulesets](https://github.com/gorhill/uBlock/commit/536f0fba25)
- [Convert `domain=` to `to=` for `csp=`/`permissions=` options](https://github.com/gorhill/uBlock/commit/1dbd280ba3)
- [Inject surveyor in frames](https://github.com/gorhill/uBlock/commit/b29ac98094)
- Updated filter lists

----------

### 2025.3.2.1298

- [Inject scriptlets in their intended target world](https://github.com/gorhill/uBlock/commit/8a6b12a319)
- Updated filter lists

----------

### 2025.2.23.1382

- [Remove obsolete Firefox workaround code](https://github.com/gorhill/uBlock/commit/02b78fb717)
- [Workaround for permissions dialog preventing proper mode change](https://github.com/gorhill/uBlock/commit/1d2378e74e)
- [Comply with Mozilla's "User Consent and Control"](https://github.com/gorhill/uBlock/commit/344539d793)
- [Fix incorrect hostname matching in urlskip-related code](https://github.com/gorhill/uBlock/commit/17c66030fe)
- Updated filter lists

----------

### 2025.2.19.775

- Updated filter lists

----------

### 2025.1.14.952

- Updated filter lists

----------

### 2025.1.7.268

- Updated filter lists

----------

### 2024.12.30.1320

- [Extend strict-blocking coverage; improve URL-skip behavior](https://github.com/gorhill/uBlock/commit/61922da24b)
- Updated filter lists

----------

### 2024.12.23.23

- [Enable OpenPhish ruleset by default](https://github.com/gorhill/uBlock/commit/89e44131a0)
- [Fix undue blocking of network requests for unfiltered sites](https://github.com/gorhill/uBlock/commit/c311315daa)
- Updated filter lists

----------

### 2024.12.15.1269

- Updated filter lists

----------

### 2024.12.10.932

- Updated filter lists

----------

### 2024.12.9.805

- [Fix regression in `set-constant` scriptlet](https://github.com/gorhill/uBlock/commit/2ccb01973e)
- Updated filter lists

----------

### 2024.12.8.1320

- [Ensure no generic cosmetic filters end up in specific realm](https://github.com/gorhill/uBlock/commit/56ba93700c)
- [Add `urlskip` support for strict-blocked page](https://github.com/gorhill/uBlock/commit/38390bab9c)
- [Implement strict blocking](https://github.com/gorhill/uBlock/commit/aa05cb32c6)
- Updated filter lists

----------

### 2024.12.2.22

- Updated filter lists

----------

### 2024.11.25.1376

- [Add ability for admins to disable features](https://github.com/gorhill/uBlock/commit/346b5ded7c)
- Updated filter lists

----------

### 2024.11.20.858

- [Fix flaw breaking scriptlets injection in optimal/basic mode](https://github.com/gorhill/uBlock/commit/6355a17187)
- Updated filter lists

----------

### 2024.11.19.1126

- [Fix force-reloading repeatedly when erroring at load time](https://github.com/gorhill/uBlock/commit/f3486275e9)
- [Batch changes thru dashboard UI to reduce worker's workload](https://github.com/gorhill/uBlock/commit/114acacd2e)
- [Fix `removeparam` potentially causing invalid DNR rules](https://github.com/gorhill/uBlock/commit/f9ce06977d)
- [Re-work dashboard: move list of rulesets in its own pane](https://github.com/gorhill/uBlock/commit/ae4754415c)
- [Add "RU AdList: Counters" to stock lists](https://github.com/gorhill/uBlock/commit/b4a5b411b5)
- [Slightly mitigate DNR flaw re. `removeparam` filters](https://github.com/gorhill/uBlock/commit/947602d4fe)
- Updated filter lists

----------

### 2024.11.15.813

- Updated filter lists

----------

### 2024.11.13.865

- [Remove obsolete Firefox-only workaround in scriptlet template](https://github.com/gorhill/uBlock/commit/2e745f9bfb)
- Updated filter lists

----------

### 2024.11.11.1298

- [Add support to add/remove rulesets through policies](https://github.com/gorhill/uBlock/commit/15dae359f7e9e75c49a86bad8a05ec3f7add3c35) (see [Managed settings / `rulesets`](https://github.com/uBlockOrigin/uBOL-home/wiki/Managed-settings#rulesets))
- Updated filter lists

----------

### 2024.11.3.1351

- Updated filter lists

----------

### 2024.10.28.929

- Updated filter lists

----------

### 2024.10.20.869

- [Fixed _Optimal_ or _Complete_ filtering potentially broken everywhere when enabling _AdGuard Chinese_ or _AdGuard Turskish_](https://github.com/gorhill/uBlock/commit/d4f15ca635)
- Updated filter lists

----------

### 2024.10.14.189

- Updated filter lists

----------

### 2024.10.6.1334

- Updated filter lists

----------

### 2024.9.29.1273

- [Add a _chat_ icon in popup panel to report filter issues](https://github.com/gorhill/uBlock/commit/560def639f)
- Updated filter lists

----------

### 2024.9.22.986

- Updated filter lists

----------

### 2024.9.12.1004

- Updated filter lists

----------

### 2024.9.1.1266

- Updated filter lists

----------

### 2024.8.21.996

- Updated filter lists

----------

### 2024.8.19.905

- Updated filter lists

----------

### 2024.8.12.902

- Updated filter lists

----------

### 2024.8.5.925

- Updated filter lists

----------
