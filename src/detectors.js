const { parsePatterns, asArray } = require('./utils')

const detectors = {
  vue: require('../detectors/vue.json'),
  frameworks: require('../detectors/frameworks.json'),
  plugins: require('../detectors/plugins.json'),
  uis: require('../detectors/uis.json'),
  nuxt: {
    meta: require('../detectors/nuxt.meta.json'),
    modules: require('../detectors/nuxt.modules.json')
  }
}

exports.hasVue = function (context) {
  return isMatching(detectors.vue, context)
}

exports.getFramework = async function (context) {
  for (const framework of Object.keys(detectors.frameworks)) {
    if (await isMatching(detectors.frameworks[framework], context)) {
      return framework
    }
  }
  return null
}

exports.getUI = async function (context) {
  for (const ui of Object.keys(detectors.uis)) {
    if (await isMatching(detectors.uis[ui], context)) {
      return ui
    }
  }
  return null
}

exports.getPlugins = async function (context) {
  const plugins = new Set()

  await Promise.all(
    Object.keys(detectors.plugins).map(async (plugin) => {
      if (await isMatching(detectors.plugins[plugin], context)) {
        plugins.add(plugin)
      }
    })
  )

  return Array.from(plugins)
}

exports.getNuxtMeta = async function (context) {
  const meta = {}

  await Promise.all(
    Object.keys(detectors.nuxt.meta).map(async (key) => {
      meta[key] = await isMatching(detectors.nuxt.meta[key], context)
    })
  )

  return meta
}

exports.getNuxtModules = async function (context) {
  const modules = new Set()

  await Promise.all(
    Object.keys(detectors.nuxt.modules).map(async (name) => {
      if (await isMatching(detectors.nuxt.modules[name], context)) {
        modules.add(name)
      }
    })
  )

  return Array.from(modules)
}

async function isMatching (detector, { html, scripts, page }) {
  // If we can detect technology from html
  if (detector.html) {
    for (const pattern of parsePatterns(detector.html)) {
      if (pattern.regex.test(html)) return true
    }
  }
  // Check with scripts src
  if (detector.script) {
    for (const pattern of parsePatterns(detector.script)) {
      for (const uri of scripts) {
        if (pattern.regex.test(uri)) return true
      }
    }
  }
  // Or JS evaluation
  if (detector.js) {
    for (const js of asArray(detector.js)) {
      try {
        if (await page.evaluate(`Boolean(${js})`)) return true
      } catch (e) {}
    }
  }
  return false
}