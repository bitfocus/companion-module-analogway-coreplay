import {
	InstanceBase,
	runEntrypoint,
	InstanceStatus,
	SomeCompanionConfigField,
	CompanionVariableValue,
} from '@companion-module/base'
import got from 'got'
import URI from 'urijs'
import Jimp from 'jimp'
import jsonpatch from 'fast-json-patch'
import { createEventSource, EventSourceClient } from 'eventsource-client'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { InitVariables, UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { DEFAULTSTATE, State } from './state.js'
import { UpdatePresets } from './presets.js'
import { startPoint, mode, transitionType } from './constants.js'

const { applyPatch } = jsonpatch

type Subscription = {
	check: RegExp
	init?: string[]
	feedback?: string[]
	fun?: (path: string) => void | boolean
}

const HEARTBEATTIME = 2200

export class CoreplayInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig
	state: State
	variables: Record<string, { name: string; value: unknown; lastValue?: unknown; lastSet?: number }> = {}
	variablesQueue: Map<string, unknown> = new Map()
	queueLastSet: number = 0
	queueTimeout: NodeJS.Timeout | undefined = undefined
	host: string
	sse: EventSourceClient | undefined
	connectTimeout: NodeJS.Timeout | undefined = undefined
	connectDelay: number = 600
	heartbeatTimeout: NodeJS.Timeout | undefined = undefined

	constructor(internal: unknown) {
		super(internal)
		this.state = DEFAULTSTATE
		this.sse = undefined
		this.host = 'http://192.168.2.140'
	}

	/**
	 * Init connection after instance is created
	 * @param config stored or default configuration
	 */
	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting)
		try {
			InitVariables(this)
			this.host = this.getHost(this.config.host)

			await this.updateAll()
		} catch (error: any) {
			this.log('error', `Initialization of module failed: ${error.message}, ${error.stack}`)
			this.updateStatus(InstanceStatus.UnknownError)
		}
		this.connect().catch((error) => {
			this.log('error', `Connection failed: ${error.message}, ${error.stack}`)
			this.updateStatus(InstanceStatus.ConnectionFailure)
		})
		this.log('debug', 'init done')
	}

	/**
	 * Updates all the Companion bits:
	 * Actions, Feedbacks Variables, Presets
	 */
	async updateAll(): Promise<void> {
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		await this.updatePresets()
		this.checkFeedbacks()
	}

	/**
	 * Returns a valid url to the CorePlay from any URI
	 */
	getHost(host: string, basedirectory: string = ''): string {
		const url = new URI(host)
		return `http://${url.authority()}${url.directory()}${basedirectory}` // all other parts of the url can't be used by CorePlay or a proxy to CorePlay
	}

	/**
	 * This array holds all subscriptions, we need to act on.
	 *
	 * Each subscription has the following properties:
	 * @property check - A regex to check the message string against
	 * @property init (optional) - an array of paths to run against when initializing the module
	 * @property feedback - An array with feedbacks to call when the check matches
	 * @property fun (optional) - a function that gets executed with the path to check. It can update variables, etc. If it returns true, the actions presets and so on will be updated.
	 */
	private subscriptions: Subscription[] = [
		{
			check: /\/players\/(\d)\/takeProgress/,
			init: ['/players/1/takeProgress'],
			feedback: ['takeRunning'],
		},
		{
			check: /\/players\/(\d)\/takeConfiguration/,
			init: ['/players/1/takeConfiguration'],
			feedback: ['transitionType', 'startPoint', 'mode'],
			fun: (_path) => {
				const takeConfiguration = this.state.players['1'].takeConfiguration
				this.queueVariableValues({
					take1_transitionDuration: takeConfiguration.transitionDuration,
					take1_transitionType: transitionType.find((val) => val.id === takeConfiguration.transitionType)?.label ?? '',
					take1_startPoint: startPoint.find((val) => val.id === takeConfiguration.startPoint)?.label ?? '',
					take1_presetToggle: mode.find((val) => val.id === takeConfiguration.mode)?.label ?? '',
				})
			},
		},
		{
			check: /\/players\/(\d)\/(preview|program)\/state/,
			init: ['/players/1/preview/state', '/players/1/program/state'],
			feedback: ['playerstate', 'tallyBool'],
		},
		{
			check: /\/players\/(\d)\/(preview|program)\/mediaUrl/,
			init: ['/players/1/preview/mediaUrl', '/players/1/program/mediaUrl'],
			feedback: ['tallyBool'],
		},
		{
			check: /\/players\/(\d)\/(preview|program)\/position/,
			init: ['/players/1/preview/position', '/players/1/program/position'],
			fun: (path: string) => {
				try {
					const player = path.split('/')[2]
					const playback = path.split('/')[3] as 'preview' | 'program'
					const position = this.state.players[player][playback].position
					const mediaUrl = this.state.players[player][playback].mediaUrl
					if (!mediaUrl.startsWith('core://collection')) return
					const collection = mediaUrl.split('/')[3]
					const slot = mediaUrl.split('/')[5]
					const duration = this.state.collections[collection].slots[slot].duration ?? null

					if (typeof duration === 'number') {
						const remaining = duration - position
						this.queueVariableValues({
							[`${playback}${player}_elapsed`]: Math.floor(position * 1_000),
							[`${playback}${player}_remain`]: Math.floor(remaining * 1_000),
						})
					} else {
						this.queueVariableValues({
							[`${playback}${player}_elapsed`]: Math.floor(position * 1_000),
							[`${playback}${player}_remain`]: undefined,
						})
					}
				} catch (_err) {
					// fail silently
				}
			},
		},
		{
			// add or change collection
			check: /\/collections\/\d+\/slots\/\d+$/,
			fun: (_path: string) => {
				this.queueVariableValues({
					collections: { ...this.state.collections },
				})
				return true
			},
		},
		{
			// needed for remove collection
			check: /\/collections\/\d+$/,
			init: ['/collections/1'],
			fun: (_path: string) => {
				this.queueVariableValues({
					collections: { ...this.state.collections },
				})
				return true
			},
		},
		{
			check: /\/collections\/\d+\/slots\/\d+\/thumbnails/,
			feedback: ['previeImage'],
		},
		{
			check: /\/playlists\//,
			init: ['/playlists/'],
			fun: (_path: string) => {
				this.queueVariableValues({
					playlists: { ...this.state.playlists },
				})
				return true
			},
		},
	] as const

	/**
	 * Checks if a subscription exists for path and runs feedbacks or the fun function
	 * @param path
	 */
	checkSub(path: string): void {
		// console.log('looking for subscription for ' + path)
		let doUpdate = false
		this.subscriptions
			.filter((sub) => path.match(sub.check))
			.forEach((sub) => {
				// console.log('found subscription', sub.check)
				if (sub.fun && typeof sub.fun === 'function') {
					const update = sub.fun(path)
					if (update) doUpdate = true
				}
				if (sub.feedback) this.checkFeedbacks(...sub.feedback)
			})
		if (doUpdate) this.updateAll().catch(() => {})
	}

	/**
	 * Runs all subscriptions with the initial path
	 */
	initSubscriptions(): void {
		// console.log('looking for subscription for ' + path)
		let doUpdate = false
		this.subscriptions
			.filter((sub) => Array.isArray(sub.init) && sub.init.length > 0)
			.forEach((sub) => {
				// console.log('found subscription', sub.check)
				if (sub.init == undefined) return
				for (const path of sub.init) {
					if (sub.fun && typeof sub.fun === 'function') {
						const update = sub.fun(path)
						if (update) doUpdate = true
					}
					if (sub.feedback) this.checkFeedbacks(...sub.feedback)
				}
			})
		if (doUpdate) this.updateAll().catch(() => {})
	}

	/**
	 * try to establish connection
	 */
	async connect(): Promise<void> {
		if (this.connectTimeout) {
			clearTimeout(this.connectTimeout)
			this.connectTimeout = undefined
		}
		this.updateStatus(InstanceStatus.Connecting)
		try {
			await got.get(`${this.host}/api/core/v1/version`, { retry: { limit: 0 } }) // this.requestAPI('GET', '/version')

			this.connectDelay = 600

			// Get Initial state
			const promises = [
				this.requestAPI('GET', '/system'),
				this.requestAPI('GET', '/players/1'),
				this.requestAPI('GET', '/collections'),
				this.requestAPI('GET', '/playlists'),
				this.requestAPI('GET', '/storages'),
				this.requestAPI('GET', '/jobs'),
			]

			const results = await Promise.all(promises)
			this.state['system'] = JSON.parse(results[0].body)
			this.state['players']['1'] = JSON.parse(results[1].body)
			this.state['collections'] = JSON.parse(results[2].body)
			this.state['playlists'] = JSON.parse(results[3].body)
			this.state['storages'] = JSON.parse(results[4].body)
			this.state['jobs'] = JSON.parse(results[5].body)

			this.queueVariableValues({
				serialnumber: this.state['system']['serialNumber'] ?? '',
				hostname: this.state['system']['hostname'] ?? '',
			})

			if (
				(this.state.system.firmwareVersion?.major && this.state.system.firmwareVersion?.major < 1) ||
				(this.state.system.firmwareVersion?.major == 1 && this.state.system.firmwareVersion.minor < 1) ||
				(this.state.system.firmwareVersion?.major == 1 &&
					this.state.system.firmwareVersion.minor == 1 &&
					this.state.system.firmwareVersion.patch < 1)
			) {
				this.log(
					'warn',
					`This module needs CorePlay firmware of at least version 1.1.1, device has version ${this.state.system.firmwareVersion?.major}.${this.state.system.firmwareVersion?.minor}.${this.state.system.firmwareVersion?.patch}${this.state.system.firmwareVersion?.tag ? '.' + this.state.system.firmwareVersion?.tag : ''}`,
				)
			}

			// console.log('State', JSON.stringify(this.state))

			// init variables and feedbacks
			this.initSubscriptions()

			// Establish SSE connection and track updates
			if (this.sse !== undefined) {
				this.disconnectSSE()
			}
			try {
				this.sse = createEventSource({
					url: this.host + '/api/core/v1/sse',

					onMessage: ({ data }) => {
						// this.log('debug', `received data: ` + data)
						let jsonData = []
						try {
							jsonData = JSON.parse(data)
						} catch (error) {
							this.log('error', `Received message from CorePlay that is no valid JSON: ${error}\nMessage: ${data}`)
							return
						}
						if (!Array.isArray(jsonData)) {
							this.log('error', `Received message from CorePlay that is not an array.\nMessage: ${data}`)
							return
						}

						// reset watchdog
						if (this.heartbeatTimeout) {
							clearTimeout(this.heartbeatTimeout)
						}
						this.heartbeatTimeout = setTimeout(() => {
							void this.watchdog()
						}, HEARTBEATTIME)

						try {
							applyPatch(this.state, jsonData)

							for (const patch of jsonData) {
								if (
									!JSON.stringify(patch).includes('"path":"/system/uptime"') &&
									!JSON.stringify(patch).includes('osition","value"')
								) {
									this.log('debug', `Applied patch: ${JSON.stringify(patch)}`)
									this.checkSub(patch.path)
								}
							}
						} catch (error) {
							this.log('error', `Can't apply patch ${data} to state ${error}`)
							//console.log('State', JSON.stringify(this.state))
						}
					},
				})

				this.updateStatus(InstanceStatus.Ok)
			} catch (error) {
				this.log('error', 'Failed to connect to CorePlay SSE ' + error)
				this.updateStatus(InstanceStatus.ConnectionFailure)
			}

			this.heartbeatTimeout = setTimeout(() => {
				void this.watchdog()
			}, HEARTBEATTIME)
		} catch (_error) {
			this.updateStatus(InstanceStatus.ConnectionFailure)
			this.log('error', `Establishing connection failed, will retry in ${this.connectDelay / 1000}s`)
			this.connectTimeout = setTimeout(() => {
				void this.connect()
			}, this.connectDelay)
			this.connectDelay = Math.min(Math.round(this.connectDelay * 1.1), 12000)
		}
	}

	/**
	 * what happens when there is no heartbeat
	 */
	async watchdog(): Promise<void> {
		this.updateStatus(InstanceStatus.ConnectionFailure)
		await this.destroy()
		void this.connect()
	}

	/**
	 * close sse connection
	 */
	disconnectSSE(): void {
		if (this.sse !== undefined) {
			this.sse.close()
			delete this.sse
		}
	}

	/**
	 * Cleanup connection
	 */
	async destroy(): Promise<void> {
		this.disconnectSSE()
		if (this.queueTimeout) {
			clearTimeout(this.queueTimeout)
			this.queueTimeout = undefined
		}
		if (this.connectTimeout) {
			clearTimeout(this.connectTimeout)
			this.connectTimeout = undefined
		}
		if (this.heartbeatTimeout) {
			clearTimeout(this.heartbeatTimeout)
			this.heartbeatTimeout = undefined
		}
		this.log('debug', 'destroy')
	}

	/**
	 * Return config fields for web config
	 */
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/**
	 * Update connection with a new config
	 * @param config
	 */
	async configUpdated(config: ModuleConfig): Promise<void> {
		if (config.host !== this.config.host) {
			this.config = config
			await this.updateAll()

			this.host = this.getHost(this.config.host)
			await this.destroy()
			void this.connect()
		}
	}

	/**
	 * Publish action definitions
	 */
	updateActions(): void {
		UpdateActions(this)
	}

	/**
	 * Publish feedback definitions
	 */
	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	/**
	 * Publish variables definitions
	 */
	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	/**
	 * Publish preset definitions
	 */
	async updatePresets(): Promise<void> {
		await UpdatePresets(this)
	}

	/**
	 * Send a http request to the CorePlay API
	 * @param method http method to use
	 * @param path api endpooint
	 * @param data optional body text or json
	 * @param headers optional object with headers
	 * @returns http response promise
	 */
	async requestAPI(
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		path: string = '/',
		data: undefined | string | object = undefined,
		headers = {},
	): Promise<any> {
		return await this.request(method, '/api/core/v1' + path, data, headers)
	}

	/**
	 * Send a http request to the CorePlay
	 * @param method http method to use
	 * @param path api endpooint
	 * @param data optional body text or json
	 * @param headers optional object with headers
	 * @returns http response promise
	 */
	async request(
		method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
		path: string = '/',
		data: undefined | string | object = undefined,
		headers = {},
	): Promise<any> {
		const url = `${this.host}${path}`

		const options: Record<string, any> = {
			url,
			method,
			headers,
		}

		if (options.headers['Content-Type'] === undefined) {
			if (typeof data === 'string') {
				options.headers['Content-Type'] = 'text/plain'
			} else if (typeof data === 'object') {
				options.headers['Content-Type'] = 'application/json'
			}
		}

		if (typeof data === 'string') {
			options.body = data
		} else if (typeof data === 'object') {
			options.json = data
		}

		return got(options)
	}

	setVariable(variableId: string, value: unknown): void {
		if (this.variables[variableId] === undefined)
			this.variables[variableId] = { name: 'unknown', value: undefined, lastValue: undefined }
		this.variables[variableId].value = value
		if (this.variables[variableId].lastValue !== value) {
			this.setVariableValues({ [variableId]: value as CompanionVariableValue })
			this.variables[variableId].lastValue = value
		}
		this.variables[variableId].lastSet = Date.now()
	}

	/**
	 * Queues some variable updates to be sent to Companion in a throttled manner
	 * Values are collected and sent in chunks with a minimum delay between writes. Intermediate values are discarded, only the last valid value at write time is written. Id a value changes and changes back to the original value during the delay time, nothing is written and the temporary change is lost.
	 * @param updates object with any number of porperties, each describing a variable
	 */
	queueVariableValues(updates: Record<string, unknown>): void {
		for (const [variableId, value] of Object.entries(updates)) {
			if (this.variables[variableId] === undefined)
				this.variables[variableId] = { name: 'unknown', value: undefined, lastValue: undefined }
			this.variables[variableId].value = value

			// add all changed values to the queue
			// intermediate values that change back to the last set value during the delay period get lost!
			if (this.variables[variableId].lastValue === value) {
				this.variablesQueue.delete(variableId)
			} else {
				this.variablesQueue.set(variableId, value)
			}
		}

		if (this.queueTimeout) {
			// there is a pending queue write, so we don't need to do anything more
			return
		}

		if (this.variablesQueue.size) {
			// when is it safe to start next write?
			const DELAY = 100
			const minDelay = Math.max(DELAY - (Date.now() - this.queueLastSet), 0)
			// schedule a write after the minimum delay
			this.queueTimeout = setTimeout(() => {
				const queue = Array.from(this.variablesQueue)
				this.variablesQueue.clear()
				// write out
				this.setVariableValues(
					queue.reduce((prev, curr) => {
						return { ...prev, [curr[0]]: curr[1] as CompanionVariableValue }
					}, {}),
				)
				// update stored values
				const now = Date.now()
				queue.forEach((variable) => {
					this.variables[variable[0]].lastValue = variable[1]
					this.variables[variable[0]].lastSet = now
				})
				this.queueLastSet = now
				this.queueTimeout = undefined
			}, minDelay)
		}
	}

	async getThumbAsPNG(typ: 'collections' | 'playlists', numbe: number, ite: number | string): Promise<string> {
		try {
			let num: string, item: string
			if (typ === 'collections') {
				num = Math.min(Math.max(Math.round(numbe), 1), 255).toString()
				item = Math.min(Math.max(Math.round(Number(ite)), 1), 255).toString()
			} else if (typ === 'playlists') {
				num = Math.max(Math.round(numbe), 1).toString()
				item = ite.toString()

				const mediaUrl: string | undefined = this.state.playlists[num]?.entries[item]?.mediaUrl ?? undefined
				if (mediaUrl) {
					num = mediaUrl.split('/')[3]
					item = mediaUrl.split('/')[5]
				} else {
					this.log('error', `Can't get thumbnail for playlist ${num}, entry ${item}. Can't retrieve mediaUrl.`)
					return ''
				}
			} else {
				this.log('error', `Can't get thumbnail. Type is neither collection nor playlist.`)
				return ''
			}

			const thumbnails: Record<string, any> = this.state.collections[num]?.slots[item]?.metadata.thumbnails ?? {}
			let thumbUrl = ''
			if (thumbnails.medium) thumbUrl = thumbnails.medium.url
			else if (thumbnails.large) thumbUrl = thumbnails.large.url
			else if (thumbnails.small) thumbUrl = thumbnails.small.url
			else {
				this.log('debug', `Can't get thumbnail for collection ${num}, slot ${item}. No thumbnail is provided.`)
				return ''
			}

			try {
				const maxsize = 144
				const image = await Jimp.read(this.host + thumbUrl)
				const width = image.getWidth()
				const height = image.getHeight()
				if (width < 1 || height < 1) {
					return ''
				}
				const ar = width / height
				const tw = ar >= 1 ? maxsize : Math.round(maxsize * ar)
				const th = ar >= 1 ? Math.round(maxsize / ar) : maxsize
				//const buff = image.resize(tw, th).bitmap.data
				return await image.resize(tw, th).getBase64Async(Jimp.MIME_PNG)
				// return {
				// 	imageBuffer: buff,
				// 	imageBufferEncoding: 'RGBA' as unknown as CompanionImageBufferEncoding,
				// 	imageBufferPosition: {
				// 		x: Math.floor((maxsize - tw) / 4),
				// 		y: Math.floor((maxsize - th) / 4),
				// 		width: tw,
				// 		height: th,
				// 		drawScale: 0.5,
				// 	},
				// }
			} catch (error) {
				this.log('debug', `Can't get thumbnail from ${this.host + thumbUrl}: ${error}`)
				return ''
			}
		} catch (error) {
			this.log('error', `Error checking feedback preview thumbnail: ${error}`)
		}
		return ''
	}
}

runEntrypoint(CoreplayInstance, UpgradeScripts)
