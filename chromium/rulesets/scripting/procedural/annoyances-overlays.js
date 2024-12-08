/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2014-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock
*/

/* jshint esversion:11 */

'use strict';

// ruleset: annoyances-overlays

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\"#home-section3\",\"tasks\":[[\"has-text\",\"Newsletter\"]]}"],["{\"selector\":\".MuiBox-root\",\"tasks\":[[\"has-text\",\"Subscribe to our Newsletter\"]]}"],["{\"selector\":\"\",\"tasks\":[[\"xpath\",\"//*[contains(text(),\\\"blocking software\\\")]/../../..\"]]}","{\"selector\":\".advanced.embed-media\",\"tasks\":[[\"has-text\",\"Get a daily look\"]]}"],["{\"selector\":\".align-items-center.py-2\",\"tasks\":[[\"has-text\",\"Sign Up\"]]}"],["{\"selector\":\".article-body > p\",\"tasks\":[[\"has-text\",\"sign up for our newsletters\"]]}"],["{\"selector\":\".article-content-wrapper > p\",\"tasks\":[[\"has-text\",\"into your inbox\"]]}","{\"selector\":\"strong > em\",\"tasks\":[[\"has-text\",\"Sign up\"]]}"],["{\"selector\":\".bg-cover\",\"tasks\":[[\"has-text\",\"Sign up\"]]}","{\"selector\":\".bg-dark-brown\",\"tasks\":[[\"has-text\",\"Sign up\"]]}"],["{\"selector\":\".bg-fok-gray-500\",\"tasks\":[[\"has-text\",\"Join our mailing list\"]]}"],["{\"selector\":\".bg-gray-100\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".bg-gray-50\",\"tasks\":[[\"has-text\",\"Fake news\"]]}","{\"selector\":\".hidden\",\"tasks\":[[\"has-text\",\"Fake news\"]]}"],["{\"selector\":\".bg-gray-600\",\"tasks\":[[\"has-text\",\"Read the latest business news\"]]}"],["{\"selector\":\".bg-left.bg-cover\",\"tasks\":[[\"has-text\",\"Subscribe\"]]}"],["{\"selector\":\".bg-primary-dark\",\"tasks\":[[\"has-text\",\"newsletter\"]]}","{\"selector\":\".border-primary-dark\\\\/50\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".bg-purple-50\",\"tasks\":[[\"has-text\",\"Fan of great business\"]]}","{\"selector\":\".md\\\\:px-2.py-10\",\"tasks\":[[\"has-text\",\"Subscribe to the newsletter\"]]}"],["{\"selector\":\".border-gray-175\",\"tasks\":[[\"has-text\",\"BT in your inbox\"]]}"],["{\"selector\":\".border-gray-200\",\"tasks\":[[\"has-text\",\"Get the news\"]]}","{\"selector\":\".border-secondary-900\",\"tasks\":[[\"has-text\",\"Get the news\"]]}"],["{\"selector\":\".callout\",\"tasks\":[[\"has-text\",\"inbox\"]]}"],["{\"selector\":\".card-body\",\"tasks\":[[\"has-text\",\"Daily Newsletter\"]]}"],["{\"selector\":\".col1span3\",\"tasks\":[[\"has-text\",\"Newsletters\"]]}"],["{\"selector\":\".content-panel-container\",\"tasks\":[[\"has-text\",\"Get recipes\"]]}"],["{\"selector\":\".elementor-button-link\",\"tasks\":[[\"has-text\",\"Sign Up\"]]}"],["{\"selector\":\".elementor-shortcode\",\"tasks\":[[\"has-text\",\"Signup Now\"]]}"],["{\"selector\":\".et_pb_row_1_tb_body\",\"tasks\":[[\"has-text\",\"Sign up for our weekly newsletter\"]]}","{\"selector\":\".et_pb_section\",\"tasks\":[[\"has-text\",\"Sign up for our weekly newsletter\"]]}"],["{\"selector\":\".fusion_builder_column_inner_1_1\",\"tasks\":[[\"has-text\",\"BNC Newsletters\"]]}"],["{\"selector\":\".has-background\",\"tasks\":[[\"has-text\",\"Never miss a post\"]]}"],["{\"selector\":\".has-border-color.wp-block-columns\",\"tasks\":[[\"has-text\",\"NEWSLETTER\"]]}"],["{\"selector\":\".has-border-color\",\"tasks\":[[\"has-text\",\"Discover more\"]]}"],["{\"selector\":\".has-medium-font-size\",\"tasks\":[[\"has-text\",\"Join our free newsletter\"]]}"],["{\"selector\":\".has-primary-dark-background-color\",\"tasks\":[[\"has-text\",\"Sign up\"]]}"],["{\"selector\":\".has-secondary-background-color\",\"tasks\":[[\"has-text\",\"Subscribe\"]]}","{\"selector\":\".wp-block-group\",\"tasks\":[[\"has-text\",\"Subscribe to our Newsletter\"]]}"],["{\"selector\":\".m-detail--body > p\",\"tasks\":[[\"has-text\",\"Sign up for the\"]]}"],["{\"selector\":\".mx-auto.container\",\"tasks\":[[\"has-text\",\"NEWSLETTER\"]]}"],["{\"selector\":\".optin\",\"tasks\":[[\"has-text\",\"Sign Up\"]]}"],["{\"selector\":\".p-4.bg-\\\\[\\\\#F5F5F5\\\\]\",\"tasks\":[[\"has-text\",\"Subscribe to our newsletter\"]]}"],["{\"selector\":\".p1\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".px20.pb32\",\"tasks\":[[\"has-text\",\"Sign up for\"]]}"],["{\"selector\":\".recommendationSection\",\"tasks\":[[\"has-text\",\"Newsletter\"]]}"],["{\"selector\":\".row > .entry-content > p\",\"tasks\":[[\"has-text\",\"daily newsletter\"]]}"],["{\"selector\":\".sidebar-form\",\"tasks\":[[\"has-text\",\"Sign Up For Our Newsletter\"]]}"],["{\"selector\":\".t-bg-surface-zero.t-p-6\",\"tasks\":[[\"has-text\",\"Newsletter\"]]}"],["{\"selector\":\".w-embed\",\"tasks\":[[\"has-text\",\"Sign up now\"]]}"],["{\"selector\":\".wp-block-column > .is-layout-flow.wp-block-group\",\"tasks\":[[\"has-text\",\"Subscribe\"]]}"],["{\"selector\":\".wp-block-cover-is-layout-flow\",\"tasks\":[[\"has-text\",\"Get our newsletter\"]]}"],["{\"selector\":\".wp-block-genesis-blocks-gb-columns\",\"tasks\":[[\"has-text\",\"Subscribe by Email\"]]}","{\"selector\":\".wp-block-genesis-blocks-gb-container\",\"tasks\":[[\"has-text\",\"Free Email Guide\"]]}"],["{\"selector\":\".wp-block-group-is-layout-flow.has-background.has-base-background-color\",\"tasks\":[[\"has-text\",\"Email Me This For Later\"]]}"],["{\"selector\":\".wp-block-group-is-layout-flow\",\"tasks\":[[\"has-text\",\"Subscribe\"]]}"],["{\"selector\":\".wp-block-group__inner-container\",\"tasks\":[[\"has-text\",\"Discover more\"]]}"],["{\"selector\":\"#custom_html-12\",\"tasks\":[[\"has-text\",\"newsletters\"]]}"],["{\"selector\":\"div.wp-block-cover\",\"tasks\":[[\"has-text\",\"Be the first to know\"]]}"],["{\"selector\":\".bottom-0.fixed\",\"tasks\":[[\"has-text\",\"weekly newsletters\"]]}","{\"selector\":\".lg\\\\:p-\\\\[16px\\\\]\",\"tasks\":[[\"has-text\",\"newsletters\"]]}"],["{\"selector\":\"em > strong\",\"tasks\":[[\"has-text\",\"daily newsletter\"]]}"],["{\"selector\":\".p-6.justify-center\",\"tasks\":[[\"has-text\",\"Daily newsletter\"]]}"],["{\"selector\":\".order-lg-2\",\"tasks\":[[\"has-text\",\"Sign up to our newsletter\"]]}","{\"selector\":\".sidebar-sticky\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".comp > strong\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".pb-1.gap-4\",\"tasks\":[[\"has-text\",\"Sign up for\"]]}","{\"selector\":\".pb-6\",\"tasks\":[[\"has-text\",\"Newsletter\"]]}"],["{\"selector\":\".td-block-title.block-title\",\"tasks\":[[\"has-text\",\"NEWSLETTER\"]]}"],["{\"selector\":\"form\",\"tasks\":[[\"has-text\",\"Subscribe and thrive\"]]}","{\"selector\":\"form\",\"tasks\":[[\"has-text\",\"Your inbox is ready\"]]}"],["{\"selector\":\".has-senary-background-color\",\"tasks\":[[\"has-text\",\"Email\"]]}","{\"selector\":\".has-tertiary-background-color\",\"tasks\":[[\"has-text\",\"Week\"]]}"],["{\"selector\":\".bg-gray-100\",\"tasks\":[[\"has-text\",\"Sign up\"]]}"],["{\"selector\":\".v-card.v-card--flat\",\"tasks\":[[\"has-text\",\"Sign up to receive\"]]}"],["{\"selector\":\".w-full\",\"tasks\":[[\"has-text\",\"Mailing\"]]}"],["{\"selector\":\"h3.section_name\",\"tasks\":[[\"has-text\",\"Newsletter\"]]}"],["{\"selector\":\".d-lg-block.sp-module\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".pb-6.border-b\",\"tasks\":[[\"has-text\",\"Signup\"]]}"],["{\"selector\":\"p > em\",\"tasks\":[[\"has-text\",\"Sign up for\"]]}"],["{\"selector\":\".p-8.bg-dynamic-primary\",\"tasks\":[[\"has-text\",\"straight to your inbox\"]]}"],["{\"selector\":\".shadow-card.p-8\",\"tasks\":[[\"has-text\",\"Laravel Newsletter\"]]}"],["{\"selector\":\".pt-\\\\[60px\\\\]\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".fxsEzN\",\"tasks\":[[\"has-text\",\"Sign up to our newsletter\"]]}"],["{\"selector\":\"section.sidebar-section\",\"tasks\":[[\"has-text\",\"email\"]]}"],["{\"selector\":\".has-background.has-dark-gray-background-color\",\"tasks\":[[\"has-text\",\"Sign up\"]]}"],["{\"selector\":\".sidebar-item-container\",\"tasks\":[[\"has-text\",\"Email me\"]]}"],["{\"selector\":\".has-background\",\"tasks\":[[\"has-text\",\"/newsletter|inbox/\"]]}"],["{\"selector\":\".promo-card-primary\",\"tasks\":[[\"has-text\",\"Check your inbox\"]]}"],["{\"selector\":\".pull-right.inline-gallery-container\",\"tasks\":[[\"has-text\",\"Post this\"]]}"],["{\"selector\":\".mobile-only-on-col-ab\",\"tasks\":[[\"has-text\",\"Subscribe\"]]}"],["{\"selector\":\".bg-gray-50\",\"tasks\":[[\"has-text\",\"Want to stay informed\"]]}"],["{\"selector\":\".border-brand-pink\",\"tasks\":[[\"has-text\",\"inbox\"]]}"],["{\"selector\":\".md\\\\:decorative-horizontal-lines\",\"tasks\":[[\"has-text\",\"subscribe\"]]}"],["{\"selector\":\"strong\",\"tasks\":[[\"has-text\",\"daily newsletter\"]]}"],["{\"selector\":\".hide.post__sidebar\",\"tasks\":[[\"has-text\",\"Share this article\"]]}"],["{\"selector\":\".elementor-section\",\"tasks\":[[\"has-text\",\"Subscribe for\"]]}","{\"selector\":\".elementor-widget-container\",\"tasks\":[[\"has-text\",\"tired of censorship\"]]}"],["{\"selector\":\"[style=\\\"text-align:center\\\"]\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".text_multiline\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".wp-block-pullquote\",\"tasks\":[[\"has-text\",\"Sign up for\"]]}"],["{\"selector\":\".wp-block-group__inner-container\",\"tasks\":[[\"has-text\",\"Discover\"]]}"],["{\"selector\":\"strong > .link--button\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".restricted-body.html-content\",\"tasks\":[[\"has-text\",\"Email us\"]]}","{\"selector\":\".restricted-body.html-content\",\"tasks\":[[\"has-text\",\"your inbox\"]]}"],["{\"selector\":\".wp-block-quote\",\"tasks\":[[\"has-text\",\"inbox daily\"]]}"],["{\"selector\":\"p.t-links-underlinedy\",\"tasks\":[[\"has-text\",\"Sign up for The Brief\"]]}"],["{\"selector\":\".LostInventoryMessage_root__YllYq\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\"[data-testid=\\\"contributions-liveblog-epic\\\"]\",\"tasks\":[[\"has-text\",\"daily newsletter\"]]}"],["{\"selector\":\".bg-soft-teal\",\"tasks\":[[\"has-text\",\"Subscribe\"]]}"],["{\"selector\":\".rounded-3.px-5\",\"tasks\":[[\"has-text\",\"Newsletter\"]]}"],["{\"selector\":\".rounded-md.md\\\\:p-8.p-5.shadow-light\",\"tasks\":[[\"has-text\",\"Sign up\"]]}"],["{\"selector\":\".duet--article--highlight\",\"tasks\":[[\"has-text\",\"Sign up here\"]]}"],["{\"selector\":\".textwidget > .textwidget\",\"tasks\":[[\"has-text\",\"Subscribe\"]]}"],["{\"selector\":\".has-medium-font-size\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".mt-\\\\[2rem\\\\]\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\"div[class^=\\\"-_\\\"] > form\",\"tasks\":[[\"has-text\",\"newsletters\"]]}"],["{\"selector\":\".section > .wrapper\",\"tasks\":[[\"has-text\",\"Newsletters\"]]}"],["{\"selector\":\".bg-light\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".widget_text\",\"tasks\":[[\"has-text\",\"newsletter\"]]}"],["{\"selector\":\".border.rounded.p-2\",\"tasks\":[[\"has-text\",\"news letter\"]]}"],["{\"selector\":\".moola-search-view\",\"tasks\":[[\"has-text\",\"hide these ads\"]]}"],["{\"selector\":\".notificationsContainer\",\"tasks\":[[\"has-text\",\"whitelisten of beleef Tweakers\"]]}"],["{\"selector\":\"#modal_login\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\".fbUserStory\",\"tasks\":[[\"has-text\",\"Popular Across Facebook\"]]}","{\"selector\":\".userContentWrapper\",\"tasks\":[[\"has-text\",\"Popular Across Facebook\"]]}"],["{\"selector\":\"\",\"tasks\":[[\"xpath\",\"//*[contains(text(),\\\"AdB\\\")]\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"/addLinkToCopy/i\"]]}"],["{\"selector\":\"div[tabindex=\\\"0\\\"]\",\"tasks\":[[\"matches-css\",{\"name\":\"position\",\"value\":\"^fixed$\"}],[\"spath\",\":has([href=\\\"/signup\\\"])\"]]}"],["{\"selector\":\"\",\"tasks\":[[\"xpath\",\"//div[contains(text(),\\\"Adblock\\\")]/..\"]]}"],["{\"selector\":\".js-dismissable-hero\",\"tasks\":[[\"has-text\",\"Sign up\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"oncontextmenu\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"We think our Android\"]]}"],["{\"selector\":\"#root > div > div\",\"tasks\":[[\"has-text\",\"Get one more story in your member\"]]}","{\"selector\":\".overlay\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has-text\",\"Welcome back\"]]}],[\"not\",{\"selector\":\"\",\"tasks\":[[\"has-text\",\"write a response\"]]}],[\"not\",{\"selector\":\"\",\"tasks\":[[\"has-text\",\"Publish now\"]]}]]}"],["{\"selector\":\"body > div:nth-of-type(1) > div\",\"tasks\":[[\"has-text\",\"adblocker\"]]}"],["{\"selector\":\".dark-theme-dialog__dialogBody___106Di\",\"tasks\":[[\"upward\",4]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"copyprotect\"]]}"],["{\"selector\":\".modal-content\",\"tasks\":[[\"has\",{\"selector\":\".text > b\",\"tasks\":[[\"has-text\",\"Privacy Policy\"]]}]]}"],["{\"selector\":\".adsbygoogle\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"debugger\"]]}"],["{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"@media print\"]]}"],["{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"::selection\"]]}"],["{\"selector\":\"h2\",\"tasks\":[[\"has-text\",\"Using an ad blocker?\"],[\"upward\",3]]}"],["{\"selector\":\"\",\"tasks\":[[\"xpath\",\"//*[contains(text(),\\\"Adblock\\\")]\"]]}"],["{\"selector\":\"p > b\",\"tasks\":[[\"xpath\",\"//*[contains(text(),\\\"AdBlock\\\")]\"]]}"],["{\"selector\":\".adbanner\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"user-select\"]]}"],["{\"selector\":\"div[style] > div > .userBanner--red\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\"[href=\\\"/about#support\\\"]\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\"div[class=\\\"container_box content_box\\\"] > div:only-child > div:last-child > div:last-child > ins.adsbygoogle\",\"tasks\":[[\"upward\",4]]}","{\"selector\":\"div[class=\\\"container_box content_box\\\"] > div[id][class] > div:last-child > div:last-child > ins.adsbygoogle\",\"tasks\":[[\"upward\",3]]}","{\"selector\":\"div[id][class][style^=\\\"position:\\\"] > div:last-child > div:last-child > ins.adsbygoogle\",\"tasks\":[[\"upward\",3]]}"],["{\"selector\":\".ct_warn\",\"tasks\":[[\"has-text\",\"adblock\"]]}"],["{\"selector\":\".has-profile.post:first-child\",\"tasks\":[[\"has-text\",\"/adblock/i\"]]}"],["{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"/-moz-user-select:none|@media print/\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"innerText\"]]}"],["{\"selector\":\".adsbygoogle\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",1]]}","{\"selector\":\"body > div[id]\",\"action\":[\"style\",\"visibility: hidden !important\"],\"tasks\":[[\"matches-css\",{\"name\":\"position\",\"value\":\"^fixed$\"}]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"window.carbonLoaded\"]]}"],["{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"user-select:\"]]}"],["{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"unselectable\"]]}"],["{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"-moz-none\"]]}"],["{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"/user-select|::selection/\"]]}"],["{\"selector\":\".ReactModal__Overlay--after-open\",\"tasks\":[[\"has-text\",\"/Premium|Try 7 days/\"]]}","{\"selector\":\".ReactModal__Overlay--after-open:has(iframe[srcdoc], img)\",\"tasks\":[[\"has-text\",\"signing up\"]]}","{\"selector\":\"main > div[class*=\\\"-\\\"] > div[class^=\\\"_\\\"] > div[class^=\\\"_\\\"] > div[class]\",\"tasks\":[[\"has\",{\"selector\":\"> div[class^=\\\"_\\\"]\",\"tasks\":[[\"has-text\",\"Do your part to support us\"]]}]]}"],["{\"selector\":\"#side > ins.adsbygoogle\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"#MainModule + div[class] > div[style^=\\\"width\\\"] > div > i[data-icon-name=\\\"OutlookLogo\\\"]\",\"tasks\":[[\"upward\",3]]}"],["{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"/media print|user-select:/\"]]}"],["{\"selector\":\"p\",\"tasks\":[[\"has-text\",\"Adblock\"]]}"],["{\"selector\":\"\",\"tasks\":[[\"xpath\",\"//*[contains(text(),\\\"blocker\\\")]\"]]}"],["{\"selector\":\"[data-text-as-pseudo-element*=\\\" push \\\"]\",\"tasks\":[[\"upward\",\"[role]\"],[\"upward\",\"[role]\"]]}"],["{\"selector\":\"[data-pw-desk]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"document.oncontextmenu\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"document.onkeydown\"]]}"],["{\"selector\":\".around-desktop-ad\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"section\",\"tasks\":[[\"has-text\",\"Winter-Update\"],[\"upward\",1]]}"],["{\"selector\":\"style\",\"tasks\":[[\"has-text\",\"user-select: none;\"]]}"],["{\"selector\":\"form[id=\\\"tfnewsearch\\\"]\",\"action\":[\"remove-attr\",\"onsubmit\"]}"],["{\"selector\":\"html\",\"action\":[\"remove-class\",\"modal-open\"],\"tasks\":[[\"watch-attr\",[\"class\"]]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"checkAdblockBait\"]]}"],["{\"selector\":\"html.show-intro-popup\",\"action\":[\"remove-class\",\"show-intro-popup\"]}"],["{\"selector\":\"body[oncontextmenu=\\\"return false\\\"]\",\"action\":[\"remove-attr\",\"oncontextmenu\"]}","{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"_0x\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"DisableDevtool\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"/oncontextmenu|devtools|stateObject|debugger/\"]]}"],["{\"selector\":\"html.no-scroll\",\"action\":[\"remove-class\",\"no-scroll\"]}"],["{\"selector\":\"[oncopy=\\\"return false\\\"]\",\"action\":[\"remove-attr\",\"oncopy\"]}"],["{\"selector\":\"[oncontextmenu=\\\"return false;\\\"]\",\"action\":[\"remove-attr\",\"oncontextmenu\"]}"],["{\"selector\":\".no-select\",\"action\":[\"remove-class\",\"no-select\"]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"document.onmousedown\"]]}"],["{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\":not(input):not(textarea)\"]]}"],["{\"selector\":\"a:has(shreddit-player)\",\"action\":[\"remove-attr\",\"href\"]}","{\"selector\":\"shreddit-player\",\"action\":[\"remove-attr\",\"autoplay\"]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"stopRefreshSite\"]]}"],["{\"selector\":\"[id=\\\"toggle_notification_notification-ad-blocker\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"nocontextmenu\"]]}"],["{\"selector\":\".ReactModalPortal\",\"tasks\":[[\"has-text\",\"mobile\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"devtoolsDetector\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"contextmenu\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"/contextmenu|devtool/\"]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"preventDefault\"]]}"],["{\"selector\":\"script[id=\\\"jquery-core-js-after\\\"]\",\"tasks\":[[\"has-text\",\"e.preventDefault();\"]]}"],["{\"selector\":\"button[type=\\\"submit\\\"]\",\"action\":[\"remove-attr\",\"disabled\"]}"],["{\"selector\":\".swal2-shown\",\"action\":[\"remove-class\",\"swal2-shown\"]}"],["{\"selector\":\".confirm\",\"tasks\":[[\"has-text\",\"AdBlocker\"]]}"],["{\"selector\":\".under-map-wrapper\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".elementor-top-column h6\",\"tasks\":[[\"has-text\",\"advertisement\"],[\"upward\",\".elementor-top-column\"]]}"],["{\"selector\":\"body\",\"action\":[\"remove-attr\",\"oncontextmenu\"]}"],["{\"selector\":\"body\",\"action\":[\"remove-attr\",\"/onselectstart|oncopy|oncontextmenu/\"]}"],["{\"selector\":\"*\",\"action\":[\"remove-attr\",\"oncontextmenu\"]}"],["{\"selector\":\"body\",\"action\":[\"remove-attr\",\"/oncopy|oncut|onpaste/\"]}"],["{\"selector\":\"body\",\"action\":[\"remove-attr\",\"contextmenu\"]}"],["{\"selector\":\".loading-text\",\"action\":[\"remove-class\",\"loading-text\"]}"],["{\"selector\":\"body[class^=\\\"scroll-block--is-blocked\\\"]\",\"action\":[\"remove-class\",\"/scroll-block--is-blocked/\"]}"],["{\"selector\":\"div[oncopy]\",\"action\":[\"remove-attr\",\"/oncopy|oncut|onpaste/\"]}"],["{\"selector\":\"body[oncontextmenu=\\\"return!1\\\"]\",\"action\":[\"remove-attr\",\"oncontextmenu\"]}"],["{\"selector\":\".forbidden_select\",\"action\":[\"remove-class\",\"forbidden_select\"]}"],["{\"selector\":\"div.confuse\",\"action\":[\"remove\",\"\"]}"]];

const hostnamesMap = new Map([["dailygalaxy.com",0],["coder.com",1],["foxnews.com",2],["marketbeat.com",3],["dailystar.co.uk",4],["dailydot.com",5],["thetransmitter.org",6],["forksoverknives.com",7],["bigthink.com",8],["babylonbee.com",9],["us500.com",10],["balls.ie",11],["crunchydata.com",12],["commoncog.com",13],["businesstimes.com.sg",14],["amgreatness.com",15],["calgaryherald.com",16],["edmontonjournal.com",16],["montrealgazette.com",16],["ottawacitizen.com",16],["thestarphoenix.com",16],["aspentimes.com",17],["craigdailypress.com",17],["postindependent.com",17],["skyhinews.com",17],["steamboatpilot.com",17],["vaildaily.com",17],["chron.com",18],["sfgate.com",18],["hellmanns.com",19],["ffrfaction.org",20],["bitcoinsensus.com",21],["advancedsciencenews.com",22],["bravenewcoin.com",23],["wyseguide.com",24],["linuxiac.com",25],["potatonewstoday.com",26],["thecooldown.com",27],["comicbook.com",28],["thebarbedwire.com",29],["mensjournal.com",30],["businessinsider.in",31],["bakerbynature.com",32],["cockroachlabs.com",33],["rd.com",34],["ctpost.com",35],["aarp.org",36],["cjr.org",37],["brooklynvegan.com",38],["interestingengineering.com",39],["ensemblemagazine.co.nz",40],["systemsapproach.org",41],["creepycatalog.com",42],["iheartrecipes.com",43],["lemonblossoms.com",44],["historiccity.com",45],["stitchsnitches.com",45],["labrujulaverde.com",46],["politicalwire.com",47],["cheknews.ca",48],["dlnews.com",49],["faithwire.com",50],["entrepreneur.com",51],["erlang-solutions.com",52],["ew.com",53],["fastcompany.com",54],["finsmes.com",55],["sherwood.news",56],["foxandbriar.com",57],["freethink.com",58],["gript.ie",59],["guitar.com",60],["heraldextra.com",61],["hot-dinners.com",62],["jointhefollowup.com",63],["jweekly.com",64],["kerrang.com",65],["laravel-news.com",66],["levernews.com",67],["londonpass.com",68],["marginalrevolution.com",69],["montanafreepress.org",70],["neo4j.com",71],["newsroom.co.nz",72],["newsroom.ucla.edu",73],["newswire.ca",74],["notateslaapp.com",75],["notthebee.com",76],["officialcharts.com",77],["pcmag.com",78],["people.com",79],["quantamagazine.org",80],["reclaimthenet.org",81],["salon.com",82],["sciencenorway.no",83],["sfpublicpress.org",84],["skepticalraptor.com",85],["countryandtownhouse.com",86],["stuff.co.nz",87],["taskandpurpose.com",88],["texastribune.org",89],["theatlantic.com",90],["theguardian.com",91],["theskimm.com",92],["thestreamable.com",93],["urbandictionary.com",94],["vox.com",95],["washington.edu",96],["worldsensorium.com",97],["yourstory.com",98],["androidauthority.com",99],["cultofmac.com",100],["market.samm.com",101],["recordcollectormag.com",102],["rprealtyplus.com",103],["flickr.com",104],["tweakers.net",105],["deezer.com",106],["facebook.com",107],["facebookcorewwwi.onion",107],["facebookwkhpilnemxj7asaniu7vnjjbiltxjqhye3mhbshg7kx5tfyd.onion",107],["wotlabs.net",108],["bloombergquint.com",109],["twitter.com",110],["x.com",110],["diffnow.com",111],["askubuntu.com",112],["mathoverflow.net",112],["serverfault.com",112],["stackapps.com",112],["stackexchange.com",112],["superuser.com",112],["yoututosjeff.es",113],["dailymail.co.uk",114],["500ish.com",115],["artplusmarketing.com",115],["atrium.co",115],["backchannel.com",115],["backstage.1blocker.com",115],["badootech.badoo.com",115],["baharudinyusuf.com",115],["bitcointechtalk.com",115],["blog.bitsrc.io",115],["blog.inkdrop.app",115],["bitwarden.com",115],["blog.coinbase.com",115],["blog.confiant.com",115],["blog.devcolor.org",115],["blog.growthhackers.com",115],["blog.hiri.com",115],["blog.ltse.com",115],["blog.statebox.org",115],["blog.twitch.tv",115],["blog.waffle.io",115],["bluerockpublicradio.com",115],["bolt.io",115],["boomsupersonic.com",115],["bradfieldcs.com",115],["brightthemag.com",115],["broadcast.listennotes.com",115],["checkio.org",115],["citizen428.net",115],["coach.me",115],["codeburst.io",115],["dave-bailey.com",115],["discordapp.com",115],["doist.com",115],["doit-intl.com",115],["dotandline.net",115],["doublepulsar.com",115],["economist.com",115],["electricliterature.com",115],["elidourado.com",115],["esciencecenter.nl",115],["faun.pub",115],["fossa.io",115],["freecodecamp.org",115],["fritz.ai",115],["getadblock.com",115],["levelup.gitconnected.com",115],["greylock.com",115],["headmelted.com",115],["helium.com",115],["howwegettonext.com",115],["iheart.com",115],["injusticetoday.com",115],["insightdatascience.com",115],["iota.org",115],["itnext.io",115],["itsyourturnblog.com",115],["jupyter.org",115],["keepingstock.net",115],["kiwi.com",115],["learngoprogramming.com",115],["learningbyshipping.com",115],["ledwards.com",115],["legalist.com",115],["logrocket.com",115],["mapbox.com",115],["medium.com",115],["melmagazine.com",115],["mondaynote.com",115],["newco.co",115],["news.smugmug.com",115],["nyulocal.com",115],["ofdollarsanddata.com",115],["okmeter.io",115],["open.nytimes.com",115],["javascript.plainenglish.io",115],["postlight.com",115],["proandroiddev.com",115],["prototypr.io",115],["rainway.io",115],["sagefy.org",115],["signalvnoise.com",115],["slack.engineering",115],["slackhq.com",115],["springboard.com",115],["standardnotes.org",115],["startupsventurecapital.com",115],["stoplight.io",115],["tech.buzzfeed.com",115],["theabacus.io",115],["theawl.com",115],["thebigroundtable.com",115],["thebillfold.com",115],["thebolditalic.com",115],["thecontrol.co",115],["theringer.com",115],["thinkprogress.org",115],["thriveglobal.com",115],["timeline.com",115],["towardsdatascience.com",115],["udacity.com",115],["unpatent.co",115],["usejournal.com",115],["uxdesign.cc",115],["uxplanet.org",115],["warisboring.com",115],["wearemel.com",115],["whatahowler.com",115],["x.company",115],["blog.canopas.com",115],["blog.dp6.com.br",115],["blog.angular.io",115],["thetaoist.online",115],["writingcooperative.com",115],["tech.ahrefs.com",115],["hardware.info",116],["tunein.com",117],["skidrowreloaded.com",118],["myanimelist.net",119],["apps.jeurissen.co",120],["librospreuniversitariospdf.blogspot.com",121],["lvturbo.com",121],["sbbrisk.com",121],["sbface.com",121],["sbspeed.com",121],["streamsb.net",121],["camcaps.to",121],["vtplayer.net",121],["weakstream.org",121],["camcaps.io",121],["selfstudyhistory.com",122],["selfstudyanthro.com",122],["android1pro.com",122],["gakki.me",122],["tunegate.me",122],["sertracen.com.pa",122],["pitesti24.ro",122],["samsungtechwin.com",122],["cours-de-droit.net",122],["iptv4best.com",122],["blogvisaodemercado.pt",122],["kapitalis.com",122],["tiempo.hn",122],["winmeen.com",122],["ibps.in",122],["visse.com.br",122],["javsubtitle.co",122],["learninsta.com",122],["licensekeys.org",122],["mediahiburan.my",122],["tipssehatcantik.com",122],["jbjbgame.com",122],["viatasisanatate.com",122],["ziarulargesul.ro",122],["globaldefensecorp.com",122],["gossipnextdoor.com",122],["coffeeapps.ir",122],["media.framu.world",122],["immobiliaremia.com",122],["colegiosconcertados.info",122],["bigdatauni.com",122],["riwyat.com",122],["rukim.id",122],["visefierbinti.ro",122],["theaircurrent.com",122],["ncert-solutions.com",122],["ncertsolutions.guru",122],["nocturnetls.net",122],["clockks.com",122],["ananda-yoga.ro",122],["poolpiscina.com",122],["infodifesa.it",122],["getective.com",122],["flashdumpfiles.com",122],["formatatmak.com",122],["drkrok.com",122],["alphagirlreviews.com",122],["kitchennovel.com",122],["voxvalachorum.ro",122],["cracksone.com",122],["day-hoc.org",122],["onlineonderdelenshop.nl",122],["primicia.com.ve",122],["tech-recipes.com",122],["afrikmag.com",122],["maduras.vip",122],["aprendeinglessila.com",122],["kicknews.today",122],["koalasplayground.com",122],["hellokpop.com",122],["hayatbilgileri.com",122],["moneyexcel.com",122],["placementstore.com",122],["neuroteam-metz.de",122],["codedosa.com",122],["liveyourmaths.com",122],["newspao.gr",122],["ieltsliz.com",122],["programasvirtualespc.net",122],["tempatwisataseru.com",122],["wikiofcelebs.com",122],["jornaljoca.com.br",122],["arcanescans.com",122],["filmzone.com",122],["hiraethtranslation.com",122],["kaystls.site",122],["home.novel-gate.com",122],["plural.jor.br",122],["evreporter.com",122],["sinhasannews.com",122],["viewsofgreece.gr",122],["rozbor-dila.cz",122],["piklodz.pl",122],["secondlifetranslations.com",122],["ferroviando.com.br",122],["counciloflove.com",122],["infokik.com",122],["kulinarnastronamocy.pl",122],["jafekri.com",122],["ezmanga.net",122],["truyenbanquyen.com",122],["bingotingo.com",122],["joysound.com",122],["velicu.eu",122],["anascrie.ro",122],["guidingliterature.com",122],["cabinetexpert.ro",122],["lokercirebon.com",123],["loginhit.com.ng",123],["duolingo.com",124],["sythe.org",125],["tileman.io",127],["dreamsfriend.com",128],["apk1s.com",128],["mercenaryenrollment.com",128],["xossipy.com",128],["8muses.com",129],["gridcoinstats.eu",130],["online2pdf.com",131],["1fichier.com",132],["forum.release-apk.com",133],["elektrikmen.com",134],["th-world.com",135],["hotcleaner.com",136],["cssreference.io",137],["hitproversion.com",138],["techsini.com",138],["operatorsekolahdbn.com",138],["themosvagas.com.br",138],["appd.at",138],["lazytranslations.com",139],["faloo.com",140],["janvissersweer.nl",141],["spanishdict.com",142],["bwitter.me",143],["outlook.live.com",144],["naaree.com",145],["nusantararom.org",146],["mail.tm",147],["web.skype.com",148],["lightnovelpub.com",149],["streamservicehd.click",150],["eplayer.click",150],["olacast.live",150],["kooora4lives.net",[150,154]],["kooora4livs.com",[150,154]],["allcryptoz.net",151],["crewbase.net",151],["crewus.net",151],["shinbhu.net",151],["shinchu.net",151],["thumb8.net",151],["thumb9.net",151],["topcryptoz.net",151],["uniqueten.net",151],["ultraten.net",151],["tarnkappe.info",152],["airbnb.de",153],["safirsoft.com",155],["surreyhillsgrocer.sg",156],["mgsm.pl",157],["entra.news",158],["microsoftsecurityinsights.com",158],["substack.com",158],["ntuplay.xyz",159],["adslink.pw",160],["jpopsingles.eu",160],["phimlongtieng.net",161],["hket.com",162],["shortform.com",163],["verfutebol.net",164],["financasdeouro.com",164],["webnovel.com",165],["canalnatelinhaonline.blogspot.com",166],["snbc13.com",167],["embed.reddit.com",168],["jpost.com",169],["9now.com.au",170],["teamkong.tk",171],["embibe.com",172],["animesaga.in",173],["seriesperu.com",174],["playertv.net",175],["warungkomik.com",176],["themeslide.com",176],["gdrivedescarga.com",177],["appimagehub.com",178],["gnome-look.org",178],["store.kde.org",178],["linux-apps.com",178],["opendesktop.org",178],["pling.com",178],["xfce-look.org",178],["expquebec.com",179],["photopea.com",180],["marinetraffic.com",181],["streambuddy.net",182],["ncrtsolutions.in",183],["studiestoday.com",184],["teachoo.com",185],["pendulumedu.com",186],["ipphone-warehouse.com",187],["techcrunch-com.translate.goog",188],["crunchyroll.com",189],["mskmangaz.blogspot.com",190],["myntra.com",191],["esscctv.com",192],["karistudio.com",193]]);

const entitiesMap = new Map([["fmovies",122],["extreme-down",126],["vidmoly",173]]);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
