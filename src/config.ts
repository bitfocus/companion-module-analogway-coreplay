import { type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Network Address of the CorePlay',
			width: 12,
			default: 'http://192.168.2.140',
			regex: '/^https?:\\/\\/[\\w]+/',
		},
	]
}
