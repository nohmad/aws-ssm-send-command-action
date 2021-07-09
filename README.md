# AWS SSM Send-Command Action

Run AWS's SSM Send-Command using this action

```yml
  - name: Run aws ssm send-command
    uses: nohmad/aws-ssm-send-command-action@master
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: ap-northeast-2
      targets: Key=InstanceIds,Values=i-1234567890
      parameters: |
        commands=["uname -a"]
```

## Inputs

### aws-access-key-id

**Required**. `secrets.AWS_ACCESS_KEY_ID`

### aws-secret-access-key

**Required**. `secrets.AWS_SECRET_ACCESS_KEY`

### aws-region

**Required**. `secrets.AWS_REGION`

### targets

**Required**. Specify target instances referring to [AWS](https://docs.aws.amazon.com/cli/latest/reference/ssm/send-command.html)

### document-name

Currently, only the **AWS-RunShellScript** was tested.

### parameters

**Required**. Parameters to the document. Must be formatted like `commands=["uname -a"]`

## Outputs

### status

Taken from `.CommandInvocations[0].CommandPlugins[0].Status`.  `Success` or `Failure`

### output

Taken from `.CommandInvocations[0].CommandPlugins[0].Output`.

## Author

GY Noh <nohmad@gmail.com>

# LICENSE

MIT License
