import {
	CompanionActionEvent,
	CompanionAdvancedFeedbackResult,
	CompanionButtonStyleProps,
	SomeCompanionActionInputField,
	// CompanionCommonCallbackContext,
} from '@companion-module/base'
import { CompanionCommonCallbackContext } from '@companion-module/base/dist/module-api/common.js'

export type Maction<T> = {
	name: string
	description?: string
	tooltip?: string
	options: SomeMactionInputfield<T>[]
	callback: (action: ActionEvent<T>) => void | Promise<void>
	subscribe?: (action: ActionEvent<T>) => void | Promise<void>
	unsubscribe?: (action: ActionEvent<T>) => void | Promise<void>
	learn?: (action: ActionEvent<T>) => MoptionValues<T> | undefined | Promise<MoptionValues<T> | undefined>
}

export type Mfeedback<T> = MboolFeedback<T> | MadvFeedback<T>

export type MboolFeedback<T> = {
	name: string
	type: 'boolean'
	description?: string
	tooltip?: string
	options: SomeMactionInputfield<T>[]
	callback: (feedback: ActionEvent<T>, context: CompanionCommonCallbackContext) => boolean | Promise<boolean>
	subscribe?: (feedback: ActionEvent<T>) => void | Promise<void>
	unsubscribe?: (feedback: ActionEvent<T>) => void | Promise<void>
	learn?: (action: ActionEvent<T>) => MoptionValues<T> | undefined | Promise<MoptionValues<T> | undefined>
	defaultStyle: Partial<Partial<CompanionButtonStyleProps>>
}

export type MadvFeedback<T> = {
	name: string
	type: 'advanced'
	description?: string
	tooltip?: string
	options: SomeMactionInputfield<T>[]
	callback: (
		feedback: ActionEvent<T>,
		context: CompanionCommonCallbackContext,
	) => CompanionAdvancedFeedbackResult | Promise<CompanionAdvancedFeedbackResult>
	subscribe?: (feedback: ActionEvent<T>) => void | Promise<void>
	unsubscribe?: (feedback: ActionEvent<T>) => void | Promise<void>
	learn?: (action: ActionEvent<T>) => MoptionValues<T> | undefined | Promise<MoptionValues<T> | undefined>
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

type SomeMactionInputfield<T> = {
	isVisible?: (options: MoptionValues<T>, [string]?: any) => boolean
} & DistributiveOmit<SomeCompanionActionInputField, 'isVisible'>

type ActionEvent<T> = Omit<CompanionActionEvent, 'options'> & {
	options: MoptionValues<T>
}

type MoptionValues<T> = T
