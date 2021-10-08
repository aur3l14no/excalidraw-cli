#!/usr/bin/env node
const fs = require('fs-extra')
const path = require('path')
const Hook = require('require-in-the-middle')
const { Crypto } = require("@peculiar/webcrypto")
require('jsdom-global')()

global.crypto = new Crypto()
global.devicePixelRatio = 1

Hook(['@excalidraw/excalidraw'], function (exports, name, basedir) {
    const version = require(path.join(basedir, 'package.json')).version
    exports._version = version
    return exports
})

const Excalidraw = require('@excalidraw/excalidraw')
const { Canvas } = require('canvas')

const readExcalidrawFile = async path => {
    try {
        const data = await fs.readFile(path, 'utf8')
        if (data) return JSON.parse(data)
    } catch (error) {
        console.error(error)
    }
}

const inlineFontInSvg = async svgHtml => {
    const inlinedStyle = await fs.readFile(require.resolve('./font.html'), 'utf8')
    return svgHtml.replace(new RegExp('<style>(.|\n)+</style>', 'm'), inlinedStyle)
}

const main = async () => {
    const [, , inputFile, outputDir, ..._] = process.argv
    const outputFile = path.format({
        dir: outputDir,
        name: path.basename(inputFile, '.excalidraw'),
        ext: '.svg'
    })
    const excalidrawFile = await readExcalidrawFile(inputFile)
    const svg = await Excalidraw.exportToSvg({ ...excalidrawFile })
    const svgHtml = await svg.outerHTML
    const inlinedSvgHtml = await inlineFontInSvg(svgHtml)
    const canvas = Canvas
    return await fs.writeFile(outputFile, inlinedSvgHtml, 'utf8')
}

main().then(() => process.exit())