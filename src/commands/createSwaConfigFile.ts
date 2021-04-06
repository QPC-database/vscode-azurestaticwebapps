/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { writeFile } from 'fs-extra';
import { join } from 'path';
import { EntryInfo, promise } from 'readdirp';
import { TextDocument, Uri, window, workspace } from 'vscode';
import { IActionContext } from 'vscode-azureextensionui';
import { configFileName } from '../constants';
import { EnvironmentTreeItem } from "../tree/EnvironmentTreeItem";
import { localize } from '../utils/localize';
import { getSingleRootFsPath } from "../utils/workspaceUtils";

export async function createSwaConfigFile(_context: IActionContext, _treeItem: EnvironmentTreeItem): Promise<void> {
    // TODO: get local path from treeItem
    const localPath: string | undefined = getSingleRootFsPath();

    const swaConfigFilePath: string | undefined = localPath && await getSwaConfigFilePath(localPath);
    if (swaConfigFilePath) {
        throw new Error(localize('configFileExists', 'Configuration file "{0}" already exists.', swaConfigFilePath));
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const newConfigFilePath: string = join(localPath!, configFileName);
    await writeFile(newConfigFilePath, exampleConfigFile);
    const textDocument: TextDocument = await workspace.openTextDocument(Uri.file(newConfigFilePath));
    await window.showTextDocument(textDocument);
}

async function getSwaConfigFilePath(localPath: string): Promise<string | undefined> {
    const entries: EntryInfo[] = await promise(localPath, { fileFilter: configFileName });
    return entries.length && entries[0].fullPath || undefined;
}

// Source: https://docs.microsoft.com/azure/static-web-apps/configuration#example-configuration-file
const exampleConfigFile: string = `{
    "routes": [
        {
            "route": "/profile",
            "allowedRoles": ["authenticated"]
        },
        {
            "route": "/admin/*",
            "allowedRoles": ["administrator"]
        },
        {
            "route": "/images/*",
            "headers": {
                "cache-control": "must-revalidate, max-age=15770000"
            }
        },
        {
            "route": "/api/*",
            "methods": [ "GET" ],
            "allowedRoles": ["registeredusers"]
        },
        {
            "route": "/api/*",
            "methods": [ "PUT", "POST", "PATCH", "DELETE" ],
            "allowedRoles": ["administrator"]
        },
        {
            "route": "/api/*",
            "allowedRoles": ["authenticated"]
        },
        {
            "route": "/customers/contoso",
            "allowedRoles": ["administrator", "customers_contoso"]
        },
        {
            "route": "/login",
            "rewrite": "/.auth/login/github"
        },
        {
            "route": "/.auth/login/twitter",
            "statusCode": 404
        },
        {
            "route": "/logout",
            "redirect": "/.auth/logout"
        },
        {
            "route": "/calendar/*",
            "rewrite": "/calendar.html"
        },
        {
            "route": "/specials",
            "redirect": "/deals",
            "statusCode": 301
        }
    ],
    "navigationFallback": {
      "rewrite": "index.html",
      "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
    },
    "responseOverrides": {
        "400" : {
            "rewrite": "/invalid-invitation-error.html"
        },
        "401": {
            "redirect": "/login",
            "statusCode": 302
        },
        "403": {
            "rewrite": "/custom-forbidden-page.html"
        },
        "404": {
            "rewrite": "/404.html"
        }
    },
    "globalHeaders": {
        "content-security-policy": "default-src https: 'unsafe-eval' 'unsafe-inline'; object-src 'none'"
    },
    "mimeTypes": {
        ".json": "text/json"
    }
}`;
