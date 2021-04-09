/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { writeFile } from "fs-extra";
import { join } from "path";
import { EntryInfo, promise } from "readdirp";
import { TextDocument, Uri, window, workspace } from "vscode";
import { configFileName } from "../constants";
import { localize } from "../utils/localize";
import { getSingleRootFsPath } from "../utils/workspaceUtils";

export async function addRoutes(): Promise<void> {
    const localProjectPath: string | undefined = getSingleRootFsPath();
    if (!localProjectPath) {
        throw new Error(localize('mustHaveWorkspaceOpen', 'You must have a workspace open to add routes.'));
    }

    const configFilePath: string | undefined = await getConfigFile(localProjectPath);
    if (configFilePath) {
        // TODO: Open existing config file?
        throw new Error(localize('configFileAlreadyExists', 'Configuration file "{0}" already exists.', configFilePath));
    }

    const newConfigFilePath: string = join(localProjectPath, configFileName);
    await writeFile(newConfigFilePath, defaultConfigFile);
    const textDocument: TextDocument = await workspace.openTextDocument(Uri.file(newConfigFilePath));
    await window.showTextDocument(textDocument);
}

async function getConfigFile(localProjectPath: string): Promise<string | undefined> {
    const entries: EntryInfo[] = await promise(localProjectPath, { fileFilter: configFileName });
    return entries.length && entries[0].fullPath || undefined;
}

// Created from snippets provided by https://json.schemastore.org/staticwebapp.config.json
const defaultConfigFile: string = `{
    "routes": [
        {
            "route": "/example",
            "rewrite": "/example.html"
        }
    ],
    "navigationFallback": {
        "rewrite": "/index.html"
    }
}`;
