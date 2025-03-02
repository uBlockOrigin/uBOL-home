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

/* eslint-disable indent */

// ruleset: annoyances-cookies

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_trustedClickElement = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [["form[action] button[jsname=\"tWT92d\"]"],["[action=\"https://consent.youtube.com/save\"][style=\"display:inline;\"] [name=\"set_eom\"][value=\"true\"] ~ .basebuttonUIModernization[value][aria-label]"],["[aria-labelledby=\"manage_cookies_title\"] [aria-hidden=\"true\"]:has(> [aria-disabled=\"true\"][role=\"button\"]) + [aria-label][role=\"button\"][tabindex=\"0\"]","","1000"],["button._a9_1","","1000"],["[title=\"Manage Cookies\"]"],["[title=\"Reject All\"]","","1000"],["button.sp_choice_type_11"],["button[aria-label=\"Accept All\"]","","1000"],[".sp_choice_type_12[title=\"Options\"]"],["[title=\"REJECT ALL\"]","","500"],[".sp_choice_type_12[title=\"OPTIONS\"]"],["[title=\"Reject All\"]","","500"],["button[title=\"READ FOR FREE\"]","","1000"],[".terms-conditions button.transfer__button"],[".fides-consent-wall .fides-banner-button-group > button.fides-reject-all-button"],["button[title^=\"Consent\"]"],["button[title^=\"Einwilligen\"]"],["button.fides-reject-all-button","","500"],["button.reject-all"],[".cmp__dialog-footer-buttons > .is-secondary"],["button[onclick=\"IMOK()\"]","","500"],["a.btn--primary"],[".message-container.global-font button.message-button.no-children.focusable.button-font.sp_choice_type_12[title=\"MORE OPTIONS\""],["[data-choice=\"1683026410215\"]","","500"],["button[aria-label=\"close button\"]","","1000"],["button[class=\"w_eEg0 w_OoNT w_w8Y1\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]"],["button.sp_choice_type_12[title$=\"Settings\"]","","500"],["button[title=\"REJECT ALL\"]","","1000"],["button.iubenda-cs-customize-btn, button.iub-cmp-reject-btn, button#iubFooterBtn","","1000"],[".accept[onclick=\"cmpConsentWall.acceptAllCookies()\"]","","1000"],[".sp_choice_type_12[title=\"Manage Cookies\"]"],[".sp_choice_type_REJECT_ALL","","500"],["button[title=\"Accept Cookies\"]","","1000"],["a.cc-dismiss","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000"],["button.denyAll","","1000"],["button[title^=\"Continuer sans accepter\"]"],["button[data-tracking-name=\"cookie-preferences-mloi-initial-opt-out\"]"],["button[kind=\"secondary\"][data-test=\"cookie-necessary-button\"]","","1000"],["button[data-cookiebanner=\"accept_only_essential_button\"]","","1000"],["button.cassie-reject-all","","1000"],["#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll"],["button.alma-cmp-button[title=\"Hyväksy\"]"],[".sanoma-logo-container ~ .message-component.sticky-buttons button.sp_choice_type_12[title=\"Asetukset\"]"],[".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack[title=\"Sanoman sisällönjakelukumppanit\"] button.pm-switch[aria-checked=\"false\"]"],[".sanoma-logo-container ~ .message-component button.sp_choice_type_SAVE_AND_EXIT[title=\"Tallenna\"]","","1500"],["button[id=\"rejectAll\"]","","1000"],["#onetrust-accept-btn-handler","","1000"],["button[title=\"Accept and continue\"]"],["button[title=\"Accept All Cookies\"]"],[".accept-all"],["#CybotCookiebotDialogBodyButtonAccept"],["[data-paywall-notifier=\"consent-agreetoall\"]","","1000"],["ytd-button-renderer.ytd-consent-bump-v2-lightbox + ytd-button-renderer.ytd-consent-bump-v2-lightbox button[style][aria-label][title]","","1000"],["kpcf-cookie-toestemming >>> button[class=\"ohgs-button-primary-green\"]","","1000"],[".privacy-cp-wall #privacy-cp-wall-accept"],["button[aria-label=\"Continua senza accettare\"]"],["label[class=\"input-choice__label\"][for=\"CookiePurposes_1_\"], label[class=\"input-choice__label\"][for=\"CookiePurposes_2_\"], button.js-save[type=\"submit\"]"],["[aria-label=\"REJECT ALL\"]","","500"],["[href=\"/x-set-cookie/\"]"],["#dialogButton1"],["#overlay > div > #banner:has([href*=\"privacyprefs/\"]) music-button:last-of-type"],[".call"],["#cl-consent button[data-role=\"b_decline\"]"],["#privacy-cp-wall-accept"],["button.js-cookie-accept-all","","2000"],["button[data-label=\"accept-button\"]","","1000"],["#cmp-btn-accept","!cookie:/^gpt_ppid[^=]+=/","5000"],["button#pt-accept-all"],["[for=\"checkbox_niezbedne\"], [for=\"checkbox_spolecznosciowe\"], .btn-primary"],["[aria-labelledby=\"banner-title\"] > div[class^=\"buttons_\"] > button[class*=\"secondaryButton_\"] + button"],["#cmpwrapper >>> #cmpbntyestxt","","1000"],["#cmpwrapper >>> .cmptxt_btn_no","","1000"],["#cmpwrapper >>> .cmptxt_btn_save","","1000"],[".iubenda-cs-customize-btn, #iubFooterBtn"],[".privacy-popup > div > button","","2000"],["#pubtech-cmp #pt-close"],[".didomi-continue-without-agreeing","","1000"],["#ccAcceptOnlyFunctional","","4000"],["button.optoutmulti_button","","2000"],["button[title=\"Accepter\"]"],[".btns-container > button[title=\"Tilpass cookies\"]"],[".message-row > button[title=\"Avvis alle\"]","","2000"],["button[data-gdpr-expression=\"acceptAll\"]"],["button[title=\"Accept all\"i]"],["span.as-oil__close-banner"],["button[data-cy=\"cookie-banner-necessary\"]"],["h2 ~ div[class^=\"_\"] > div[class^=\"_\"] > a[rel=\"noopener noreferrer\"][target=\"_self\"][class^=\"_\"]:only-child"],[".cky-btn-accept"],["button[aria-label=\"Agree\"]"],["button[onclick=\"Didomi.setUserAgreeToAll();\"]","","1000"],["button[title^=\"Alle akzeptieren\"]"],["button[aria-label=\"Alle akzeptieren\"]"],["button[data-label=\"Weigeren\"]","","500"],["button.decline-all","","1000"],["button[aria-label=\"I Accept\"]","","1000"],[".button--necessary-approve","","2000"],[".button--necessary-approve","","4000"],["button.agree-btn","","2000"],[".ReactModal__Overlay button[class*=\"terms-modal_done__\"]"],["button.cookie-consent__accept-button","","2000"],["button[id=\"ue-accept-notice-button\"]","","2000"],["#usercentrics-root >>> button[data-testid=\"uc-deny-all-button\"]","","1000"],["#usercentrics-root >>> button[data-testid=\"uc-accept-all-button\"]","","1000"],["[data-testid=\"cookie-policy-banner-accept\"]","","500"],["button.accept-all","1000"],[".szn-cmp-dialog-container >>> button[data-testid=\"cw-button-agree-with-ads\"]","","2000"],["button[id=\"ue-accept-notice-button\"]","","1000"],[".as-oil__close-banner","","1000"],["button[title=\"Einverstanden\"]","","1000"],["button.iubenda-cs-accept-btn","","1000"],["button.iubenda-cs-close-btn"],["button[title=\"Akzeptieren und weiter\"]","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"secondary\"]"],["[class^=\"qc-cmp2-buttons\"] > [data-tmdatatrack=\"privacy-other-save\"]","","1000"],["button[mode=\"primary\"][data-tmdatatrack=\"privacy-cookie\"]","","1000"],["button[class*=\"cipa-accept-btn\"]","","1000"],["a[href=\"javascript:Didomi.setUserAgreeToAll();\"]","","1000"],["#didomi-notice-agree-button","","1000"],["#onetrust-pc-btn-handler"],[".save-preference-btn-handler","","1000"],["button[data-testid=\"granular-banner-button-decline-all\"]","","1000"],["button[aria-label*=\"Aceptar\"]","","1000"],["button[title*=\"Accept\"]","","1000"],["button[title*=\"AGREE\"]","","1000"],["button[title=\"Alles akzeptieren\"]","","1000"],["button[title=\"Godkänn alla cookies\"]","","1000"],["button[title=\"ALLE AKZEPTIEREN\"]","","1000"],["button[title=\"Reject all\"]","","1000"],["button[title=\"I Agree\"]","","1000"],["button[title=\"AKZEPTIEREN UND WEITER\"]","","1000"],["button[title=\"Hyväksy kaikki\"]","","1000"],["button[title=\"TILLAD NØDVENDIGE\"]","","1000"],["button[title=\"Accept All & Close\"]","","1000"],["#CybotCookiebotDialogBodyButtonDecline","","1000"],["button#consent_wall_optin"],["span#cmpbntyestxt","","1000"],["button[title=\"Akzeptieren\"]","","1000"],["button#btn-gdpr-accept"],["a[href][onclick=\"ov.cmp.acceptAllConsents()\"]","","1000"],["button.fc-primary-button","","1000"],["button[data-id=\"save-all-pur\"]","","1000"],["button.button__acceptAll"],["button.button__skip"],["button.accept-button"],["custom-button[id=\"consentAccept\"]","","1000"],["button[mode=\"primary\"]"],["a.cmptxt_btn_no","","1000"],["button[data-test=\"pwa-consent-layer-save-settings\"]","","1000]"],["[target=\"_self\"][type=\"button\"][class=\"_3kalix4\"]","","1000"],["button[type=\"button\"][class=\"_button_15feu_3\"]","","1000"],["[target=\"_self\"][type=\"button\"][class=\"_10qqh8uq\"]","","1000"],["button[data-reject-all]","","1000"],["button[title=\"Einwilligen und weiter\"]","","1000"],["button[title=\"Dismiss\"]"],["button.refuseAll","","1000"],["button[data-cc-action=\"accept\"]","","1000"],["button[id=\"teal-consent-prompt-submit\"]","","1000"],["button[id=\"consent_prompt_submit\"]","","1000"],["button[name=\"accept\"]","","1000"],["button[id=\"consent_prompt_decline\"]","","1000"],["button[data-tpl-type=\"Button\"]","","1000"],["button[data-tracking-name=\"cookie-preferences-sloo-opt-out\"]","","1000"],["button[title=\"ACCEPT\"]"],["button[title=\"SAVE AND EXIT\"]"],["button[id=\"explicit-consent-prompt-reject\"]","","1000"],["button[data-purpose=\"cookieBar.button.accept\"]","","1000"],["button[data-testid=\"uc-button-accept-and-close\"]","","1000"],["[data-testid=\"submit-login-button\"].decline-consent","","1000"],["button[type=\"submit\"].btn-deny","","1000"],["a.cmptxt_btn_yes"],["button[data-action=\"adverts#accept\"]","","1000"],[".cmp-accept","","2500"],["[data-testid=\"consent-necessary\"]"],["button[id=\"onetrust-reject-all-handler\"]","","1000"],["button.onetrust-close-btn-handler","","1000"],["div[class=\"t_cm_ec_reject_button\"]","","1000"],["button[aria-label=\"نعم انا موافق\"]"],["button[title=\"Agree\"]","","1000"],["button[aria-label=\"Close\"]","","1000"],["button.sc-9a9fe76b-0.jgpQHZ","","1000"],["button[data-auto-id=\"glass-gdpr-default-consent-reject-button\"]","","1000"],["button[aria-label=\"Prijať všetko\"]"],["a.cc-btn.cc-allow","","1000"],[".qc-cmp2-summary-buttons > button[mode=\"primary\"]","","2000"],["button[class*=\"cipa-accept-btn\"]","","2000"],["button[data-js=\"cookieConsentReject\"]","","1000"],["button[title*=\"Jetzt zustimmen\"]","","1000"],["a[id=\"consent_prompt_decline\"]","","1000"],["button[id=\"cm-acceptNone\"]","","1000"],["button.brlbs-btn-accept-only-essential","","1000"],["button[id=\"didomi-notice-disagree-button\"]","","1000"],["button.cookie-notice__button--dismiss","","1000"],["button[data-testid=\"cookies-politics-reject-button--button\"]","","1000"],["cds-button[id=\"cookie-allow-necessary-et\"]","","1000"],["button[title*=\"Zustimmen\" i]","","1000"],["button[title=\"Ich bin einverstanden\"]","","","1000"],["button[id=\"userSelectAll\"]","","1000"],["button[title=\"Consent and continue\"]","","1000"],["button[title=\"Accept all\"]","","1000"],["button[title=\"Save & Exit\"]","","1000"],["button[title=\"Akzeptieren & Schließen\"]","","1000"],["button.button-reject","","1000"],["button[data-cookiefirst-action=\"accept\"]","","1000"],["button[data-cookiefirst-action=\"reject\"]","","1000"],["button.mde-consent-accept-btn","","1600"],[".gdpr-modal .gdpr-btn--secondary, .gdpr-modal .gdpr-modal__box-bottom-dx > button.gdpr-btn--br:first-child"],["button#consent_prompt_decline","","1000"],["button[id=\"save-all-pur\"]","","1000"],["button[id=\"save-all-conditionally\"]","","1000"],["a[onclick=\"AcceptAllCookies(true); \"]","","1000"],["button[title=\"Akzeptieren & Weiter\"]","","1000"],["button#ensRejectAll","","1500"],["a.js-cookie-popup","","650"],["button.button_default","","800"],["button.CybotCookiebotDialogBodyButton","","1000"],["a#CybotCookiebotDialogBodyButtonAcceptAll","","1000"],["button[title=\"Kun nødvendige\"]","","1000"],["button[title=\"Accept\"]","","1000"],["button.js-decline-all-cookies","","1000"],["button.cookieselection-confirm-selection","","1000"],["button#btn-reject-all","","1000"],["button[data-consent-trigger=\"1\"]","","1000"],["button#cookiebotDialogOkButton","","1000"],["button.reject-btn","","1000"],["button.accept-btn","","1000"],["button.js-deny","","1500"],["a.jliqhtlu__close","","1000"],["a.cookie-consent--reject-button","","1000"],["button[title=\"Alle Cookies akzeptieren\"]","","1000"],["button[data-test-id=\"customer-necessary-consents-button\"]","","1000"],["button.ui-cookie-consent__decline-button","","1000"],["button.cookies-modal-warning-reject-button","","1000"],["button[data-type=\"nothing\"]","","1000"],["button.cm-btn-accept","","1000"],["button[data-dismiss=\"modal\"]","","1000"],["button#js-agree-cookies-button","","1000"],["button[data-testid=\"cookie-popup-reject\"]","","1000"],["button#truste-consent-required","","1000"],["button[data-testid=\"button-core-component-Avslå\"]","","1000"],["epaas-consent-drawer-shell >>> button.reject-button","","1000"],["button.ot-bnr-save-handler","","1000"],["button#button-accept-necessary","","1500"],["button[data-cookie-layer-accept=\"selected\"]","","1000"],[".open > ng-transclude > footer > button.accept-selected-btn","","1000"],[".open_modal .modal-dialog .modal-content form .modal-header button[name=\"refuse_all\"]","","1000"],["div.button_cookies[onclick=\"RefuseCookie()\"]"],["button[onclick=\"SelectNone()\"]","","1000"],["button[data-tracking-element-id=\"cookie_banner_essential_only\"]","","1600"],["button[name=\"decline_cookie\"]","","1000"],["button.cmpt_customer--cookie--banner--continue","","1000"],["button.cookiesgdpr__rejectbtn","","1000"],["button[onclick=\"confirmAll('theme-showcase')\"]","","1000"],["button.oax-cookie-consent-select-necessary","","1000"],["button#cookieModuleRejectAll","","1000"],["button.js-cookie-accept-all","","1000"],["label[for=\"ok\"]","","500"],["button.payok__submit","","750"],["button.btn-outline-secondary","","1000"],["button#footer_tc_privacy_button_2","","1000"],["input[name=\"pill-toggle-external-media\"]","","500"],["button.p-layer__button--selection","","750"],["button[data-analytics-cms-event-name=\"cookies.button.alleen-noodzakelijk\"]","","2600"],["button[aria-label=\"Vypnúť personalizáciu\"]","","1000"],[".cookie-text > .large-btn","","1000"],["button#zenEPrivacy_acceptAllBtn","","1000"],["button[title=\"OK\"]","","1000"],[".l-cookies-notice .btn-wrapper button[data-name=\"accept-all-cookies\"]","","1000"],["button.btn-accept-necessary","","1000"],["button#popin_tc_privacy_button","","1000"],["button#cb-RejectAll","","1000"],["button#DenyAll","","1000"],["button[name=\"decline-all\"]","","1000"],["button#saveCookieSelection","","1000"],["input.cookieacceptall","","1000"],["button[data-role=\"necessary\"]","","1000"],["input[value=\"Acceptér valgte\"]","","1000"],["button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],["cookie-consent-element >>> button[aria-label=\"Accepter kun de nødvendige cookies\"]","","1000"],[".dmc-accept-all","","1000"],["button#hs-eu-decline-button","","1000"],["button[onclick=\"wsSetAcceptedCookies(this);\"]","","1000"],["button[data-tid=\"banner-accept\"]","","1000"],["div#cookiescript_accept","","1000"],["button#popin-cookies-btn-refuse","","1000"],["button.AP_mdf-accept","","1500"],["button#cm-btnRejectAll","","1000"],["button[data-cy=\"iUnderstand\"]","","1000"],["button[data-cookiebanner=\"accept_button\"]","","1000"],["button.cky-btn-reject","","1000"],["button#consentDisagreeButton","","1000"],[".logoContainer > .modalBtnAccept","","1000"],["button.js-cookie-banner-decline-all","","1000"],["div#consent_prompt_decline_submit","","1000"],["button.js-acceptNecessaryCookies","","1000"],[".show.modal .modal-dialog .modal-content .modal-footer a.s-cookie-transparency__link-reject-all","","1000"],["button#UCButtonSettings","500"],["button#CybotCookiebotDialogBodyLevelButtonAccept","750"],["button[name=\"rejectAll\"]","","1000"],["button.env-button--primary","","1000"],["div#consent_prompt_reject","","1000"],["button#js-ssmp-clrButtonLabel","","1000"],[".modal.in .modal-dialog .modal-content .modal-footer button#saveGDPR","","2000"],["button#btnAcceptAllCookies","","1000"],["button[class=\"amgdprcookie-button -decline\"]","","3000"],["button[data-t=\"continueWithoutAccepting\"]","","1000"],["button.si-cookie-notice__button--reject","","1000"],["button.btn--white.l-border.cookie-notice__btn","","1000"],["a#bstCookieAlertBtnNecessary","","1000"],["button.save.btn-form.btn-inverted","","1000"],["button.manage-cookies","","500"],["button.save.primary-button","","750"],["button.ch2-deny-all-btn","","1500"],["button[data-testid=\"cookie-modal-actions-decline\"]","","1000"],["span.cookies_rechazo","","1000"],["button.ui-button-secondary.ui-button-secondary-wide","","500"],["button.ui-button-primary-wide.ui-button-text-only","","750"],["button#shopify-pc__banner__btn-decline","","1000"],["button.consent-info-cta.more","","500"],["button.consent-console-save.ko","","750"],["button[data-testid=\"reject-all-cookies-button\"]","","1000"],["button#show-settings-button","","500"],["button#save-settings-button","","750"],["button[title=\"Jag godkänner\"]","","1000"],["label[title=\"Externe Medien\"]","","1000"],["button.save-cookie-settings","","1200"],["button#gdpr-btn-refuse-all","","1000"],["a[aria-label=\"Continue without accepting\"]","","1000"],["button#tarteaucitronAllDenied2","","1000"],["button.ccm--decline-cookies","","1000"],["button#c-s-bn","","1000"],["button.cm-btn-success","","1000"],["a.p-cookie-layer__accept-selected-cookies-button[nb-cmp=\"button\"]","","1500"],["a.cc-btn-decline","","1000"],["a.disable-cookies","","1000"],["button[aria-label=\"Accept all\"]","","1000"],["button#ManageCookiesButton","","500"],["button#SaveCookiePreferencesButton","","750"],["button[type=\"submit\"].btn--cookie-consent","","1000"],["button.btn_cookie_savesettings","","500"],["button.btn_cookie_savesettings","","750"],["a[data-cookies-action=\"accept\"]","","1000"],["button.xlt-modalCookiesBtnAllowNecessary","","1000"],["button[data-closecause=\"close-by-submit\"]","","1000"],["span[data-qa-selector=\"gdpr-banner-configuration-button\"]","","300"],["span[data-qa-selector=\"gdpr-banner-accept-selected-button\"]","","500"],["button[data-cookies=\"disallow_all_cookies\"]","","1000"],["button#CookieBoxSaveButton","","1000"],["button#acceptNecessaryCookiesBtn","","1000"],["a.cc-deny","","1000"],["button[aria-label=\"Accept selected cookies\"]","","1000"],["button.orejime-Modal-saveButton","","1000"],["a[data-tst=\"reject-additional\"]","","1000"],["button.cookie-select-mandatory","","1000"],["a#obcookies_box_close","","1000"],["a[data-button-action=\"essential\"]","","1000"],["button[data-test=\"cookiesAcceptMandatoryButton\"]","","1000"],["button[data-test=\"button-customize\"]","","500"],["button[data-test=\"button-save\"]","","750"],["button.cc-decline","","1000"],["div.approve.button","","1000"],["button[onclick=\"CookieConsent.apply(['ESSENTIAL'])\"]","","1000"],["label[for=\"privacy_pref_optout\"]","","800"],["div#consent_prompt_submit","","1000"],["button.dp_accept","","1000"],["button.cookiebanner__buttons__deny","","1000"],["button.button-refuse","","1000"],["a[onclick=\"cmp_pv.cookie.saveConsent('onlyLI');\"]","","1000"],["button[title=\"Hyväksy\"]","","1000"],["button[title=\"Pokračovať s nevyhnutnými cookies →\"]","","1000"],["button[name=\"saveCookiesPlusPreferences\"]","","1000"],["div[onclick=\"javascript:ns_gdpr();\"]","","1000"],["button.cookies-banner__button","","1000"],["div#close_button.btn","","1000"],["pie-cookie-banner >>> pie-button[data-test-id=\"actions-necessary-only\"]","","1000"],["button#cmCloseBanner","","1000"],["button#popin_tc_privacy_button_2","","1000"],["button#popin_tc_privacy_button_3","","1000"],["span[aria-label=\"dismiss cookie message\"]","","1000"],["button[aria-label=\"Rechazar todas las cookies\"]","","1000"],["a[aria-label=\"settings cookies\"]","","600"],["a[onclick=\"Pandectes.fn.savePreferences()\"]","","750"],["a[aria-label=\"allow cookies\"]","","1000"],["div.privacy-more-information","","600"],["div#preferences_prompt_submit","","750"],["a#CookieBoxSaveButton","","1000"],["span[data-content=\"WEIGEREN\"]","","1000"],[".is-open .o-cookie__overlay .o-cookie__container .o-cookie__actions .is-space-between button[data-action=\"save\"]","","1000"],["a[onclick=\"consentLayer.buttonAcceptMandatory();\"]","","1000"],["button[id=\"confirmSelection\"]","","2000"],["button[data-action=\"disallow-all\"]","","1000"],["div#cookiescript_reject","","1000"],["button#acceptPrivacyPolicy","","1000"],["button#consent_prompt_reject","","1000"],["dock-privacy-settings >>> bbg-button#decline-all-modal-dialog","","1000"],["button.js-deny","","1000"],["a[role=\"button\"][data-cookie-individual]","","3200"],["a[role=\"button\"][data-cookie-accept]","","3500"],["button[title=\"Deny all cookies\"]","","1000"],["button#cookieconsent-banner-accept-necessary-button","","1000"],["div[data-vtest=\"reject-all\"]","","1000"],["button#consentRefuseAllCookies","","1000"],["button.cookie-consent__button--decline","","1000"],["button#saveChoice","","1000"],["button#refuseCookiesBtn","","1000"],["button.p-button.p-privacy-settings__accept-selected-button","","2500"],["button.cookies-ko","","1000"],["button.reject","","1000"],["button.ot-btn-deny","","1000"],["button.js-ot-deny","","1000"],["button.cn-decline","","1000"],["button#js-gateaux-secs-deny","","1500"],["button[data-cookie-consent-accept-necessary-btn]","","1000"],["button.qa-cookie-consent-accept-required","","1500"],[".cvcm-cookie-consent-settings-basic__learn-more-button","","600"],[".cvcm-cookie-consent-settings-detail__footer-button","","750"],["button.accept-all"],[".btn-primary"],["div.tvp-covl__ab","","1000"],["span.decline","","1500"],["a.-confirm-selection","","1000"],["button[data-role=\"reject-rodo\"]","","2500"],["button#moreSettings","","600"],["button#saveSettings","","750"],["button#modalSettingBtn","","1500"],["button#allRejectBtn","","1750"],["button[data-stellar=\"Secondary-button\"]","","1500"],["span.ucm-popin-close-text","","1000"],["a.cookie-essentials","","1800"],["button.Avada-CookiesBar_BtnDeny","","1000"],["button#ez-accept-all","","1000"],["a.cookie__close_text","","1000"],["button[class=\"consent-button agree-necessary-cookie\"]","","1000"],["button#accept-all-gdpr","","1000"],["a#eu-cookie-details-anzeigen-b","","600"],["button.consentManagerButton__NQM","","750"],["span.gtm-cookies-close","","1000"],["button[data-accept-cookie=\"true\"]","","2000"],["button#consent_config","","600"],["button#consent_saveConfig","","750"],["button#declineButton","","1000"],["button.cookies-overlay-dialog__save-btn","","1000"],["button.iubenda-cs-reject-btn","1000"],["span.macaronbtn.refuse","","1000"],["a.fs-cc-banner_button-2","","1000"],["a.reject--cookies","","1000"],["button[aria-label=\"LET ME CHOOSE\"]","","2000"],["button[aria-label=\"Save My Preferences\"]","","2300"],[".dsgvo-cookie-modal .content .dsgvo-cookie .cookie-permission--content .dsgvo-cookie--consent-manager .cookie-removal--inline-manager .cookie-consent--save .cookie-consent--save-button","","1000"],["div[data-test-id=\"CookieConsentsBanner.Root\"] button[data-test-id=\"decline-button\"]","","1000"],["#pg-host-shadow-root >>> button#pg-configure-btn, #pg-host-shadow-root >>> #purpose-row-SOCIAL_MEDIA input[type=\"checkbox\"], #pg-host-shadow-root >>> button#pg-save-preferences-btn"],["button.cc-button--rejectAll","","","1000"],["a.eu-cookie-compliance-rocketship--accept-minimal.button","","1000"],["button[class=\"cookie-disclaimer__button-save | button\"]","","1000"],["button[class=\"cookie-disclaimer__button | button button--secondary\"]","","1000"],["button#tarteaucitronDenyAll","","1000"],["button#footer_tc_privacy_button_3","","1000"],["button#saveCookies","","1800"],["button[aria-label=\"dismiss cookie message\"]","","1000"],["div#cookiescript_button_continue_text","","1000"],["div.modal-close","","1000"],["button#wi-CookieConsent_Selection","","1000"],["button#c-t-bn","","1000"],["button#CookieInfoDialogDecline","","1000"],["button[aria-label=\"vypnout personalizaci\"]","","1800"],["button#cookie-donottrack","","1000"],["div.agree-mandatory","","1000"],["button[data-cookiefirst-action=\"adjust\"]","","600"],["button[data-cookiefirst-action=\"save\"]","","750"],["a[data-ga-action=\"disallow_all_cookies\"]","","1000"],["span.sd-cmp-2jmDj","","1000"],["div.rgpdRefuse","","1000"],["button.modal-cookie-consent-btn-reject","","1000"],["button#myModalCookieConsentBtnContinueWithoutAccepting","","1000"],["button.cookiesBtn__link","","1000"],["button[data-action=\"basic-cookie\"]","","1000"],["button.CookieModal--reject-all","","1000"],["button.consent_agree_essential","","1000"],["span[data-cookieaccept=\"current\"]","","1000"],["button.tarteaucitronDeny","","1000"],["button[data-cookie_version=\"true3\"]","","1000"],["a#DeclineAll","","1000"],["div.new-cookies__btn","","1000"],["button.button-tertiary","","600"],["button[class=\"focus:text-gray-500\"]","","1000"],[".cookie-overlay[style] .cookie-consent .cookie-button-group .cookie-buttons #cookie-deny","","1000"],["button#show-settings-button","","650"],["button#save-settings-button","","800"],["div.cookie-reject","","1000"],["li#sdgdpr_modal_buttons-decline","","1000"],["div#cookieCloseIcon","","1000"],["button#cookieAccepted","","1000"],["button#cookieAccept","","1000"],["div.show-more-options","","500"],["div.save-options","","650"],["button#btn-accept-required-banner","","1000"],["button#elc-decline-all-link","","1000"],["button[title=\"القبول والمتابعة\"]","","1800"],["mon-cb-main >>> mon-cb-home >>> mon-cb-button[e2e-tag=\"acceptAllCookiesButton\"]","","1000"],["button#gdpr_consent_accept_essential_btn","","1000"],["button.essentialCat-button","","3600"],["button#denyallcookie-btn","","1000"],["button#cookie-accept","","1800"],["button[title=\"Close cookie notice without specifying preferences\"]","","1000"],["button[title=\"Adjust cookie preferences\"]","","500"],["button[title=\"Deny all cookies\"]","","650"],["button[data-role=\"reject-rodo\"]","","1500"],["button#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll","","1000"],["button[aria-label=\"Rechazar\"]","","1000"],["a[data-vtest=\"reject-all\"]","","1000"],["a.js-cookies-info-reject","","1000"],["button[title=\"Got it\"]","","1000"],["button#gr-btn-agree","","1000"],["span.cookie-overlay__modal__footer__decline","","1000"],["button[title=\"Continue without accepting\"]","","1000"],["button[onclick=\"setCOOKIENOTIFYOK()\"]","","1000"],["button#s-rall-bn","","1000"],["button#privacy_pref_optout","","1000"],["#cookiescript_reject","","500"],["button[title=\"Essential cookies only\"]","","1000"],["#redesignCmpWrapper > div > div > a[href^=\"https://cadenaser.com/\"]"],["#cookietoggle, input[id=\"CookieFunctional\"], [value=\"Hyväksy vain valitut\"]"],["button.tm-button.secondary-invert","","1000"]];

const hostnamesMap = new Map([["consent.youtube.com",[0,1]],["facebook.com",2],["instagram.com",3],["sourcepointcmp.bloomberg.com",[4,5,6]],["sourcepointcmp.bloomberg.co.jp",[4,5,6]],["giga.de",6],["bloomberg.com",7],["forbes.com",[7,71]],["nike.com",7],["consent.fastcar.co.uk",7],["cmpv2.standard.co.uk",[8,9]],["cmpv2.independent.co.uk",[10,11,12]],["wetransfer.com",[13,14]],["spiegel.de",[15,16]],["nytimes.com",[17,162]],["consent.yahoo.com",18],["tumblr.com",19],["fplstatistics.co.uk",20],["e-shop.leonidas.com",21],["cdn.privacy-mgmt.com",[22,23,43,44,45,46,85,90,92,99,106,113,123,124,125,128,130,131,138,155,178,188,196,197,200,201,202,267,369,498,512]],["walmart.ca",24],["sams.com.mx",25],["cambio-carsharing.de",26],["festoolcanada.com",26],["tracker.fressnapf.de",26],["s-pankki.fi",26],["dr-beckmann.com",26],["consent.ladbible.com",[27,28]],["consent.unilad.com",[27,28]],["consent.uniladtech.com",[27,28]],["consent.gamingbible.com",[27,28]],["consent.sportbible.com",[27,28]],["consent.tyla.com",[27,28]],["consent.ladbiblegroup.com",[27,28]],["m2o.it",29],["deejay.it",29],["capital.it",29],["ilmattino.it",[29,30]],["leggo.it",[29,30]],["libero.it",29],["tiscali.it",29],["consent-manager.ft.com",[31,32,33]],["mediaworld.it",35],["mediamarktsaturn.com",36],["tf1info.fr",37],["uber.com",[38,163]],["ubereats.com",[38,163]],["lego.com",39],["ai.meta.com",40],["lilly.com",41],["cosmo-hairshop.de",42],["storyhouseegmont.no",42],["telekom.com",47],["telekom.net",47],["telekom.de",47],["abola.pt",48],["ansons.de",48],["blick.ch",48],["buienradar.be",48],["digi24.ro",48],["digisport.ro",48],["digitalfoundry.net",48],["egx.net",48],["eurogamer.it",48],["mail.com",48],["mcmcomiccon.com",48],["nachrichten.at",48],["nintendolife.com",48],["oe24.at",48],["paxsite.com",48],["peacocktv.com",48],["player.pl",48],["pricerunner.com",48],["pricerunner.se",48],["pricerunner.dk",48],["proximus.be",48],["proximus.com",48],["purexbox.com",48],["pushsquare.com",48],["rugbypass.com",48],["southparkstudios.com",48],["starwarscelebration.com",48],["sweatybetty.com",48],["thehaul.com",48],["timeextension.com",48],["travelandleisure.com",48],["tunein.com",48],["videoland.com",48],["wizzair.com",48],["wetter.at",48],["dicebreaker.com",[49,50]],["eurogamer.cz",[49,50]],["eurogamer.es",[49,50]],["eurogamer.net",[49,50]],["eurogamer.nl",[49,50]],["eurogamer.pl",[49,50]],["eurogamer.pt",[49,50]],["gamesindustry.biz",[49,50]],["jelly.deals",[49,50]],["reedpop.com",[49,50]],["rockpapershotgun.com",[49,50]],["thepopverse.com",[49,50]],["vg247.com",[49,50]],["videogameschronicle.com",[49,50]],["eurogamer.de",51],["roadtovr.com",52],["mundodeportivo.com",[53,119]],["m.youtube.com",54],["www.youtube.com",54],["ohra.nl",55],["corriere.it",56],["gazzetta.it",56],["oggi.it",56],["cmp.sky.it",57],["tennisassa.fi",58],["formula1.com",59],["f1racing.pl",60],["consent-pref.trustarc.com",63],["highlights.legaseriea.it",64],["calciomercato.com",64],["sosfanta.com",65],["wetter.com",68],["youmath.it",69],["pip.gov.pl",70],["bnn.de",72],["dosenbach.ch",72],["dw.com",72],["winfuture.de",72],["lippu.fi",72],["racingnews365.com",72],["reifendirekt.ch",72],["bauhaus.no",73],["beko-group.de",73],["billiger.de",73],["vanharen.nl",73],["deichmann.com",[73,95,389]],["meraluna.de",73],["slashdot.org",73],["hermann-saunierduval.it",73],["protherm.cz",73],["saunierduval.es",73],["protherm.sk",73],["protherm.ua",73],["saunierduval.hu",73],["saunierduval.ro",73],["saunierduval.at",73],["awb.nl",73],["spar.hu",74],["group.vattenfall.com",74],["mediaset.it",75],["fortune.com",76],["ilrestodelcarlino.it",77],["quotidiano.net",77],["lanazione.it",77],["ilgiorno.it",77],["iltelegrafolivorno.it",77],["auto.it",78],["boursobank.com",78],["boursorama.com",78],["canalplus.com",78],["eden-park.com",78],["frandroid.com",78],["hotelsbarriere.com",78],["idealista.it",78],["o2.fr",78],["meteofrance.com",78],["mondialtissus.fr",78],["oscaro.com",78],["publicsenat.fr",78],["rmcbfmplay.com",78],["seloger.com",78],["suzuki.fr",78],["nutri-plus.de",79],["aa.com",80],["consent.capital.fr",81],["consent.voici.fr",81],["programme-tv.net",81],["cmp.e24.no",[82,83]],["cmp.vg.no",[82,83]],["huffingtonpost.fr",84],["rainews.it",86],["remarkable.com",87],["netzwelt.de",88],["money.it",89],["allocine.fr",91],["jeuxvideo.com",91],["cmp-sp.tagesspiegel.de",92],["cmp.bz-berlin.de",92],["cmp.cicero.de",92],["cmp.techbook.de",92],["cmp.stylebook.de",92],["cmp2.bild.de",92],["sourcepoint.wetter.de",92],["consent.finanzen.at",92],["consent.up.welt.de",92],["sourcepoint.n-tv.de",92],["sourcepoint.kochbar.de",92],["sourcepoint.rtl.de",92],["cmp.computerbild.de",92],["cmp.petbook.de",92],["cmp-sp.siegener-zeitung.de",92],["cmp-sp.sportbuzzer.de",92],["klarmobil.de",92],["technikum-wien.at",93],["eneco.nl",94],["blackpoolgazette.co.uk",96],["lep.co.uk",96],["northamptonchron.co.uk",96],["scotsman.com",96],["shieldsgazette.com",96],["thestar.co.uk",96],["portsmouth.co.uk",96],["sunderlandecho.com",96],["northernirelandworld.com",96],["3addedminutes.com",96],["anguscountyworld.co.uk",96],["banburyguardian.co.uk",96],["bedfordtoday.co.uk",96],["biggleswadetoday.co.uk",96],["bucksherald.co.uk",96],["burnleyexpress.net",96],["buxtonadvertiser.co.uk",96],["chad.co.uk",96],["daventryexpress.co.uk",96],["derbyshiretimes.co.uk",96],["derbyworld.co.uk",96],["derryjournal.com",96],["dewsburyreporter.co.uk",96],["doncasterfreepress.co.uk",96],["falkirkherald.co.uk",96],["fifetoday.co.uk",96],["glasgowworld.com",96],["halifaxcourier.co.uk",96],["harboroughmail.co.uk",96],["harrogateadvertiser.co.uk",96],["hartlepoolmail.co.uk",96],["hemeltoday.co.uk",96],["hucknalldispatch.co.uk",96],["lancasterguardian.co.uk",96],["leightonbuzzardonline.co.uk",96],["lincolnshireworld.com",96],["liverpoolworld.uk",96],["londonworld.com",96],["lutontoday.co.uk",96],["manchesterworld.uk",96],["meltontimes.co.uk",96],["miltonkeynes.co.uk",96],["newcastleworld.com",96],["newryreporter.com",96],["newsletter.co.uk",96],["northantstelegraph.co.uk",96],["northumberlandgazette.co.uk",96],["nottinghamworld.com",96],["peterboroughtoday.co.uk",96],["rotherhamadvertiser.co.uk",96],["stornowaygazette.co.uk",96],["surreyworld.co.uk",96],["thescarboroughnews.co.uk",96],["thesouthernreporter.co.uk",96],["totallysnookered.com",96],["wakefieldexpress.co.uk",96],["walesworld.com",96],["warwickshireworld.com",96],["wigantoday.net",96],["worksopguardian.co.uk",96],["yorkshireeveningpost.co.uk",96],["yorkshirepost.co.uk",96],["eurocard.com",97],["saseurobonusmastercard.se",98],["tver.jp",100],["linkedin.com",101],["elmundo.es",102],["srf.ch",103],["alternate.de",103],["bayer04.de",103],["douglas.de",103],["falke.com",103],["flaschenpost.de",103],["gloeckle.de",103],["hornbach.nl",103],["postbank.de",103],["immowelt.de",104],["morenutrition.de",104],["mapillary.com",105],["cmp.seznam.cz",107],["marca.com",108],["raiplay.it",109],["derstandard.at",110],["derstandard.de",110],["faz.net",110],["ansa.it",111],["delladio.it",111],["huffingtonpost.it",111],["lastampa.it",111],["movieplayer.it",111],["multiplayer.it",111],["repubblica.it",111],["tomshw.it",111],["tuttoandroid.net",111],["tuttotech.net",111],["ilgazzettino.it",112],["ilmessaggero.it",112],["ilsecoloxix.it",112],["privacy.motorradonline.de",113],["consent.watson.de",113],["consent.kino.de",113],["dailystar.co.uk",[114,115,116,117]],["mirror.co.uk",[114,115,116,117]],["idnes.cz",118],["20minutes.fr",119],["20minutos.es",119],["24sata.hr",119],["abc.es",119],["actu.fr",119],["antena3.com",119],["antena3internacional.com",119],["atresmedia.com",119],["atresmediapublicidad.com",119],["atresmediastudios.com",119],["atresplayer.com",119],["autopista.es",119],["belfasttelegraph.co.uk",119],["bt.se",119],["bonduelle.it",119],["bonniernews.se",119],["caracol.com.co",119],["ciclismoafondo.es",119],["cnews.fr",119],["cope.es",119],["correryfitness.com",119],["decathlon.nl",119],["decathlon.pl",119],["di.se",119],["diariocordoba.com",119],["diepresse.com",119],["dn.se",119],["dnevnik.hr",119],["dumpert.nl",119],["ebuyclub.com",119],["edreams.de",119],["edreams.net",119],["elcomercio.es",119],["elconfidencial.com",119],["eldesmarque.com",119],["elespanol.com",119],["elpais.com",119],["elpais.es",119],["engadget.com",119],["euronews.com",119],["europafm.com",119],["expressen.se",119],["filmstarts.de",119],["flooxernow.com",119],["folkbladet.nu",119],["france.tv",119],["france24.com",119],["fussballtransfers.com",119],["fyndiq.se",119],["ghacks.net",119],["gva.be",119],["hbvl.be",119],["k.at",119],["krone.at",119],["kurier.at",119],["ladepeche.fr",119],["lalibre.be",119],["lasexta.com",119],["lasprovincias.es",119],["ledauphine.com",119],["lejdd.fr",119],["leparisien.fr",119],["lexpress.fr",119],["libremercado.com",119],["lotoquebec.com",119],["okdiario.com",119],["marmiton.org",119],["marianne.cz",119],["melodia-fm.com",119],["moviepilot.de",119],["m6.fr",119],["metronieuws.nl",119],["multilife.com.pl",119],["naszemiasto.pl",119],["nicematin.com",119],["nieuwsblad.be",119],["numerama.com",119],["ondacero.es",119],["profil.at",119],["radiofrance.fr",119],["rankia.com",119],["rfi.fr",119],["rossmann.pl",119],["rtbf.be",119],["rtl.lu",119],["science-et-vie.com",119],["sensacine.com",119],["sfgame.net",119],["shure.com",119],["silicon.es",119],["sncf-connect.com",119],["sport.es",119],["sydsvenskan.se",119],["techcrunch.com",119],["telegraaf.nl",119],["telequebec.tv",119],["trailrun.es",119],["video-streaming.orange.fr",119],["ryobitools.eu",[120,121]],["americanexpress.com",122],["consent.radiotimes.com",125],["sp-consent.szbz.de",126],["cmp.omni.se",127],["cmp.svd.se",127],["cmp.aftonbladet.se",127],["consent.economist.com",129],["cmpv2.foundryco.com",130],["cmpv2.infoworld.com",130],["cmpv2.arnnet.com.au",130],["sp-cdn.pcgames.de",131],["sp-cdn.pcgameshardware.de",131],["consentv2.sport1.de",131],["cmpv2.tori.fi",132],["cdn.privacy-mgmt.co",133],["consent.spielaffe.de",134],["vikingline.com",135],["tfl.gov.uk",135],["drklein.de",135],["1und1.de",136],["infranken.de",137],["cmp.bunte.de",138],["cmp.chip.de",138],["cmp.focus.de",[138,417]],["estadiodeportivo.com",139],["tempo.pt",139],["pogoda.com",139],["yourweather.co.uk",139],["tempo.com",139],["tiempo.com",139],["ilmeteo.net",139],["daswetter.com",139],["kicker.de",140],["formulatv.com",141],["web.de",142],["lefigaro.fr",143],["linternaute.com",144],["consent.caminteresse.fr",145],["volksfreund.de",146],["dailypost.co.uk",147],["the-express.com",147],["tarife.mediamarkt.de",148],["gaggenau.com",148],["saturn.de",149],["eltiempo.es",[150,151]],["otempo.pt",152],["cmp-sp.goettinger-tageblatt.de",154],["cmp-sp.saechsische.de",154],["cmp-sp.ln-online.de",154],["cz.de",154],["dewezet.de",154],["dnn.de",154],["haz.de",154],["gnz.de",154],["landeszeitung.de",154],["lvz.de",154],["maz-online.de",154],["ndz.de",154],["op-marburg.de",154],["ostsee-zeitung.de",154],["paz-online.de",154],["reisereporter.de",154],["rga.de",154],["rnd.de",154],["siegener-zeitung.de",154],["sn-online.de",154],["solinger-tageblatt.de",154],["sportbuzzer.de",154],["szlz.de",154],["tah.de",154],["torgauerzeitung.de",154],["waz-online.de",154],["privacy.maennersache.de",154],["sinergy.ch",156],["agglo-valais-central.ch",156],["biomedcentral.com",157],["hsbcnet.com",158],["hsbcinnovationbanking.com",158],["create.hsbc",158],["gbm.hsbc.com",158],["hsbc.co.uk",159],["internationalservices.hsbc.com",159],["history.hsbc.com",159],["about.hsbc.co.uk",160],["privatebanking.hsbc.com",161],["independent.co.uk",164],["privacy.crash.net",164],["the-independent.com",165],["argos.co.uk",166],["poco.de",[167,168]],["moebel24.ch",168],["meubles.fr",168],["meubelo.nl",168],["moebel.de",168],["lipo.ch",169],["schubiger.ch",170],["aedt.de",171],["berlin-live.de",171],["gutefrage.net",171],["insideparadeplatz.ch",171],["morgenpost.de",171],["play3.de",171],["thueringen24.de",171],["pdfupload.io",172],["gamestar.de",[173,196]],["gamepro.de",173],["verksamt.se",174],["beko.com",175],["bepanthen.com.au",175],["berocca.com.au",175],["booking.com",175],["centrum.sk",175],["claratyne.com.au",175],["credit-suisse.com",175],["de.vanguard",175],["dhl.de",175],["fello.se",175],["foodandwine.com",175],["khanacademy.org",175],["konami.com",175],["groceries.asda.com",175],["n26.com",175],["nintendo.com",175],["panasonic.com",175],["pluto.tv",175],["ricardo.ch",175],["salesforce.com",175],["swisscom.ch",175],["swisspass.ch",175],["telenet.be",175],["toujeo.com",175],["questdiagnostics.com",175],["wallapop.com",175],["vattenfall.de",175],["yoigo.com",175],["noovle.com",176],["telsy.com",176],["timenterprise.it",176],["tim.it",176],["here.com",177],["vodafone.com",177],["cmp.heise.de",179],["cmp.am-online.com",179],["consent.newsnow.co.uk",179],["zara.com",180],["lepermislibre.fr",180],["negociardivida.spcbrasil.org.br",181],["privacy.topreality.sk",183],["privacy.autobazar.eu",183],["vu.lt",184],["adnkronos.com",[185,186]],["cornwalllive.com",[185,186]],["cyprus-mail.com",[185,186]],["informazione.it",[185,186]],["mymovies.it",[185,186]],["tuttoeuropei.com",[185,186]],["video.lacnews24.it",[185,186]],["taxscouts.com",187],["online.no",189],["telenor.no",189],["austrian.com",190],["hornetsecurity.com",191],["kayzen.io",191],["wasserkunst-hamburg.de",191],["bnc.ca",192],["festo.com",192],["standaard.be",192],["engelvoelkers.com",192],["knipex.de",192],["mappy.com",192],["ing.es",192],["taxfix.de",192],["tf1.fr",192],["bruendl.at",193],["latamairlines.com",194],["elisa.ee",195],["baseendpoint.brigitte.de",196],["baseendpoint.gala.de",196],["baseendpoint.haeuser.de",196],["baseendpoint.stern.de",196],["baseendpoint.urbia.de",196],["cmp.tag24.de",196],["cmpv2.berliner-zeitung.de",196],["golem.de",196],["consent.t-online.de",196],["cmp-sp.handelsblatt.com",196],["sp-consent.stuttgarter-nachrichten.de",197],["regjeringen.no",198],["sp-manager-magazin-de.manager-magazin.de",199],["consent.11freunde.de",199],["centrum24.pl",203],["replay.lsm.lv",204],["stadt-wien.at",205],["verl.de",205],["mobile.de",206],["cookist.it",207],["fanpage.it",207],["geopop.it",207],["lexplain.it",207],["royalmail.com",208],["gmx.net",209],["gmx.ch",210],["mojehobby.pl",211],["sp.stylevamp.de",212],["easyjet.com",213],["experian.co.uk",213],["postoffice.co.uk",213],["tescobank.com",213],["internetaptieka.lv",[214,215]],["wells.pt",216],["dskdirect.bg",217],["cmpv2.dba.dk",218],["spcmp.crosswordsolver.com",219],["thomann.de",220],["landkreis-kronach.de",221],["northcoast.com",222],["chaingpt.org",222],["bandenconcurrent.nl",223],["bandenexpert.be",223],["reserved.com",224],["metro.it",225],["makro.es",225],["metro.sk",225],["metro-cc.hr",225],["makro.nl",225],["metro.bg",225],["metro.at",225],["metro-tr.com",225],["metro.de",225],["metro.fr",225],["makro.cz",225],["metro.ro",225],["makro.pt",225],["makro.pl",225],["sklepy-odido.pl",225],["rastreator.com",225],["metro.ua",226],["metro.rs",226],["metro-kz.com",226],["metro.md",226],["metro.hu",226],["metro-cc.ru",226],["metro.pk",226],["balay.es",227],["constructa.com",227],["dafy-moto.com",228],["akku-shop.nl",229],["akkushop-austria.at",229],["akkushop-b2b.de",229],["akkushop.de",229],["akkushop.dk",229],["batterie-boutique.fr",229],["akkushop-schweiz.ch",230],["evzuttya.com.ua",231],["eobuv.cz",231],["eobuwie.com.pl",231],["ecipele.hr",231],["eavalyne.lt",231],["efootwear.eu",231],["eschuhe.ch",231],["eskor.se",231],["chaussures.fr",231],["ecipo.hu",231],["eobuv.com.ua",231],["eobuv.sk",231],["epantofi.ro",231],["epapoutsia.gr",231],["escarpe.it",231],["eschuhe.de",231],["obuvki.bg",231],["zapatos.es",231],["swedbank.ee",232],["mudanzavila.es",233],["bienmanger.com",234],["gesipausa.com",235],["beckhoff.com",235],["zitekick.dk",236],["eltechno.dk",236],["okazik.pl",236],["maxi.rs",238],["one4all.ie",239],["wideroe.no",240],["kijk.nl",242],["nordania.dk",243],["danskeci.com",243],["danicapension.dk",243],["gewerbegebiete.de",245],["cordia.fr",246],["vola.fr",247],["lafi.fr",248],["atida.fr",251],["bbvauk.com",252],["expertise.unimi.it",253],["altenberg.de",254],["vestel.es",255],["tsb.co.uk",256],["buienradar.nl",[257,258]],["linsenplatz.de",259],["budni.de",260],["erstecardclub.hr",260],["teufel.de",[261,262]],["abp.nl",263],["simplea.sk",264],["flip.bg",265],["kiertokanki.com",266],["leirovins.be",268],["vias.be",269],["virbac.com",270],["diners.hr",270],["squarehabitat.fr",270],["arbitrobancariofinanziario.it",271],["smit-sport.de",272],["go-e.com",273],["malerblatt-medienservice.de",274],["architekturbuch.de",274],["medienservice-holz.de",274],["leuchtstark.de",274],["casius.nl",275],["coolinarika.com",276],["vakgaragevannunen.nl",276],["fortuluz.es",276],["finna.fi",276],["eurogrow.es",276],["vakgaragevandertholen.nl",276],["envafors.dk",277],["dabbolig.dk",[278,279]],["daruk-emelok.hu",280],["exakta.se",281],["larca.de",282],["roli.com",283],["okazii.ro",284],["tgvinoui.sncf",285],["l-bank.de",286],["interhyp.de",287],["transparency.meta.com",289],["safran-group.com",290],["sr-ramenendeuren.be",290],["strato-hosting.co.uk",291],["auto.de",292],["contentkingapp.com",293],["otterbox.com",294],["stoertebeker-brauquartier.com",295],["stoertebeker.com",295],["stoertebeker-eph.com",295],["aparts.pl",296],["sinsay.com",[297,298]],["benu.cz",299],["stockholmresilience.org",300],["ludvika.se",300],["kammarkollegiet.se",300],["cazenovecapital.com",301],["statestreet.com",302],["beopen.lv",303],["cesukoncertzale.lv",304],["dodo.fr",305],["pepper.it",306],["pepper.pl",306],["preisjaeger.at",306],["mydealz.de",306],["dealabs.com",306],["hotukdeals.com",306],["chollometro.com",306],["makelaarsland.nl",307],["bricklink.com",308],["bestinver.es",309],["icvs2023.conf.tuwien.ac.at",310],["racshop.co.uk",[311,312]],["baabuk.com",313],["app.lepermislibre.fr",314],["multioferta.es",315],["testwise.com",[316,317]],["tonyschocolonely.com",318],["fitplus.is",318],["fransdegrebber.nl",318],["lilliputpress.ie",318],["lexibo.com",318],["marin-milou.com",318],["dare2tri.com",318],["la-vie-naturelle.com",[319,320]],["inovelli.com",321],["uonetplus.vulcan.net.pl",[322,323]],["consent.helagotland.se",324],["oper.koeln",[325,326]],["deezer.com",327],["hoteldesartssaigon.com",328],["groupeonepoint.com",329],["geneanet.org",329],["clickskeks.at",330],["abt-sportsline.de",330],["nerdstar.de",331],["prace.cz",331],["profesia.sk",331],["profesia.cz",331],["pracezarohem.cz",331],["atmoskop.cz",331],["seduo.sk",331],["seduo.cz",331],["teamio.com",331],["arnold-robot.com",331],["cvonline.lt",331],["cv.lv",331],["cv.ee",331],["dirbam.lt",331],["visidarbi.lv",331],["otsintood.ee",331],["pamiatki.pl",332],["initse.com",333],["salvagny.org",334],["taxinstitute.ie",335],["get-in-it.de",336],["tempcover.com",[337,338]],["guildford.gov.uk",339],["easyparts-recambios.es",[340,341]],["easyparts-rollerteile.de",[340,341]],["drimsim.com",342],["canyon.com",[343,344]],["vevovo.be",[345,346]],["vendezvotrevoiture.be",[345,346]],["wirkaufendeinauto.at",[345,346]],["vikoberallebiler.dk",[345,346]],["wijkopenautos.nl",[345,346]],["vikoperdinbil.se",[345,346]],["noicompriamoauto.it",[345,346]],["vendezvotrevoiture.fr",[345,346]],["compramostucoche.es",[345,346]],["wijkopenautos.be",[345,346]],["topautoosat.fi",347],["autoteiledirekt.de",347],["autoczescionline24.pl",347],["tuttoautoricambi.it",347],["onlinecarparts.co.uk",347],["autoalkatreszek24.hu",347],["autodielyonline24.sk",347],["reservdelar24.se",347],["pecasauto24.pt",347],["reservedeler24.co.no",347],["piecesauto24.lu",347],["rezervesdalas24.lv",347],["besteonderdelen.nl",347],["recambioscoche.es",347],["antallaktikaexartimata.gr",347],["piecesauto.fr",347],["teile-direkt.ch",347],["lpi.org",348],["flyingtiger.com",350],["borgomontecedrone.it",350],["recaro-shop.com",350],["gera.de",351],["mfr-chessy.fr",352],["mfr-lamure.fr",352],["mfr-saint-romain.fr",352],["mfr-lapalma.fr",352],["mfrvilliemorgon.asso.fr",352],["mfr-charentay.fr",352],["mfr.fr",352],["nationaltrust.org.uk",353],["ib-hansmeier.de",355],["rsag.de",356],["esaa-eu.org",356],["theprotocol.it",[358,359]],["lightandland.co.uk",360],["etransport.pl",361],["wohnen-im-alter.de",362],["johnmuirhealth.com",[363,364]],["markushaenni.com",365],["airbaltic.com",366],["gamersgate.com",366],["zorgzaam010.nl",367],["paruvendu.fr",368],["cmpv2.bistro.sk",370],["privacy.bazar.sk",370],["hennamorena.com",371],["newsello.pl",372],["porp.pl",373],["golfbreaks.com",374],["lieferando.de",375],["pyszne.pl",375],["lieferando.at",375],["takeaway.com",375],["thuisbezorgd.nl",375],["holidayhypermarket.co.uk",376],["atu.de",377],["atu-flottenloesungen.de",377],["but.fr",377],["fortuneo.fr",377],["maif.fr",377],["sparkasse.at",377],["dpdgroup.com",378],["dpd.fr",378],["dpd.com",378],["cosmosdirekt.de",378],["bstrongoutlet.pt",379],["nobbot.com",380],["finlayson.fi",[381,382]],["cowaymega.ca",[381,382]],["arktis.de",383],["desktronic.de",383],["belleek.com",383],["cowaymega.com",383],["dockin.de",383],["dryrobe.com",383],["formswim.com",383],["hairtalk.se",383],["hallmark.co.uk",383],["loopearplugs.com",383],["peopleofshibuya.com",383],["sanctum.shop",383],["tartanblanketco.com",383],["beam.co.uk",[384,385]],["malaikaraiss.com",386],["wefashion.com",387],["merkur.dk",388],["omegawatches.com",391],["carefully.be",392],["aerotime.aero",392],["rocket-league.com",393],["dws.com",394],["bosch-homecomfort.com",395],["elmleblanc-optibox.fr",395],["monservicechauffage.fr",395],["boschrexroth.com",395],["home-connect.com",396],["lowrider.at",[397,398]],["mesto.de",399],["veiligverkeer.be",400],["vsv.be",400],["dehogerielen.be",400],["intersport.gr",401],["intersport.bg",401],["intersport.com.cy",401],["intersport.ro",401],["ticsante.com",402],["techopital.com",402],["millenniumprize.org",403],["hepster.com",404],["ellisphere.fr",405],["peterstaler.de",406],["blackforest-still.de",406],["tiendaplayaundi.com",407],["ajtix.co.uk",408],["raja.fr",409],["rajarani.de",409],["avery-zweckform.com",411],["1xinternet.de",411],["futterhaus.de",411],["dasfutterhaus.at",411],["frischeparadies.de",411],["fmk-steuer.de",411],["selgros.de",411],["mediapart.fr",412],["athlon.com",413],["alumniportal-deutschland.org",414],["snoopmedia.com",414],["myguide.de",414],["study-in-germany.de",414],["daad.de",414],["cornelsen.de",[415,416]],["vinmonopolet.no",418],["tvp.info",419],["tvp.pl",419],["tvpworld.com",419],["brtvp.pl",419],["tvpparlament.pl",419],["belsat.eu",419],["warnung.bund.de",420],["mediathek.lfv-bayern.de",421],["allegrolokalnie.pl",422],["eon.pl",[423,424]],["ylasatakunta.fi",[425,426]],["mega-image.ro",427],["louisvuitton.com",428],["bodensee-airport.eu",429],["department56.com",430],["allendesignsstudio.com",430],["designsbylolita.co",430],["shop.enesco.com",430],["savoriurbane.com",431],["miumiu.com",432],["church-footwear.com",432],["clickdoc.fr",433],["car-interface.com",434],["monolithdesign.it",434],["smileypack.de",[435,436]],["malijunaki.si",437],["finom.co",438],["orange.es",[439,440]],["skousen.no",441],["energinet.dk",441],["medimax.de",442],["lotto.it",443],["readspeaker.com",443],["ibistallinncenter.ee",444],["aaron.ai",445],["thebathcollection.com",446],["coastfashion.com",[447,448]],["oasisfashion.com",[447,448]],["warehousefashion.com",[447,448]],["misspap.com",[447,448]],["karenmillen.com",[447,448]],["boohooman.com",[447,448]],["hdt.de",449],["wolt.com",450],["myprivacy.dpgmedia.nl",451],["myprivacy.dpgmedia.be",451],["www.dpgmediagroup.com",451],["tnt.com",452],["uza.be",453],["uzafoundation.be",453],["uzajobs.be",453],["cinemas-lumiere.com",456],["cdiscount.com",457],["brabus.com",458],["roborock.com",459],["strumentimusicali.net",460],["maisonmargiela.com",461],["webfleet.com",462],["dragonflyshipping.ca",463],["broekhuis.nl",464],["nemck.cz",465],["bokio.se",466],["sap-press.com",467],["roughguides.com",[468,469]],["topannonces.fr",471],["homap.fr",472],["artifica.fr",473],["plan-interactif.com",473],["ville-cesson.fr",473],["moismoliere.com",474],["unihomes.co.uk",475],["bkk.hu",476],["coiffhair.com",477],["ptc.eu",478],["ziegert-group.com",479],["toureiffel.paris",480],["livoo.fr",480],["interieur.gouv.fr",480],["smdv.de",481],["digitalo.de",481],["mojanorwegia.pl",483],["koempf24.ch",[484,485]],["teichitekten24.de",[484,485]],["koempf24.de",[484,485]],["wolff-finnhaus-shop.de",[484,485]],["asnbank.nl",486],["blgwonen.nl",486],["regiobank.nl",486],["snsbank.nl",486],["vulcan.net.pl",[487,488]],["ogresnovads.lv",489],["partenamut.be",490],["pirelli.com",491],["unicredit.it",492],["effector.pl",493],["zikodermo.pl",[494,495]],["wassererleben.ch",496],["devolksbank.nl",497],["vejdirektoratet.dk",499],["usaa.com",500],["consorsbank.de",501],["metroag.de",502],["kupbilecik.pl",503],["oxfordeconomics.com",504],["oxfordeconomics.com.au",[505,506]],["ceneo.pl",507],["routershop.nl",508],["druni.es",509],["druni.pt",509],["e-jumbo.gr",510],["alza.cz",511],["rmf.fm",513],["rmf24.pl",513],["nsinternational.com",514],["laposte.fr",515],["meinbildkalender.de",516],["gls-group.com",517],["chilis.com",518],["swiss-sport.tv",519],["consent.thetimes.com",520],["cadenaser.com",521],["offistore.fi",522],["technomarket.bg",523]]);

const entitiesMap = new Map([["consent.google",0],["festool",26],["fuso-trucks",26],["hertz",34],["mediamarkt",35],["gmx",48],["plus500",48],["music.amazon",[61,62]],["chrono24",[66,67]],["kinepolis",72],["vaillant",72],["jobijoba",78],["intersport",[78,175]],["americanairlines",80],["joyn",104],["degiro",135],["tameteo",139],["meteored",139],["atlasformen",153],["hsbc",158],["moebelix",167],["moemax",167],["xxxlutz",167],["xxxlesnina",167],["jll",175],["samsonite",175],["adidas",182],["super-hobby",211],["audi",213],["gesipa",235],["batteryempire",237],["invisalign",239],["bmw",241],["danskebank",243],["dehn",244],["skyscanner",249],["coolblue",250],["sanareva",251],["bbva",252],["indigoneo",288],["strato",291],["t3micro",318],["easyparts",[340,341]],["auto-doc",347],["autodoc",347],["autodoc24",347],["refurbed",349],["hej-natural",354],["answear",357],["just-eat",375],["justeat",375],["ionos",390],["rajapack",[409,410]],["allegro",422],["bergzeit",[454,455]],["rexbo",470],["petiteamelie",482]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function trustedClickElement(
    selectors = '',
    extraMatch = '',
    delay = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-click-element', selectors, extraMatch, delay);

    if ( extraMatch !== '' ) {
        const assertions = safe.String_split.call(extraMatch, ',').map(s => {
            const pos1 = s.indexOf(':');
            const s1 = pos1 !== -1 ? s.slice(0, pos1) : s;
            const not = s1.startsWith('!');
            const type = not ? s1.slice(1) : s1;
            const s2 = pos1 !== -1 ? s.slice(pos1+1).trim() : '';
            if ( s2 === '' ) { return; }
            const out = { not, type };
            const match = /^\/(.+)\/(i?)$/.exec(s2);
            if ( match !== null ) {
                out.re = new RegExp(match[1], match[2] || undefined);
                return out;
            }
            const pos2 = s2.indexOf('=');
            const key = pos2 !== -1 ? s2.slice(0, pos2).trim() : s2;
            const value = pos2 !== -1 ? s2.slice(pos2+1).trim() : '';
            out.re = new RegExp(`^${this.escapeRegexChars(key)}=${this.escapeRegexChars(value)}`);
            return out;
        }).filter(details => details !== undefined);
        const allCookies = assertions.some(o => o.type === 'cookie')
            ? getAllCookiesFn()
            : [];
        const allStorageItems = assertions.some(o => o.type === 'localStorage')
            ? getAllLocalStorageFn()
            : [];
        const hasNeedle = (haystack, needle) => {
            for ( const { key, value } of haystack ) {
                if ( needle.test(`${key}=${value}`) ) { return true; }
            }
            return false;
        };
        for ( const { not, type, re } of assertions ) {
            switch ( type ) {
            case 'cookie':
                if ( hasNeedle(allCookies, re) === not ) { return; }
                break;
            case 'localStorage':
                if ( hasNeedle(allStorageItems, re) === not ) { return; }
                break;
            }
        }
    }

    const getShadowRoot = elem => {
        // Firefox
        if ( elem.openOrClosedShadowRoot ) {
            return elem.openOrClosedShadowRoot;
        }
        // Chromium
        if ( typeof chrome === 'object' ) {
            if ( chrome.dom && chrome.dom.openOrClosedShadowRoot ) {
                return chrome.dom.openOrClosedShadowRoot(elem);
            }
        }
        return null;
    };

    const querySelectorEx = (selector, context = document) => {
        const pos = selector.indexOf(' >>> ');
        if ( pos === -1 ) { return context.querySelector(selector); }
        const outside = selector.slice(0, pos).trim();
        const inside = selector.slice(pos + 5).trim();
        const elem = context.querySelector(outside);
        if ( elem === null ) { return null; }
        const shadowRoot = getShadowRoot(elem);
        return shadowRoot && querySelectorEx(inside, shadowRoot);
    };

    const selectorList = safe.String_split.call(selectors, /\s*,\s*/)
        .filter(s => {
            try {
                void querySelectorEx(s);
            } catch {
                return false;
            }
            return true;
        });
    if ( selectorList.length === 0 ) { return; }

    const clickDelay = parseInt(delay, 10) || 1;
    const t0 = Date.now();
    const tbye = t0 + 10000;
    let tnext = selectorList.length !== 1 ? t0 : t0 + clickDelay;

    const terminate = ( ) => {
        selectorList.length = 0;
        next.stop();
        observe.stop();
    };

    const next = notFound => {
        if ( selectorList.length === 0 ) {
            safe.uboLog(logPrefix, 'Completed');
            return terminate();
        }
        const tnow = Date.now();
        if ( tnow >= tbye ) {
            safe.uboLog(logPrefix, 'Timed out');
            return terminate();
        }
        if ( notFound ) { observe(); }
        const delay = Math.max(notFound ? tbye - tnow : tnext - tnow, 1);
        next.timer = setTimeout(( ) => {
            next.timer = undefined;
            process();
        }, delay);
        safe.uboLog(logPrefix, `Waiting for ${selectorList[0]}...`);
    };
    next.stop = ( ) => {
        if ( next.timer === undefined ) { return; }
        clearTimeout(next.timer);
        next.timer = undefined;
    };

    const observe = ( ) => {
        if ( observe.observer !== undefined ) { return; }
        observe.observer = new MutationObserver(( ) => {
            if ( observe.timer !== undefined ) { return; }
            observe.timer = setTimeout(( ) => {
                observe.timer = undefined;
                process();
            }, 20);
        });
        observe.observer.observe(document, {
            attributes: true,
            childList: true,
            subtree: true,
        });
    };
    observe.stop = ( ) => {
        if ( observe.timer !== undefined ) {
            clearTimeout(observe.timer);
            observe.timer = undefined;
        }
        if ( observe.observer ) {
            observe.observer.disconnect();
            observe.observer = undefined;
        }
    };

    const process = ( ) => {
        next.stop();
        if ( Date.now() < tnext ) { return next(); }
        const selector = selectorList.shift();
        if ( selector === undefined ) { return terminate(); }
        const elem = querySelectorEx(selector);
        if ( elem === null ) {
            selectorList.unshift(selector);
            return next(true);
        }
        safe.uboLog(logPrefix, `Clicked ${selector}`);
        elem.click();
        tnext += clickDelay;
        next();
    };

    runAtHtmlElementFn(process);
}

function getAllCookiesFn() {
    const safe = safeSelf();
    return safe.String_split.call(document.cookie, /\s*;\s*/).map(s => {
        const pos = s.indexOf('=');
        if ( pos === 0 ) { return; }
        if ( pos === -1 ) { return `${s.trim()}=`; }
        const key = s.slice(0, pos).trim();
        const value = s.slice(pos+1).trim();
        return { key, value };
    }).filter(s => s !== undefined);
}

function getAllLocalStorageFn(which = 'localStorage') {
    const storage = self[which];
    const out = [];
    for ( let i = 0; i < storage.length; i++ ) {
        const key = storage.key(i);
        const value = storage.getItem(key);
        return { key, value };
    }
    return out;
}

function runAtHtmlElementFn(fn) {
    if ( document.documentElement ) {
        fn();
        return;
    }
    const observer = new MutationObserver(( ) => {
        observer.disconnect();
        fn();
    });
    observer.observe(document, { childList: true });
}

function safeSelf() {
    if ( scriptletGlobals.safeSelf ) {
        return scriptletGlobals.safeSelf;
    }
    const self = globalThis;
    const safe = {
        'Array_from': Array.from,
        'Error': self.Error,
        'Function_toStringFn': self.Function.prototype.toString,
        'Function_toString': thisArg => safe.Function_toStringFn.call(thisArg),
        'Math_floor': Math.floor,
        'Math_max': Math.max,
        'Math_min': Math.min,
        'Math_random': Math.random,
        'Object': Object,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'Object_defineProperties': Object.defineProperties.bind(Object),
        'Object_fromEntries': Object.fromEntries.bind(Object),
        'Object_getOwnPropertyDescriptor': Object.getOwnPropertyDescriptor.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
        'String_fromCharCode': String.fromCharCode,
        'String_split': String.prototype.split,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'JSON': self.JSON,
        'JSON_parseFn': self.JSON.parse,
        'JSON_stringifyFn': self.JSON.stringify,
        'JSON_parse': (...args) => safe.JSON_parseFn.call(safe.JSON, ...args),
        'JSON_stringify': (...args) => safe.JSON_stringifyFn.call(safe.JSON, ...args),
        'log': console.log.bind(console),
        // Properties
        logLevel: 0,
        // Methods
        makeLogPrefix(...args) {
            return this.sendToLogger && `[${args.join(' \u205D ')}]` || '';
        },
        uboLog(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('info', ...args);
            
        },
        uboErr(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('error', ...args);
        },
        escapeRegexChars(s) {
            return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true, expect: true };
            }
            const expect = (options.canNegate !== true || pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            if ( options.flags !== undefined ) {
                return {
                    re: new this.RegExp(this.escapeRegexChars(pattern),
                        options.flags
                    ),
                    expect,
                };
            }
            return { pattern, expect };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            if ( details.re ) {
                return this.RegExp_test.call(details.re, haystack) === details.expect;
            }
            return haystack.includes(details.pattern) === details.expect;
        },
        patternToRegex(pattern, flags = undefined, verbatim = false) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                const reStr = this.escapeRegexChars(pattern);
                return new RegExp(verbatim ? `^${reStr}$` : reStr, flags);
            }
            try {
                return new RegExp(match[1], match[2] || undefined);
            }
            catch {
            }
            return /^/;
        },
        getExtraArgs(args, offset = 0) {
            const entries = args.slice(offset).reduce((out, v, i, a) => {
                if ( (i & 1) === 0 ) {
                    const rawValue = a[i+1];
                    const value = /^\d+$/.test(rawValue)
                        ? parseInt(rawValue, 10)
                        : rawValue;
                    out.push([ a[i], value ]);
                }
                return out;
            }, []);
            return this.Object_fromEntries(entries);
        },
        onIdle(fn, options) {
            if ( self.requestIdleCallback ) {
                return self.requestIdleCallback(fn, options);
            }
            return self.requestAnimationFrame(fn);
        },
        offIdle(id) {
            if ( self.requestIdleCallback ) {
                return self.cancelIdleCallback(id);
            }
            return self.cancelAnimationFrame(id);
        }
    };
    scriptletGlobals.safeSelf = safe;
    if ( scriptletGlobals.bcSecret === undefined ) { return safe; }
    // This is executed only when the logger is opened
    safe.logLevel = scriptletGlobals.logLevel || 1;
    let lastLogType = '';
    let lastLogText = '';
    let lastLogTime = 0;
    safe.toLogText = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( text === lastLogText && type === lastLogType ) {
            if ( (Date.now() - lastLogTime) < 5000 ) { return; }
        }
        lastLogType = type;
        lastLogText = text;
        lastLogTime = Date.now();
        return text;
    };
    try {
        const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
        let bcBuffer = [];
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            if ( bcBuffer === undefined ) {
                return bc.postMessage({ what: 'messageToLogger', type, text });
            }
            bcBuffer.push({ type, text });
        };
        bc.onmessage = ev => {
            const msg = ev.data;
            switch ( msg ) {
            case 'iamready!':
                if ( bcBuffer === undefined ) { break; }
                bcBuffer.forEach(({ type, text }) =>
                    bc.postMessage({ what: 'messageToLogger', type, text })
                );
                bcBuffer = undefined;
                break;
            case 'setScriptletLogLevelToOne':
                safe.logLevel = 1;
                break;
            case 'setScriptletLogLevelToTwo':
                safe.logLevel = 2;
                break;
            }
        };
        bc.postMessage('areyouready?');
    } catch {
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            safe.log(`uBO ${text}`);
        };
    }
    return safe;
}

/******************************************************************************/

const hnParts = [];
try {
    let origin = document.location.origin;
    if ( origin === 'null' ) {
        const origins = document.location.ancestorOrigins;
        for ( let i = 0; i < origins.length; i++ ) {
            origin = origins[i];
            if ( origin !== 'null' ) { break; }
        }
    }
    const pos = origin.lastIndexOf('://');
    if ( pos === -1 ) { return; }
    hnParts.push(...origin.slice(pos+3).split('.'));
} catch {
}
const hnpartslen = hnParts.length;
if ( hnpartslen === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = [];

// Exceptions
if ( exceptionsMap.size !== 0 ) {
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        const excepted = exceptionsMap.get(hn);
        if ( excepted ) { tonotdoIndices.push(...excepted); }
    }
    exceptionsMap.clear();
}

// Hostname-based
if ( hostnamesMap.size !== 0 ) {
    const collectArgIndices = hn => {
        let argsIndices = hostnamesMap.get(hn);
        if ( argsIndices === undefined ) { return; }
        if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
        for ( const argsIndex of argsIndices ) {
            if ( tonotdoIndices.includes(argsIndex) ) { continue; }
            todoIndices.add(argsIndex);
        }
    };
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        collectArgIndices(hn);
    }
    collectArgIndices('*');
    hostnamesMap.clear();
}

// Entity-based
if ( entitiesMap.size !== 0 ) {
    const n = hnpartslen - 1;
    for ( let i = 0; i < n; i++ ) {
        for ( let j = n; j > i; j-- ) {
            const en = hnParts.slice(i,j).join('.');
            let argsIndices = entitiesMap.get(en);
            if ( argsIndices === undefined ) { continue; }
            if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
            for ( const argsIndex of argsIndices ) {
                if ( tonotdoIndices.includes(argsIndex) ) { continue; }
                todoIndices.add(argsIndex);
            }
        }
    }
    entitiesMap.clear();
}

// Apply scriplets
for ( const i of todoIndices ) {
    try { trustedClickElement(...argsList[i]); }
    catch { }
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

uBOL_trustedClickElement();

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
