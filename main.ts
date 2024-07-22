import { App, Editor, EditorPosition, Plugin, PluginSettingTab, Setting } from 'obsidian';


type PluginSettings = Record<string, { pattern: string, link: string }>;

const DEFAULT_SETTINGS: PluginSettings = {};

export default class LinkMagicPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingTab(this.app, this));

		const onKeyEvent = (evt: KeyboardEvent) => {
			if (!evt.shiftKey) {
				const mdFile = this.app.workspace.activeEditor
				if (mdFile?.editor) {
					this.triggerSnippet(mdFile.editor, evt)
				}
			}
		}

		this.registerDomEvent(document, "keydown", onKeyEvent)

		this.registerEvent(this.app.workspace.on("window-open", (event) => {
			this.registerDomEvent(activeWindow, "keydown", onKeyEvent)
		}))
	}

	onunload() {
		console.log('Unloading plugin.')
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	checkForMatch(editor: Editor, pos?: EditorPosition) {
		let curPos = pos ? pos : editor.getCursor()
		// @ts-expect-error, not typed
		const editorView = editor.cm as EditorView;
		let line = editor.getLine(curPos.line)
		let word = "";
		let i = curPos.ch - 1;
		while (i >= 0 && line[i] !== " ") {
			word = line[i] + word
			i--
		}
		//We should check if we've already done the text replacement
		if (RegExp("(\[.*\]\(.*\))", "g").test(word)) {
			return
		}

		Object.values(this.settings)
			.filter(({ pattern, link }) => pattern && link)
			.some(({ pattern, link }) => {
				const regex = RegExp(pattern, "g")
				if (regex.test(word)) {
					const enclosingRegex = /^(\()?(.*?)(\))?$/
					let match = enclosingRegex.exec(word)
					if (match) {
						const startChar = match[1] || ""
						const innerWord = match[2]
						const endChar = match[3] || ""
						let markdownLink = `${startChar}[${innerWord}](${link.replace("{pattern}", innerWord)})${endChar}`
						editor.replaceRange(markdownLink, { line: curPos.line, ch: curPos.ch - word.length }, curPos);
					}
				}
			})
	}

	handleEnter(editor: Editor, pos?: EditorPosition) {
		// Get the current line position
		let curPos = pos ? pos : editor.getCursor()
		// Don't think we need to check if we're on the first line as this should only be called after enter
		let lineAbove = editor.getLine(curPos.line - 1)
		this.checkForMatch(editor, { line: curPos.line - 1, ch: lineAbove.length })
	}

	handleTab(editor: Editor, pos?: EditorPosition) {
		//Remove all the white space
		let curPos = pos ? pos : editor.getCursor()
		editor.getLine(curPos.line).trimStart()

	}

	triggerSnippet(editor: Editor, evt: KeyboardEvent) {
		switch (evt.key) {
			case " ": {
				this.checkForMatch(editor)
				break;
			}
			case "Tab": {
				this.handleTab(editor)
				break;
			}
			case "Enter": {
				this.handleEnter(editor)
				break;
			}
			default: {
				break;
			}
		}
	}
}


class SettingTab extends PluginSettingTab {
	plugin: LinkMagicPlugin;

	constructor(app: App, plugin: LinkMagicPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		let settingName = ""
		new Setting(containerEl)
			.setName('Add a new rule')
			.addText((text) => {
				text.setPlaceholder("Rule Name").onChange((value) => {
					settingName = value;
				});
			})
			.addButton((button) => {
				button.setButtonText("+").onClick(async () => {
					if (!settingName) {
						return;
					}
					this.plugin.settings = {
						...this.plugin.settings,
						[settingName]: {
							pattern: "",
							link: "",
						},
					};
					await this.plugin.saveSettings();
					this.display()
				});
			});
		Object.keys(this.plugin.settings).forEach((key) => {
			new Setting(containerEl)
				.setName(key)
				.addText((text) => {
					text
						.setPlaceholder("Pattern")
						.setValue(this.plugin.settings[key].pattern)
						.onChange(async (value) => {
							this.plugin.settings[key].pattern = value
							await this.plugin.saveSettings()
						});
				})
				.addText((text) => {
					text
						.setPlaceholder("Link")
						.setValue(this.plugin.settings[key].link)
						.onChange(async (value) => {
							this.plugin.settings[key].link = value
							await this.plugin.saveSettings()
						})
				})
				.addButton((button) => {
					button.setButtonText("-").onClick(async () => {
						this.plugin.settings = Object.keys(this.plugin.settings)
							.filter((settingsKey) => settingsKey !== key)
							.reduce(
								(settings, settingsKey) => ({
									...settings,
									[settingsKey]: this.plugin.settings[settingsKey],
								}),
								{}
							);
						await this.plugin.saveSettings();
						this.display();
					});
				});
		})
	}
}

