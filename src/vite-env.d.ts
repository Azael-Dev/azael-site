/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_DISCORD_URL: string
    readonly VITE_GITHUB_URL: string
    readonly VITE_CFX_STORE_URL: string
    readonly VITE_BAN_DB_URL: string
    readonly VITE_DOCS_URL: string
    readonly VITE_STATUS_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

// Vanta.js types
interface VantaWavesOptions {
    el: string | HTMLElement
    mouseControls?: boolean
    touchControls?: boolean
    gyroControls?: boolean
    minHeight?: number
    minWidth?: number
    scale?: number
    scaleMobile?: number
    color?: number
    waveSpeed?: number
}

interface VantaEffect {
    destroy: () => void
}

interface VANTA {
    WAVES: (options: VantaWavesOptions) => VantaEffect
}

declare const VANTA: VANTA

// Magic Snowflakes types
interface SnowflakesOptions {
    color?: string
    count?: number
    maxSize?: number
    minSize?: number
    speed?: number
    wind?: boolean
    zIndex?: number
}

declare class Snowflakes {
    constructor(options?: SnowflakesOptions)
    destroy(): void
    start(): void
    stop(): void
}
