import { CompanionInputFieldDropdown } from '@companion-module/base'

export const defaultred = 0xcc0000
export const darkred = 0x660000
export const defaultgreen = 0x00cc00
export const defaultblue = 0x0000ff
export const defaultblack = 0
export const defaultwhite = 0xcccccc

export const OPTIONPLAYBACK: CompanionInputFieldDropdown = {
	id: 'playback',
	type: 'dropdown',
	label: 'Playback',
	default: 'program',
	choices: [
		{ id: 'program', label: 'Program' },
		{ id: 'preview', label: 'Preview' },
	],
}

export const playlistsort = (a: string, b: string): number => {
	// The sorting of the CorePlay cues is completely shit. '1.10' > '1.9'
	const [a1, a2] = a.split('.')
	const [b1, b2] = b.split('.')

	if (Number(a1) > Number(b1)) return 1
	if (Number(a1) < Number(b1)) return -1

	if (Number(a2) > Number(b2)) return 1
	if (Number(a2) < Number(b2)) return -1

	return 0
}

export const toggleChoice = { id: 'toggle', label: 'Toggle Value' }

export const takeConfigurationChoices = [
	{ id: 'transitionDuration', label: 'Take Duration' },
	{ id: 'transitionType', label: 'Transition Type' },
	{ id: 'startPoint', label: 'Playhead Option' },
	{ id: 'mode', label: 'Preset Toggle' },
]

export const transitionType = [
	{ id: 'directCut', label: 'Direct Cut' },
	{ id: 'crossfade', label: 'Crossfade' },
	{ id: 'dipToColor', label: 'Dip to Color' },
]

export const mode = [
	{ id: 'swap', label: 'Swap' },
	{ id: 'copy', label: 'Copy' },
]

export const startPoint = [
	{ id: 'inpoint', label: 'From inpoint' },
	{ id: 'position', label: 'From current position in preview' },
]
