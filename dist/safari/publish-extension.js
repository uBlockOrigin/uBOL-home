/*******************************************************************************

    uBlock Origin - a comprehensive, efficient content blocker
    Copyright (C) 2025-present Raymond Hill

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

import * as fs from 'node:fs/promises';
import { execSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

/******************************************************************************/

function voidFunc() {
}

/******************************************************************************/

async function getSecret(name) {
    if ( secrets[name] === undefined ) {
        const platform = await shellExec(`uname -o`);
        if ( platform === 'Linux' ) {
            secrets[name] = await shellExec(`secret-tool lookup token ${name}`);
        } else if ( platform === 'Darwin' ) {
            secrets[name] = await shellExec(`security find-generic-password -w -s "${name}" -a "publish-extension"`);
        }
    }
    return secrets[name];
}

const secrets = {};

/******************************************************************************/

async function getRepoRoot() {
    const homeDir = os.homedir();
    let currentDir = process.cwd();
    for (;;) {
        const fileName = `${currentDir}/.git`;
        const stat = await fs.stat(fileName).catch(voidFunc);
        if ( stat !== undefined ) { return currentDir; }
        currentDir = path.resolve(currentDir, '..');
        if ( currentDir.startsWith(homeDir) === false ) { return; }
    }
}

/******************************************************************************/

async function getReleaseInfo() {
    console.log(`Fetching release info for ${githubTag} from GitHub`);
    const releaseInfoUrl =  `https://api.github.com/repos/${githubOwner}/${githubRepo}/releases/tags/${githubTag}`;
    const request = new Request(releaseInfoUrl, {
        headers: {
            Authorization: githubAuth,
        },
    });
    const response = await fetch(request).catch(voidFunc);
    if ( response === undefined ) { return; }
    if ( response.ok !== true ) { return; }
    const releaseInfo = await response.json().catch(voidFunc);
    if ( releaseInfo === undefined ) { return; }
    return releaseInfo;
}

/******************************************************************************/

async function getAssetInfo(assetName) {
    const releaseInfo = await getReleaseInfo();
    if ( releaseInfo === undefined ) { return; }
    if ( releaseInfo.assets === undefined ) { return; }
    for ( const asset of releaseInfo.assets ) {
        if ( asset.name.includes(assetName) ) { return asset; }
    }
}

/******************************************************************************/

async function downloadAssetFromRelease(assetInfo) {
    const assetURL = assetInfo.url;
    console.log(`Fetching ${assetURL}`);
    const request = new Request(assetURL, {
        headers: {
            Authorization: githubAuth,
            Accept: 'application/octet-stream',
        },
    });
    const response = await fetch(request).catch(voidFunc);
    if ( response.ok !== true ) { return; }
    const data = await response.bytes().catch(voidFunc);
    if ( data === undefined ) { return; }
    const tempDir = await fs.mkdtemp('/tmp/github-asset-');
    const fileName = `${tempDir}/${assetInfo.name}`;
    await fs.writeFile(fileName, data);
    return fileName;
}

/******************************************************************************/

async function uploadAssetToRelease(assetPath, mimeType) {
    console.log(`Uploading "${assetPath}" to GitHub...`);
    const data = await fs.readFile(assetPath).catch(( ) => { });
    if ( data === undefined ) { return; }
    const releaseInfo = await getReleaseInfo();
    if ( releaseInfo.upload_url === undefined ) { return; }
    const assetName = path.basename(assetPath);
    const uploadURL = releaseInfo.upload_url.replace('{?name,label}', `?name=${assetName}`);
    console.log('Upload URL:', uploadURL);
    const request = new Request(uploadURL, {
        body: new Int8Array(data.buffer, data.byteOffset, data.length),
        headers: {
            Authorization: githubAuth,
            'Content-Type': mimeType,
        },
        method: 'POST',
    });
    const response = await fetch(request).catch(( ) => { });
    if ( response === undefined ) { return; }
    const json = await response.json();
    console.log(json);
    return json;
}

/******************************************************************************/

async function deleteAssetFromRelease(assetURL) {
    print(`Remove ${assetURL} from GitHub release ${githubTag}...`);
    const request = new Request(assetURL, {
        headers: {
            Authorization: githubAuth,
        },
        method: 'DELETE',
    });
    const response = await fetch(request);
    return response.ok;
}

/******************************************************************************/

async function getManifest(path) {
    const text = await fs.readFile(path, { encoding: 'utf8' });
    return JSON.parse(text);
}

/******************************************************************************/

// Project version is the number of 1-hour slices since first build

function patchProjectVersion(manifest, text) {
    const originDate = new Date('2022-09-06T17:47:52.000Z');
    const buildDate = Date.now();
    const elapsedMinutes = Math.floor(
        (buildDate - originDate.getTime()) / (60 * 1000)
    );
    const major = Math.floor(elapsedMinutes / (24 * 60));
    const minor = elapsedMinutes % (24 * 60);
    return text.replaceAll(/\bCURRENT_PROJECT_VERSION = [^;]*;/g,
        `CURRENT_PROJECT_VERSION = ${major}.${minor};`
    );
}

function patchMarketingVersion(manifest, text) {
    return text.replaceAll(/\bMARKETING_VERSION = [^;]*;/g,
        `MARKETING_VERSION = ${manifest.version};`
    );
}

async function patchXcodeVersion(manifest, xcprojPath) {
    let text = await fs.readFile(xcprojPath, { encoding: 'utf8' });
    text = patchMarketingVersion(manifest, text);
    text = patchProjectVersion(manifest, text);
    await fs.writeFile(xcprojPath, text);
}

/******************************************************************************/

async function shellExec(text) {
    let command = '';
    let r;
    for ( const line of text.split(/[\n\r]+/) ) {
        command += line.trimEnd();
        if ( command.endsWith('\\') ) {
            command = command.slice(0, -1);
            continue;
        }
        command = command.trim();
        if ( command === '' ) { continue; }
        r = execSync(command, { encoding: 'utf8' });
        command = '';
    }
    return r?.trim();
}

/******************************************************************************/

const commandLineArgs = (( ) => {
    const args = Object.create(null);
    let name, value;
    for ( const arg of process.argv.slice(2) ) {
        const pos = arg.indexOf('=');
        if ( pos === -1 ) {
            name = arg;
            value = true;
        } else {
            name = arg.slice(0, pos);
            value = arg.slice(pos+1);
        }
        args[name] = value;
    }
    return args;
})();

/******************************************************************************/

const githubOwner = commandLineArgs.ghowner || 'uBlockOrigin';
const githubRepo = commandLineArgs.ghrepo || 'uBOL-home';
const githubToken = await getSecret('github_token');
const githubAuth = `Bearer ${githubToken}`;
const githubTag = commandLineArgs.ghtag;
const localRepoRoot = await getRepoRoot() || '';
const githubAsset = commandLineArgs.asset || 'safari';

async function main() {
    if ( githubOwner === '' ) { return 'Need GitHub owner'; }
    if ( githubRepo === '' ) { return 'Need GitHub repo'; }
    if ( localRepoRoot === '' ) { return 'Need local repo root'; }
    if ( githubAsset === undefined ) { return 'Need asset=[...]'; }

    const assetInfo = await getAssetInfo(githubAsset);

    console.log(`GitHub owner: "${githubOwner}"`);
    console.log(`GitHub repo: "${githubRepo}"`);
    console.log(`Release tag: "${githubTag}"`);
    console.log(`Release asset: "${assetInfo.name}"`);
    console.log(`Local repo root: "${localRepoRoot}"`);

    // Fetch asset from GitHub repo
    const assetName = path.basename(assetInfo.name, path.extname(assetInfo.name));
    const filePath = await downloadAssetFromRelease(assetInfo);
    console.log('Asset saved at', filePath);
    const tempdirPath = path.dirname(filePath);
    await fs.mkdir(`${tempdirPath}/${assetName}`, { recursive: true });
    shellExec(`unzip "${filePath}" -d "${tempdirPath}/${assetName}"`);

    // Copy files to local build directory
    console.log(`Copy package files to "${localRepoRoot}/build/uBOLite.safari"`);
    shellExec(`
        rm -rf "${localRepoRoot}/build/uBOLite.safari"
        mkdir -p "${localRepoRoot}/build/uBOLite.safari"
        cp -R "${tempdirPath}/${assetName}/"* "${localRepoRoot}/build/uBOLite.safari/"
    `);

    const xcodeDir = `${localRepoRoot}/dist/safari/xcode`;

    const manifestPath = `${localRepoRoot}/build/uBOLite.safari/manifest.json`;
    console.log('Read manifest', manifestPath);
    const manifest = await getManifest(manifestPath);

    // Patch xcode version, build number
    console.log('Patch xcode project with manifest version');
    const xcprojDir = `${xcodeDir}/uBlock Origin Lite.xcodeproj`;
    await patchXcodeVersion(manifest, `${xcprojDir}/project.pbxproj`);

    // xcodebuild ... archive
    const buildNamePrefix = `uBOLite_${manifest.version}`;

    // Build for iOS
    if ( commandLineArgs.ios ) {
        console.log(`Building archive ${buildNamePrefix}.ios`);
        shellExec(`xcodebuild clean archive \\
            -configuration release \\
            -destination 'generic/platform=iOS' \\
            -project "${xcprojDir}" \\
            -scheme "uBlock Origin Lite (iOS)" \\
        `);
        if ( commandLineArgs.publish === 'github' ) {
            console.log(`Building app from ${buildNamePrefix}.ios.xarchive`);
            shellExec(`xcodebuild -exportArchive \\
                -archivePath "${tempdirPath}/${buildNamePrefix}.ios.xcarchive" \\
                -exportPath "${tempdirPath}/${buildNamePrefix}.ios" \\
                -exportOptionsPlist "${xcodeDir}/exportOptionsAdHoc.ios.plist" \\
            `);
        }
    }

    // Build for MacOS
    if ( commandLineArgs.macos ) {
        console.log(`Building archive ${buildNamePrefix}.macos`);
        shellExec(`xcodebuild clean archive \\
            -configuration release \\
            -destination 'generic/platform=macOS' \\
            -project "${xcprojDir}" \\
            -scheme "uBlock Origin Lite (macOS)" \\
        `);
        //console.log(`Building app from ${buildNamePrefix}.macos.xarchive`);
        //shellExec(`xcodebuild -exportArchive \\
        //    -archivePath "${tempdirPath}/${buildNamePrefix}.macos.xcarchive" \\
        //    -exportPath "${tempdirPath}/${buildNamePrefix}.macos" \\
        //    -exportOptionsPlist "${xcodeDir}/exportOptionsAdHoc.macos.plist" \\
        //`);
        if ( commandLineArgs.publish === 'github' ) {
            shellExec(`cd "${tempdirPath}" && zip -r \\
                "${buildNamePrefix}.macos.zip" \\
                "${buildNamePrefix}.macos"/* \\
            `);
            await uploadAssetToRelease(`${tempdirPath}/${buildNamePrefix}.macos.zip`, 'application/zip');
            await deleteAssetFromRelease(assetInfo.url);
        }
    }

    // Clean up
    if ( commandLineArgs.nocleanup !== true ) {
        console.log(`Removing ${tempdirPath}`);
        shellExec(`rm -rf "${tempdirPath}"`);
    }

    console.log('Done');
}

main().then(result => {
    if ( result !== undefined ) {
        console.log(result);
        process.exit(1);
    }
    process.exit(0);
});
