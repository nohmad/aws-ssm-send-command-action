import * as core from '@actions/core';
import { SSMClient, SendCommandCommand, ListCommandInvocationsCommand } from '@aws-sdk/client-ssm';

import main from './index';

jest.mock('@actions/core');
jest.mock('@aws-sdk/client-ssm');

const MockedClient = SSMClient as jest.Mocked<typeof SSMClient>;
const MockedSendCommand = SendCommandCommand as jest.Mocked<typeof SendCommandCommand>;
const getInput = core.getInput as jest.MockedFunction<typeof core.getInput>;

const DEFAULT_INPUTS = new Map([
  ['aws-access-key-id', 'aws-access-key-id'],
  ['aws-secret-access-key', 'aws-secret-access-key'],
  ['aws-region', 'aws-region'],
  ['timeout', '60'],
  ['targets', '[{"Key":"InstanceIds","Values":["i-1234567890"]}]'],
  ['document-name', 'AWS-RunShellScript'],
  ['parameters', '{"commands":["ls -al"]}'],
]); // order is important

describe("aws-ssm-send-command-action", () => {
  beforeEach(() => {
    getInput.mockImplementation((key) => DEFAULT_INPUTS.get(key) as string);
  });

  it("set successful outputs if the status is Success", async () => {
    const CommandId = 'CommandId', Status = 'Success', Output = 'Output';
    const send = jest.fn((arg) => {
      if (arg instanceof SendCommandCommand) {
        return {Command: {CommandId}};
      } else {
        return {CommandInvocations: [{Status, CommandPlugins: [{Status, Output}]}]}
      }
    });
    (MockedClient as jest.Mock).mockImplementation(() => ({send}));

    await main();

    const {calls} = send.mock;
    expect(calls[0][0].constructor).toBe(SendCommandCommand);
    expect(calls[1][0].constructor).toBe(ListCommandInvocationsCommand);
    const command = (MockedSendCommand as jest.Mock).mock.calls[0][0];
    expect(command.Targets).toEqual(JSON.parse(DEFAULT_INPUTS.get('targets') as string));
    expect(command.DocumentName).toEqual(DEFAULT_INPUTS.get('document-name') as string);
    expect(command.Parameters).toEqual(JSON.parse(DEFAULT_INPUTS.get('parameters') as string));
    expect(core.setOutput).toHaveBeenCalledWith('status', 'Success');
  });

  it("waits and retries until the status is not InProgress", async () => {
    const CommandId = 'CommandId', Output = 'Output';
    let Status = 'InProgress';
    let attempts = 0;
    const send = jest.fn((arg) => {
      if (arg instanceof SendCommandCommand) {
        return {Command: {CommandId}};
      } else {
        if (attempts == 0) {
          attempts += 1;
          return {CommandInvocations: [{Status, CommandPlugins: [{Status, Output}]}]};
        }
        Status = 'Success';
        return {CommandInvocations: [{Status, CommandPlugins: [{Status, Output}]}]};
      }
    });
    (MockedClient as jest.Mock).mockImplementation(() => ({send}));

    await main();

    expect(send).toHaveBeenCalledTimes(3);
    expect(core.setOutput).toHaveBeenCalledWith('status', 'Success')
  });
});