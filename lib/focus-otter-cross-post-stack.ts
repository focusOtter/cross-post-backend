import * as cdk from 'aws-cdk-lib'

import { Construct } from 'constructs'
import { createCrossPostFunc } from './functions/crosspost/construct'

export class FocusOtterCrossPostStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props)

		const crossPostFunc = createCrossPostFunc(this)
	}
}
