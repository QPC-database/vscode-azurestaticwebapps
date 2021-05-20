/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as fse from 'fs-extra';
import { join } from 'path';
import { Uri } from "vscode";
import { parseError } from 'vscode-azureextensionui';
import { getGitWorkspaceState, GitWorkspaceState, promptForDefaultBranch, verifyGitWorkspaceForCreation } from "../extension.bundle";
import { createTestActionContext, testUserInput, testWorkspacePath } from "./global.test";

suite('Workspace Configurations for SWA Creation', function (this: Mocha.Suite): void {
    this.timeout(120 * 1000);

    test('Empty workspace with no git repository', async () => {
        const context = createTestActionContext();
        const testFolderUri: Uri = Uri.file(testWorkspacePath);
        const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, testFolderUri)
        try {
            await verifyGitWorkspaceForCreation(context, gitWorkspaceState, testFolderUri)
        } catch (err) {
            const pError = parseError(err);
            assert.strictEqual(pError.message, 'Cannot create a Static Web App with an empty workspace.')
        }
    });

    test('Workspace with no git repository', async () => {
        const context = createTestActionContext();
        await fse.writeFile(join(testWorkspacePath, 'test.txt'), 'Test');
        const testFolderUri: Uri = Uri.file(testWorkspacePath);

        const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, testFolderUri);
        assert.strictEqual(gitWorkspaceState.repo, null, `Workspace contained a repository prior to test "${gitWorkspaceState.repo?.rootUri.fsPath}"`);
        const testCommitMsg: string = 'Test commit';
        await testUserInput.runWithInputs(['Create', testCommitMsg], async () => {
            await verifyGitWorkspaceForCreation(context, gitWorkspaceState, testFolderUri);
            assert.ok(gitWorkspaceState.repo, 'Repo did not successfully initialize')
        });

    });

    test('Workspace on default branch', async () => {
        await testUserInput.runWithInputs([], async () => {
            const context = createTestActionContext();
            const testFolderUri: Uri = Uri.file(testWorkspacePath);

            const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, testFolderUri);
            if (!gitWorkspaceState.repo) {
                throw new Error('Could not retrieve git repository.');
            }

            // shouldn't prompt
            await promptForDefaultBranch(context, gitWorkspaceState.repo);
        });
    });

    test('Workspace not on default branch', async () => {
        await testUserInput.runWithInputs(['Checkout "master"'], async () => {
            const context = createTestActionContext();
            const testFolderUri: Uri = Uri.file(testWorkspacePath);

            const gitWorkspaceState: GitWorkspaceState = await getGitWorkspaceState(context, testFolderUri);
            if (!gitWorkspaceState.repo) {
                throw new Error('Could not retrieve git repository.');
            }

            await gitWorkspaceState.repo.createBranch('test', true);
            await promptForDefaultBranch(context, gitWorkspaceState.repo);
        });
    });
});
