import { CfnOutput } from 'aws-cdk-lib'
import * as aws_iam from 'aws-cdk-lib/aws-iam'
import { FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import path = require('path')

type CrossPostProps = {}

export const createCrossPostFunc = (
	scope: Construct,
	props?: CrossPostProps
) => {
	const crossPostFunc = new NodejsFunction(scope, `crosspostFunc`, {
		functionName: `crosspostFunc`,
		runtime: Runtime.NODEJS_16_X,
		handler: 'handler',
		entry: path.join(__dirname, `./main.ts`),
	})

	const fURLItem = crossPostFunc.addFunctionUrl({
		authType: FunctionUrlAuthType.NONE,
	})

	crossPostFunc.addToRolePolicy(
		new aws_iam.PolicyStatement({
			actions: ['secretsmanager:GetSecretValue', 'ssm:GetParameter'],
			resources: [
				'arn:aws:secretsmanager:us-east-1:842537737558:secret:github-token-tlJVaZ',
				'arn:aws:ssm:us-east-1:842537737558:parameter/*',
			],
		})
	)

	new CfnOutput(scope, 'crosspostFuncURL', {
		value: fURLItem.url,
		description: 'crosspostFuncURL',
	})

	return crossPostFunc
}
