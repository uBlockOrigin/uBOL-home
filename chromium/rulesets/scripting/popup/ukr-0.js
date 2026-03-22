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

    const details = {"id":"ukr-0","block":{"hostnames":["1qi.info","go.xl.ua","spots.ru","1463.info","apytrc.com","go.zdos.ru","bngtrak.com","sinehut.com","deeppquiz.ru","tirsmile.pro","virnews.club","all-audio.pro","betemolgar.com","paintejuke.com","go.ukrleads.com","tubecontext.com","imaginarybad.com","refpahrwzjlv.top","b.we-are-anon.com","bestdealfor1.life","click.zmctrack.net","debitcrebit669.com","www.mir-stalkera.ru","z.cdn.trafficdok.com","awesomeredirector.com","ec2-44-233-143-239.us-west-2.compute.amazonaws.com"],"regexes":["iclients","^[^:]+:\\/\\/([^:/]+\\.)?clients\\.cdnet\\.tv\\/lockadb\\.php"]},"allow":{"hostnames":[],"regexes":[]}};

    self.preventPopupDetails = self.preventPopupDetails || [];
    self.preventPopupDetails.push(details);

})();
