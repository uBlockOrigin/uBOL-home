/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
    Copyright (C) 2022-present Raymond Hill

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

/******************************************************************************/

import {
    browser,
    dnr,
    localRead, localWrite, localRemove,
    sessionRead, sessionWrite,
    adminRead,
} from './ext.js';

import {
    hostnamesFromMatches,
    isDescendantHostnameOfIter,
    toBroaderHostname,
} from './utils.js';

import {
    TRUSTED_DIRECTIVE_BASE_RULE_ID,
    getDynamicRules
} from './ruleset-manager.js';

/******************************************************************************/

// 0:       no filtering
// 1:    basic filtering
// 2:  optimal filtering
// 3: complete filtering

export const     MODE_NONE = 0;
export const    MODE_BASIC = 1;
export const  MODE_OPTIMAL = 2;
export const MODE_COMPLETE = 3;

/******************************************************************************/

const pruneDescendantHostnamesFromSet = (hostname, hnSet) => {
    for ( const hn of hnSet ) {
        if ( hn.endsWith(hostname) === false ) { continue; }
        if ( hn === hostname ) { continue; }
        if ( hn.at(-hostname.length-1) !== '.' ) { continue; }
        hnSet.delete(hn);
    }
};

const pruneHostnameFromSet = (hostname, hnSet) => {
    let hn = hostname;
    for (;;) {
        hnSet.delete(hn);
        hn = toBroaderHostname(hn);
        if ( hn === '*' ) { break; }
    }
};

/******************************************************************************/

const eqSets = (setBefore, setAfter) => {
    for ( const hn of setAfter ) {
        if ( setBefore.has(hn) === false ) { return false; }
    }
    for ( const hn of setBefore ) {
        if ( setAfter.has(hn) === false ) { return false; }
    }
    return true;
};

/******************************************************************************/

const serializeModeDetails = details => {
    return {
        none: Array.from(details.none),
        basic: Array.from(details.basic),
        optimal: Array.from(details.optimal),
        complete: Array.from(details.complete),
    };
};

const unserializeModeDetails = details => {
    return {
        none: new Set(details.none),
        basic: new Set(details.basic ?? details.network),
        optimal: new Set(details.optimal ?? details.extendedSpecific),
        complete: new Set(details.complete ?? details.extendedGeneric),
    };
};

/******************************************************************************/

function lookupFilteringMode(filteringModes, hostname) {
    const { none, basic, optimal, complete } = filteringModes;
    if ( hostname === 'all-urls' ) {
        if ( filteringModes.none.has('all-urls') ) { return MODE_NONE; }
        if ( filteringModes.basic.has('all-urls') ) { return MODE_BASIC; }
        if ( filteringModes.optimal.has('all-urls') ) { return MODE_OPTIMAL; }
        if ( filteringModes.complete.has('all-urls') ) { return MODE_COMPLETE; }
        return MODE_BASIC;
    }
    if ( none.has(hostname) ) { return MODE_NONE; }
    if ( none.has('all-urls') === false ) {
        if ( isDescendantHostnameOfIter(hostname, none) ) { return MODE_NONE; }
    }
    if ( basic.has(hostname) ) { return MODE_BASIC; }
    if ( basic.has('all-urls') === false ) {
        if ( isDescendantHostnameOfIter(hostname, basic) ) { return MODE_BASIC; }
    }
    if ( optimal.has(hostname) ) { return MODE_OPTIMAL; }
    if ( optimal.has('all-urls') === false ) {
        if ( isDescendantHostnameOfIter(hostname, optimal) ) { return MODE_OPTIMAL; }
    }
    if ( complete.has(hostname) ) { return MODE_COMPLETE; }
    if ( complete.has('all-urls') === false ) {
        if ( isDescendantHostnameOfIter(hostname, complete) ) { return MODE_COMPLETE; }
    }
    return lookupFilteringMode(filteringModes, 'all-urls');
}

/******************************************************************************/

function applyFilteringMode(filteringModes, hostname, afterLevel) {
    const defaultLevel = lookupFilteringMode(filteringModes, 'all-urls');
    if ( hostname === 'all-urls' ) {
        if ( afterLevel === defaultLevel ) { return afterLevel; }
        switch ( afterLevel ) {
        case MODE_NONE:
            filteringModes.none.clear();
            filteringModes.none.add('all-urls');
            break;
        case MODE_BASIC:
            filteringModes.basic.clear();
            filteringModes.basic.add('all-urls');
            break;
        case MODE_OPTIMAL:
            filteringModes.optimal.clear();
            filteringModes.optimal.add('all-urls');
            break;
        case MODE_COMPLETE:
            filteringModes.complete.clear();
            filteringModes.complete.add('all-urls');
            break;
        }
        switch ( defaultLevel ) {
        case MODE_NONE:
            filteringModes.none.delete('all-urls');
            break;
        case MODE_BASIC:
            filteringModes.basic.delete('all-urls');
            break;
        case MODE_OPTIMAL:
            filteringModes.optimal.delete('all-urls');
            break;
        case MODE_COMPLETE:
            filteringModes.complete.delete('all-urls');
            break;
        }
        return lookupFilteringMode(filteringModes, 'all-urls');
    }
    const beforeLevel = lookupFilteringMode(filteringModes, hostname);
    if ( afterLevel === beforeLevel ) { return afterLevel; }
    const { none, basic, optimal, complete } = filteringModes;
    switch ( beforeLevel ) {
    case MODE_NONE:
        pruneHostnameFromSet(hostname, none);
        break;
    case MODE_BASIC:
        pruneHostnameFromSet(hostname, basic);
        break;
    case MODE_OPTIMAL:
        pruneHostnameFromSet(hostname, optimal);
        break;
    case MODE_COMPLETE:
        pruneHostnameFromSet(hostname, complete);
        break;
    }
    if ( afterLevel !== defaultLevel ) {
        switch ( afterLevel ) {
        case MODE_NONE:
            if ( isDescendantHostnameOfIter(hostname, none) === false ) {
                filteringModes.none.add(hostname);
                pruneDescendantHostnamesFromSet(hostname, none);
            }
            break;
        case MODE_BASIC:
            if ( isDescendantHostnameOfIter(hostname, basic) === false ) {
                filteringModes.basic.add(hostname);
                pruneDescendantHostnamesFromSet(hostname, basic);
            }
            break;
        case MODE_OPTIMAL:
            if ( isDescendantHostnameOfIter(hostname, optimal) === false ) {
                filteringModes.optimal.add(hostname);
                pruneDescendantHostnamesFromSet(hostname, optimal);
            }
            break;
        case MODE_COMPLETE:
            if ( isDescendantHostnameOfIter(hostname, complete) === false ) {
                filteringModes.complete.add(hostname);
                pruneDescendantHostnamesFromSet(hostname, complete);
            }
            break;
        }
    }
    return lookupFilteringMode(filteringModes, hostname);
}

/******************************************************************************/

async function readFilteringModeDetails() {
    if ( readFilteringModeDetails.cache ) {
        return readFilteringModeDetails.cache;
    }
    const sessionModes = await sessionRead('filteringModeDetails');
    if ( sessionModes instanceof Object ) {
        readFilteringModeDetails.cache = unserializeModeDetails(sessionModes);
        return readFilteringModeDetails.cache;
    }
    let [ userModes, adminNoFiltering ] = await Promise.all([
        localRead('filteringModeDetails'),
        localRead('adminNoFiltering'),
    ]);
    if ( userModes === undefined ) {
        userModes = { basic: [ 'all-urls' ] };
    }
    userModes = unserializeModeDetails(userModes);
    if ( Array.isArray(adminNoFiltering) ) {
        for ( const hn of adminNoFiltering ) {
            applyFilteringMode(userModes, hn, 0);
        }
    }
    filteringModesToDNR(userModes);
    sessionWrite('filteringModeDetails', serializeModeDetails(userModes));
    readFilteringModeDetails.cache = userModes;
    adminRead('noFiltering').then(results => {
        if ( results ) {
            localWrite('adminNoFiltering', results);
        } else {
            localRemove('adminNoFiltering');
        }
    });
    return userModes;
}

/******************************************************************************/

async function writeFilteringModeDetails(afterDetails) {
    await filteringModesToDNR(afterDetails);
    const data = serializeModeDetails(afterDetails);
    localWrite('filteringModeDetails', data);
    sessionWrite('filteringModeDetails', data);
    readFilteringModeDetails.cache = unserializeModeDetails(data);
}

/******************************************************************************/

async function filteringModesToDNR(modes) {
    const dynamicRuleMap = await getDynamicRules();
    const presentRule = dynamicRuleMap.get(TRUSTED_DIRECTIVE_BASE_RULE_ID);
    const presentNone = new Set(
        presentRule && presentRule.condition.requestDomains
    );
    if ( eqSets(presentNone, modes.none) ) { return; }
    const removeRuleIds = [];
    if ( presentRule !== undefined ) {
        removeRuleIds.push(TRUSTED_DIRECTIVE_BASE_RULE_ID);
        dynamicRuleMap.delete(TRUSTED_DIRECTIVE_BASE_RULE_ID);
    }
    const addRules = [];
    if ( modes.none.size !== 0 ) {
        const rule = {
            id: TRUSTED_DIRECTIVE_BASE_RULE_ID,
            action: { type: 'allowAllRequests' },
            condition: {
                resourceTypes: [ 'main_frame' ],
            },
            priority: 100,
        };
        if (
            modes.none.size !== 1 ||
            modes.none.has('all-urls') === false
        ) {
            rule.condition.requestDomains = Array.from(modes.none);
        }
        addRules.push(rule);
        dynamicRuleMap.set(TRUSTED_DIRECTIVE_BASE_RULE_ID, rule);
    }
    const updateOptions = {};
    if ( addRules.length ) {
        updateOptions.addRules = addRules;
    }
    if ( removeRuleIds.length ) {
        updateOptions.removeRuleIds = removeRuleIds;
    }
    await dnr.updateDynamicRules(updateOptions);
}

/******************************************************************************/

export async function getFilteringModeDetails() {
    const actualDetails = await readFilteringModeDetails();
    return {
        none: new Set(actualDetails.none),
        basic: new Set(actualDetails.basic),
        optimal: new Set(actualDetails.optimal),
        complete: new Set(actualDetails.complete),
    };
}

/******************************************************************************/

export async function getFilteringMode(hostname) {
    const filteringModes = await getFilteringModeDetails();
    return lookupFilteringMode(filteringModes, hostname);
}

export async function setFilteringMode(hostname, afterLevel) {
    const filteringModes = await getFilteringModeDetails();
    const level = applyFilteringMode(filteringModes, hostname, afterLevel);
    await writeFilteringModeDetails(filteringModes);
    return level;
}

/******************************************************************************/

export function getDefaultFilteringMode() {
    return getFilteringMode('all-urls');
}

export function setDefaultFilteringMode(afterLevel) {
    return setFilteringMode('all-urls', afterLevel);
}

/******************************************************************************/

export async function syncWithBrowserPermissions() {
    const [ permissions, beforeMode ] = await Promise.all([
        browser.permissions.getAll(),
        getDefaultFilteringMode(),
    ]);
    const allowedHostnames = new Set(hostnamesFromMatches(permissions.origins || []));
    let modified = false;
    if ( beforeMode > MODE_BASIC && allowedHostnames.has('all-urls') === false ) {
        await setDefaultFilteringMode(MODE_BASIC);
        modified = true;
    }
    const afterMode = await getDefaultFilteringMode();
    if ( afterMode > MODE_BASIC ) { return false; }
    const filteringModes = await getFilteringModeDetails();
    const { optimal, complete } = filteringModes;
    for ( const hn of optimal ) {
        if ( allowedHostnames.has(hn) ) { continue; }
        optimal.delete(hn);
        modified = true;
    }
    for ( const hn of complete ) {
        if ( allowedHostnames.has(hn) ) { continue; }
        complete.delete(hn);
        modified = true;
    }
    await writeFilteringModeDetails(filteringModes);
    return modified;
}

/******************************************************************************/
