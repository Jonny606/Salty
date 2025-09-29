import '@unocss/reset/tailwind.css'
import 'uno.css'
import './styles/global.css'

import { mount } from 'svelte'

import { widgetApi } from '@/modules/api'
import { provideVersionInfo } from '@/modules/app'
import { initializeGA } from '@/modules/googleAnalytics'
import { getSmartsuppWidget, widgetOptions } from '@/modules/options'
import { themeColor } from '@/modules/theme'

import App from './App.svelte'

const widget = getSmartsuppWidget(window)

widgetOptions.init(widget.options)
widget.installApi(widgetApi)
themeColor.setThemeColor(widget.options)
provideVersionInfo()
initializeGA()

const app = mount(App, {
	target: document.getElementById('app') as HTMLElement,
})

export default app
