# AWS SSM Send-Command Action

Run AWS's SSM Send-Command API using this action. Refer to [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/interfaces/sendcommandcommandinput.html).

```yml
  - name: Run aws ssm send-command
    uses: nohmad/aws-ssm-send-command-action@master
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: ap-northeast-2
      targets: |
        [{"Key":"InstanceIds","Values":["i-1234567890"]}]
      document-name: AWS-RunShellScript
      parameters: |
        {"commands":["uname -a"]}
```

## Inputs

### aws-access-key-id

**Required**. `secrets.AWS_ACCESS_KEY_ID`

### aws-secret-access-key

**Required**. `secrets.AWS_SECRET_ACCESS_KEY`

### aws-region

**Required**. `secrets.AWS_REGION`

### document-name

Currently, only the **AWS-RunShellScript** was tested.

### targets

**Required**. Specify target instances by JSON format.
```json
[
  {
    "Key": "tag:Name", "Values": ["ec2-instance-name"]
  },
  {
    "Key": "InstanceIds", "Values": ["i-1234567890"]
  }
]
```

### parameters

**Required**. Parameters to the document. Must be formatted as JSON:
```json
{"commands": ["uname -a"]}
```

## Outputs

### status

Taken from `.CommandInvocations[0].Status`.  `Success` or `Failure`

### command-id

`CommandId` to check the details of the command executed. Run following command to see the details:

```sh
aws ssm list-command-invocations --command-id <command-id> --details
```

### output

Command output

## Author

GY Noh <nohmad@gmail.com>

# LICENSE

MIT License
