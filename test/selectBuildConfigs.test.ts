/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { Position, Range, TextDocumentContentProvider, Uri, workspace } from 'vscode';
import { BuildConfig, tryGetSelection } from "../extension.bundle";

interface ISelectBuildConfigTestCase {
    workflow: string;
    buildConfig: BuildConfig;
    expectedSelection: undefined | {
        line: number;
        startChar: number;
        endChar: number;
    }
}

suite('Select Build Configurations in GitHub Workflow Files', () => {
    const testCases: ISelectBuildConfigTestCase[] = [
        { workflow: 'workflowSimple', buildConfig: 'api_location', expectedSelection: { line: 30, startChar: 24, endChar: 26 } },
        { workflow: 'workflowSimple', buildConfig: 'app_location', expectedSelection: { line: 29, startChar: 24, endChar: 27 } },
        { workflow: 'workflowSimple', buildConfig: 'output_location', expectedSelection: { line: 31, startChar: 27, endChar: 29 } },
        { workflow: 'workflowSimple', buildConfig: 'app_artifact_location', expectedSelection: undefined },

        { workflow: 'workflowOld', buildConfig: 'api_location', expectedSelection: { line: 30, startChar: 24, endChar: 39 } },
        { workflow: 'workflowOld', buildConfig: 'app_location', expectedSelection: { line: 29, startChar: 24, endChar: 57 } },
        { workflow: 'workflowOld', buildConfig: 'output_location', expectedSelection: { line: 31, startChar: 27, endChar: 54 } },
        { workflow: 'workflowOld', buildConfig: 'app_artifact_location', expectedSelection: undefined },

        { workflow: 'workflowDuplicates', buildConfig: 'api_location', expectedSelection: { line: 30, startChar: 24, endChar: 29 } },
        { workflow: 'workflowDuplicates', buildConfig: 'app_location', expectedSelection: { line: 29, startChar: 24, endChar: 29 } },
        { workflow: 'workflowDuplicates', buildConfig: 'output_location', expectedSelection: undefined },
        { workflow: 'workflowDuplicates', buildConfig: 'app_artifact_location', expectedSelection: { line: 31, startChar: 33, endChar: 38 } },

        { workflow: 'workflowComplete', buildConfig: 'api_location', expectedSelection: undefined },
        { workflow: 'workflowComplete', buildConfig: 'app_location', expectedSelection: undefined },
        { workflow: 'workflowComplete', buildConfig: 'output_location', expectedSelection: undefined },
        { workflow: 'workflowComplete', buildConfig: 'app_artifact_location', expectedSelection: undefined },
    ];

    const workflowProvider = new (class implements TextDocumentContentProvider {
        provideTextDocumentContent(uri: Uri): string {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return workflowFiles[uri.path];
        }
    })();

    const scheme: string = 'workflowTest';
    workspace.registerTextDocumentContentProvider(scheme, workflowProvider);

    for (const testCase of testCases) {
        const title: string = `${testCase.workflow}: ${testCase.buildConfig}`;

        test(title, async () => {
            const workflowUri: Uri = {
                path: testCase.workflow,
                authority: '',
                query: '',
                fsPath: '',
                fragment: '',
                with: () => Uri.file('test'),
                toJSON: () => '',
                scheme
            }

            const configDocument = await workspace.openTextDocument(workflowUri);
            const selection: Range | undefined = await tryGetSelection(configDocument, testCase.buildConfig);
            let expectedSelection: Range | undefined;

            if (testCase.expectedSelection) {
                const expectedStart: Position = new Position(testCase.expectedSelection.line, testCase.expectedSelection.startChar);
                const expectedEnd: Position = new Position(testCase.expectedSelection.line, testCase.expectedSelection.endChar);
                expectedSelection = new Range(expectedStart, expectedEnd);
            }

            assert.ok(expectedSelection && selection?.isEqual(expectedSelection) || selection === expectedSelection, 'Actual and expected selections do not match');
        });
    }
});

const workflowSimple: string = `jobs:
  build_and_deploy_job:
    steps:
        with:
          app_location: "/"
          api_location: ""
          output_location: ""
`;

const workflowOld: string = `jobs:
  build_and_deploy_job:
    steps:
        with:
          app_location: "app/location"
          api_location: 'api/location'
          app_artifact_location: app/artifact/location
`;

const workflowDuplicates: string = `jobs:
  build_and_deploy_job1:
    steps:
        with:
          app_location: "src"
          api_location: "api"
          output_location: "build"

  build_and_deploy_job2:
    steps:
        with:
          app_location: "src"
          api_location: "api"
          output_location: "build"
`;

const workflowComplete: string = `name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - master
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - master

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v0.0.1-preview
        with:
          azure_static_web_apps_api_token: $\{{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_AMBITIOUS_ROCK_0D992521E }}
          repo_token: $\{{ secrets.GITHUB_TOKEN }} # Used for Github integrations (i.e. PR comments)
          action: "upload"
          ###### Repository/Build Configurations - These values can be configured to match your app requirements. ######
          # For more information regarding Static Web App workflow configurations, please visit: https://aka.ms/swaworkflowconfig
          app_location: "super/long/path/to/app/location"		# There are tabs before this comment
          api_location: 'single/quotes'                         #There are spaces before this comment
          output_location: output/location with/spaces # There is a single space before this comment
          ###### End of Repository/Build Configurations ######

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v0.0.1-preview
        with:
          azure_static_web_apps_api_token: $\{{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_AMBITIOUS_ROCK_0D992521E }}
          action: "close"

`;

const workflowFiles = {
    workflowSimple,
    workflowOld,
    workflowDuplicates,
    workflowComplete
};
