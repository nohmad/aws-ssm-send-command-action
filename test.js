const { SSMClient, SendCommandCommand, ListCommandInvocationsCommand } = require('@aws-sdk/client-ssm');

async function main() {
  const client = new SSMClient({region: 'ap-northeast-2'});
  const command = new SendCommandCommand({
    Targets: [{Key: "tag:Name", Values: ["front-staging"]}],
    DocumentName: 'AWS-RunShellScript',
    Parameters: {"commands": [
              "#!/bin/bash",
              "sudo su - ubuntu",
              "docker service update --detach --force --with-registry-auth --update-failure-action rollback \\",
              "  front_backoffice",
              "docker system prune -f"
    ]},
  });
  const result = await client.send(command);
  console.log(result);
  const CommandId = result.Command?.CommandId;
  
  const int32 = new Int32Array(new SharedArrayBuffer(4));
  for (let i = 0; i < 60; i++) {
    Atomics.wait(int32, 0, 0, 1000);
    const result = await client.send(new ListCommandInvocationsCommand({CommandId, Details: true}));
    const invocation = result.CommandInvocations?.[0] || {};
    if (invocation.Status != 'InProgress') {
      for (const cp of invocation.CommandPlugins || []) {
        if (cp?.Status == 'Success') {
          console.info(cp.Output);
        } else {
          console.error(cp.Output);
        }
      }
      break;
    }
  }
}

(async function() {
  await main();
})();
