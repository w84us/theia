// @ts-check
'use-strict';

/********************************************************************************
 * Copyright (C) 2021 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

/*
 * Translates the array based monaco localizations into key-value pair based localizations
 * Call this script like this from the root directory:
 * 
 * node scripts/translate-monaco.js examples/browser/lib/vs/editor/editor.main.nls.js <localization.json> packages/monaco/data/monaco-nls.json
 * 
 * It is vital that the script targets the english monaco nls.js file.
 * The <localization.json> is a translation file compatible with the used monaco version.
 * With monaco 0.23, the compatible translations can be found in this repo:
 * https://github.com/microsoft/vscode-loc/tree/1fe01ec761f24c40bb5a2d081889eb34c8d523de
 * 
 * Change the commit hash as necessary when upgrading monaco
 */

const fs = require('fs');

console.log(JSON.stringify(process.argv));

const monacoInputStart = 'define("vs/editor/editor.main.nls", ';
let monacoFile = fs.readFileSync(process.argv[2], 'utf8');
monacoFile = monacoFile.substring(monacoFile.indexOf(monacoInputStart) + monacoInputStart.length, monacoFile.length - 2);

const monacoInput = JSON.parse(monacoFile);
const i18nInput = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const outputFile = process.argv[4];
const outputContent = {};

// The following objects are translation items that cannot be successfully translated by the duplication algorithm
// Therefore they are deduplicated explicitely

const keybindingLabels = {
    'ctrlKey': 'Ctrl', // 0
    'shiftKey': 'Shift', // 1
    'altKey': 'Alt', // 2
    'windowsKey': 'Windows', // 3
    '_duplicate/0': 'Ctrl', // 4
    '_duplicate/1': 'Shift', // 5
    '_duplicate/2': 'Alt', // 6
    'superKey': 'Super', // 7
    'ctrlKey.long': 'Control', // 8
    'shiftKey.long': 'Shift', // 9
    'altKey.long': 'Alt', // 10
    'cmdKey.long': 'Command', // 11
    '_duplicate/8': 'Control', // 12
    '_duplicate/9': 'Shift', // 13
    '_duplicate/10': 'Alt', // 14
    'windowsKey.long': 'Windows', // 15
    '_duplicate/12': 'Control', // 16
    '_duplicate/13': 'Shift', // 17
    '_duplicate/14': 'Alt', // 18
    'superKey.long': 'Super' // 19
}

const findWidgets = {
    'findSelectionIcon': 'Icon for \'Find in Selection\' in the editor find widget.',
    'findCollapsedIcon': 'Icon to indicate that the editor find widget is collapsed.',
    'findExpandedIcon': 'Icon to indicate that the editor find widget is expanded.',
    'findReplaceIcon': 'Icon for \'Replace\' in the editor find widget.',
    'findReplaceAllIcon': 'Icon for \'Replace All\' in the editor find widget.',
    'findPreviousMatchIcon': 'Icon for \'Find Previous\' in the editor find widget.',
    'findNextMatchIcon': 'Icon for \'Find Next\' in the editor find widget.',
    'label.find': 'Find',
    'placeholder.find': 'Find',
    'label.previousMatchButton': 'Previous match',
    'label.nextMatchButton': 'Next match',
    'label.toggleSelectionFind': 'Find in selection',
    'label.closeButton': 'Close',
    'label.replace': 'Replace',
    'placeholder.replace': 'Replace',
    'label.replaceButton': 'Replace',
    'label.replaceAllButton': 'Replace All',
    'label.toggleReplaceButton': 'Toggle Replace mode',
    'title.matchesCountLimit': 'Only the first {0} results are highlighted, but all find operations work on the entire text.',
    'label.matchesLocation': '{0} of {1}',
    'label.noResults': 'No results',
    'ariaSearchNoResultEmpty': '{0} found',
    'ariaSearchNoResult': '{0} found for \'{1}\'',
    'ariaSearchNoResultWithLineNum': '{0} found for \'{1}\', at {2}',
    'ariaSearchNoResultWithLineNumNoCurrentMatch': '{0} found for \'{1}\'',
    'ctrlEnter.keybindingChanged': 'Ctrl+Enter now inserts line break instead of replacing all. You can modify the keybinding for editor.action.replaceAll to override this behavior.'
}

const manualItems = {
    'vs/base/common/keybindingLabels': keybindingLabels,
    'vs/editor/contrib/find/findWidget': findWidgets
}

const i18nContents = i18nInput.contents;

for (const [key, original] of Object.entries(monacoInput)) {
    const i18nContent = i18nContents[key];
    if (!i18nContent) {
        console.error(`Entry for '${key}' does not exist in specified i18n file.`);
        process.exit(1);
    }
    console.log(`translating: '${key}' with ${original.length} items.`);
    if (key in manualItems) {
        outputContent[key] = manualItems[key];
        continue;
    }
    const output = outputContent[key] = {};
    const translationKeys = Object.keys(i18nContent);
    let translationIndex = 0;
    // We have to correctly deal with duplicates here
    /** @type {Map<string, number>} */
    const duplicateMap = new Map();
    for (let i = 0; i < original.length; i++) {
        /** @type {string} */
        const originalValue = original[i];
        if (duplicateMap.has(originalValue)) {
            const index = duplicateMap.get(originalValue);
            output[`_duplicate/${index}`] = originalValue;
            duplicateMap.set(originalValue, i);
        } else {
            output[translationKeys[translationIndex++]] = originalValue;
            duplicateMap.set(originalValue, i);
        }
    }

    if (Object.keys(output).length !== original.length) {
        console.error(`Entry for '${key}' contains ${Object.keys(output).length} entries. Expected ${original.length}`);
        console.log(JSON.stringify(output));
        process.exit(1);
    }
}

fs.writeFileSync(outputFile, JSON.stringify(outputContent, undefined, 4));
