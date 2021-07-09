import * as core from '@actions/core';
import { SendCommandCommand, SSMClient } from '@aws-sdk/client-ssm';

import main from './index';

jest.mock('@actions/core');
jest.mock('@aws-sdk/client-ssm');

const MockedClient = SSMClient as jest.Mocked<typeof SSMClient>;
const getInput = core.getInput as jest.MockedFunction<typeof core.getInput>;

const DEFAULT_INPUTS = [
  'aws-access-key-id',
  'aws-secret-access-key',
  'aws-region',
  '60',
  'Key=InstanceIds,Values=i-1234567890',
  'AWS-RunShellScript',
  'commands=["ls -al"]',
]; // order is important

describe("aws-ssm-send-command-action", () => {
  beforeEach(() => {
    DEFAULT_INPUTS.forEach(input => {
      getInput.mockReturnValueOnce(input);
    });
  });

  it("set successful outputs if the status is Success", async () => {
    const CommandId = 'CommandId', Status = 'Success', Output = 'Output';
    (MockedClient as jest.Mock).mockImplementation(() => ({
      send: jest.fn((arg) => {
        if (arg instanceof SendCommandCommand) {
          return {Command: {CommandId}};
        } else {
          return {CommandInvocations: [{Status, CommandPlugins: [{Status, Output}]}]}
        }
      })
    }));

    await main();

    expect(core.setOutput).toHaveBeenCalledTimes(2);
  });

  it("waits and retries until the status is not InProgress", async () => {
    const CommandId = 'CommandId', Status = 'InProgress', Output = 'Output';
    let attempts = 0;
    (MockedClient as jest.Mock).mockImplementation(() => ({
      send: jest.fn((arg) => {
        if (arg instanceof SendCommandCommand) {
          return {Command: {CommandId}};
        } else {
          if (attempts == 0) {
            attempts += 1;
            return {CommandInvocations: [{Status, CommandPlugins: [{Status, Output}]}]};
          }
          return {CommandInvocations: [{Status: 'Success', CommandPlugins: [{Status, Output}]}]};
        }
      })
    }));

    await main();

    expect(core.setOutput).toHaveBeenCalledTimes(2);
  });
});