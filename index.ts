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
  const command = new SendCommandCommand({
    TimeoutSeconds,
    Targets: JSON.parse(core.getInput('targets')),
    DocumentName: core.getInput('document-name'),
    Parameters: JSON.parse(core.getInput('parameters')),
  });
  if (core.isDebug()) {
    core.debug(JSON.stringify(command));
  }
  const result = await client.send(command);
  const CommandId = result.Command?.CommandId;
  core.setOutput('command-id', CommandId);
  
  const int32 = new Int32Array(new SharedArrayBuffer(4));
  const outputs = [];
  for (let i = 0; i < TimeoutSeconds; i++) {
    Atomics.wait(int32, 0, 0, 1000);
    const result = await client.send(new ListCommandInvocationsCommand({CommandId, Details: true}));
    const invocation = result.CommandInvocations?.[0] || {};
    if (['Success', 'Failure'].includes(invocation.Status as string)) {
      for (const cp of invocation.CommandPlugins || []) {
        outputs.push(cp.Output as string);
      }
      core.setOutput('status', invocation.Status);
      break;
    }
  }
  core.setOutput('output', outputs.join('\n'));
}
main().catch(e => core.setFailed(e.message));

export default main;