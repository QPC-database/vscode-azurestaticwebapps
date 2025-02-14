/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WebSiteManagementModels } from "@azure/arm-appservice";
import { Progress } from "vscode";
import { AzureWizardExecuteStep, LocationListStep } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { nonNullProp, nonNullValueAndProp } from "../../utils/nonNull";
import { IStaticWebAppWizardContext } from "./IStaticWebAppWizardContext";

export class StaticWebAppCreateStep extends AzureWizardExecuteStep<IStaticWebAppWizardContext> {
    public priority: number = 250;

    public async execute(wizardContext: IStaticWebAppWizardContext, progress: Progress<{ message?: string | undefined; increment?: number | undefined }>): Promise<void> {
        const newName: string = nonNullProp(wizardContext, 'newStaticWebAppName');
        const branchData = nonNullProp(wizardContext, 'branchData');
        const siteEnvelope: WebSiteManagementModels.StaticSiteARMResource = {
            repositoryUrl: wizardContext.repoHtmlUrl,
            branch: branchData.name,
            repositoryToken: wizardContext.accessToken,
            // The SDK hasn't updated to reflect the outputLocation property and platform will continue supporting appArtifactLocation, but will update as soon as available
            buildProperties: {
                appLocation: wizardContext.appLocation,
                apiLocation: wizardContext.apiLocation,
                appArtifactLocation: wizardContext.outputLocation
            },
            sku: wizardContext.sku,
            location: (await LocationListStep.getLocation(wizardContext)).name
        };

        const creatingSwa: string = localize('creatingSwa', 'Creating new static web app "{0}"...', newName);
        progress.report({ message: creatingSwa });
        ext.outputChannel.appendLog(creatingSwa);
        wizardContext.staticWebApp = await wizardContext.client.staticSites.createOrUpdateStaticSite(nonNullValueAndProp(wizardContext.resourceGroup, 'name'), newName, siteEnvelope);
    }

    public shouldExecute(_wizardContext: IStaticWebAppWizardContext): boolean {
        return true;
    }
}
