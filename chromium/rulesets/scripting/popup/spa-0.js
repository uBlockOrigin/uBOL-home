/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2026-present Raymond Hill

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

// Important!
// Isolate from global scope
(function uBOL_preventPopup() {

    const details = {"id":"spa-0","block":{"hostnames":["minube.click","stressfulbrag.com","leagueofslots-cl.com","tracking.actualidad.es","significadoconcepto.com"],"regexes":["&adbisa","[{\"re\":\"&adbisactive=\",\"f\":\"i\"}]","/bjmp","[{\"re\":\"\\\\/bjmp.*?\\\\.htm[^%.0-9a-z_-]?\",\"f\":\"i\"}]","/mavenj","[{\"re\":\"\\\\/mavenjump\\\\.htm[^%.0-9a-z_-]?\",\"f\":\"i\"}]","seriesm","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?seriesmetro\\\\.net\\\\/.*?\\\\/footer_bg\",\"f\":\"i\"}]","pepelic","[{\"re\":\"^[^:]+:\\\\/\\\\/([^:/]+\\\\.)?pepeliculas\\\\.org\\\\/patrocinado\",\"f\":\"i\"}]"]},"allow":{"hostnames":[],"regexes":[]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
