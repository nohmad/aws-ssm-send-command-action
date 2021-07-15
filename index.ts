import { SSMClient, SendCommandCommand, ListCommandInvocationsCommand } from '@aws-sdk/client-ssm';
import * as core from '@actions/core';

async function main() {
  const credentials = {
    accessKeyId: core.getInput('aws-access-key-id'),
    secretAccessKey: core.getInput('aws-secret-access-key'),
  };
  const region = core.getInput('aws-region');
  const client = new SSMClient({region, credentials});
  const TimeoutSeconds = parseInt(core.getInput('timeout'));
  const parameters = core.getInput('parameters', {required: true});
  const command = new SendCommandCommand({
    TimeoutSeconds,
    Targets: JSON.parse(core.getInput('targets', {required: true})),
    DocumentName: core.getInput('document-name'),
    Parameters: JSON.parse(parameters),
  });
  if (core.isDebug()) {
    core.debug(parameters);
    core.debug(JSON.stringify(command));
  }
  const result = await client.send(command);
  const CommandId = result.Command?.CommandId;
  core.setOutput('command-id', CommandId);
  
  const int32 = new Int32Array(new SharedArrayBuffer(4));
  const outputs = [];
  let status = 'Pending';
  for (let i = 0; i < TimeoutSeconds; i++) {
    Atomics.wait(int32, 0, 0, 1000);
    const result = await client.send(new ListCommandInvocationsCommand({CommandId, Details: true}));
    const invocation = result.CommandInvocations?.[0] || {};
    status = invocation.Status as string;
    if (['Success', 'Failure'].includes(status)) {
      for (const cp of invocation.CommandPlugins || []) {
        outputs.push(cp.Output as string);
      }
      break;
    }
  }
  if (status != 'Success') {
    throw new Error(`Failed to send command: ${status}`);
  }
  core.setOutput('status', status);
  core.setOutput('output', outputs.join('\n'));
}
main().catch(e => core.setFailed(e.message));

export default main;