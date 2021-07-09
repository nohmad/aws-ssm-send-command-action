import { SSMClient, SendCommandCommand, Target, ListCommandInvocationsCommand } from '@aws-sdk/client-ssm';
import * as core from '@actions/core';

function getInputTargets(): [Target] {
  const targets = core.getInput('targets');
  const Key = targets.match(/^Key=([^,]+),/)?.[1];
  const Values = targets.match(/,Values=(.+)$/)?.[1].split(',');
  return [{Key, Values}];
}

function getInputParameters() {
  const parameters = core.getInput('parameters');
  const key = parameters.match(/([^=]+)=/)?.[1] as string;
  const values = JSON.parse(parameters.match(/=(.+)$/)?.[1] || '[]') as [];
  return {[key]: values};
}

async function main() {
  const credentials = {
    accessKeyId: core.getInput('aws-access-key-id'),
    secretAccessKey: core.getInput('aws-secret-access-key'),
  };
  const region = core.getInput('aws-region');
  const client = new SSMClient({region, credentials});
  const TimeoutSeconds = parseInt(core.getInput('timeout'));
  const command = new SendCommandCommand({
    TimeoutSeconds,
    Targets: getInputTargets(),
    DocumentName: core.getInput('document-name'),
    Parameters: getInputParameters(),
  });
  const result = await client.send(command);
  const CommandId = result.Command?.CommandId;
  
  const int32 = new Int32Array(new SharedArrayBuffer(4))
  for (let i = 0; i < TimeoutSeconds; i++) {
    Atomics.wait(int32, 0, 0, 1000);
    const result = await client.send(new ListCommandInvocationsCommand({CommandId, Details: true}));
    const invocation = result.CommandInvocations?.[0] || {};
    if (invocation.Status == 'InProgress') {
      continue;
    } else {
      core.setOutput('status', invocation.CommandPlugins?.[0].Status);
      core.setOutput('output', invocation.CommandPlugins?.[0].Output);
      break;
    }
  }
}
// main().catch(e => core.setFailed(e.message));

export default main;