import type { CoreplayInstance } from './main.js'

export function UpdateVariableDefinitions(self: CoreplayInstance): void {
	self.setVariableDefinitions(
		Object.keys(self.variables).map((variableId) => {
			return { variableId, name: self.variables[variableId].name }
		}),
	)
}

export function InitVariables(self: CoreplayInstance): void {
	self.variables = {
		preview1_elapsed: { name: 'Elapsed time of running media in milliseconds', value: 0, lastSet: 0 },
		preview1_remain: { name: 'Remaining time of running media in milliseconds', value: undefined, lastSet: 0 },
		program1_elapsed: { name: 'Elapsed time of running media in milliseconds', value: 0, lastSet: 0 },
		program1_remain: { name: 'Remaining time of running media in milliseconds', value: undefined, lastSet: 0 },
		take1_transitionDuration: { name: 'Player 1 Take duration in seconds', value: 0, lastSet: 0 },
		take1_transitionType: { name: 'Player 1 Take transition type', value: undefined, lastSet: 0 },
		take1_startPoint: { name: 'Player 1 Take from position', value: undefined, lastSet: 0 },
		take1_presetToggle: { name: 'Player 1 Preset Toggle', value: undefined, lastSet: 0 },
		collections: { name: 'JSON object holding all slots of all collections', value: {}, lastSet: 0 },
		playlists: { name: 'JSON object holding all playlists', value: {}, lastSet: 0 },
		serialnumber: { name: 'Serial number of the device', value: '', lastSet: 0 },
		hostname: { name: 'Hostname of the device', value: '', lastSet: 0 },
	}
}
