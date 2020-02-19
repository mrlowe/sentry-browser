// To check if all of these browsers are still viable, run
// yarn test:integration:checkbrowsers

module.exports = {
  bs_android_4: {
    base: "BrowserStack",
    browser: "Android Browser",
    device: "Google Nexus 5",
    os: "android",
    os_version: "4.4",
    real_mobile: true,
    browser_version: null,
  },
  bs_android_5: {
    base: "BrowserStack",
    browser: "Android Browser",
    device: "Google Nexus 9",
    os: "android",
    os_version: "5.1",
    real_mobile: true,
    browser_version: null,
  },
  bs_android_6: {
    base: "BrowserStack",
    browser: "Android Browser",
    device: "Samsung Galaxy S7",
    os: "android",
    os_version: "6.0",
    real_mobile: true,
    browser_version: null,
  },
  bs_android_7: {
    base: "BrowserStack",
    browser: "Android Browser",
    device: "Samsung Galaxy S8",
    os: "android",
    os_version: "7.0",
    real_mobile: true,
    browser_version: null,
  },
  bs_android_8: {
    base: "BrowserStack",
    browser: "Android Browser",
    device: "Samsung Galaxy S9",
    os: "android",
    os_version: "8.0",
    real_mobile: true,
    browser_version: null,
  },
  bs_android_9: {
    base: "BrowserStack",
    browser: "Android Browser",
    device: "Samsung Galaxy S9 Plus",
    os: "android",
    os_version: "9.0",
    real_mobile: true,
    browser_version: null,
  },
  bs_ios_11: {
    base: "BrowserStack",
    browser: "Mobile Safari",
    device: "iPhone 6",
    os: "ios",
    os_version: "11.4",
    real_mobile: true,
    browser_version: null,
  },
  bs_ios_12: {
    base: "BrowserStack",
    browser: "Mobile Safari",
    device: "iPhone 8",
    os: "ios",
    os_version: "12.1",
    real_mobile: true,
    browser_version: null,
  },
  bs_ie10: {
    base: "BrowserStack",
    browser: "IE",
    browser_version: "10.0",
    os: "Windows",
    os_version: "8",
    device: null,
    real_mobile: null,
  },
  bs_ie11: {
    base: "BrowserStack",
    browser: "IE",
    browser_version: "11.0",
    os: "Windows",
    os_version: "10",
    device: null,
    real_mobile: null,
  },
  bs_safari: {
    base: "BrowserStack",
    browser: "Safari",
    browser_version: "latest",
    os: "OS X",
    os_version: "Mojave",
    device: null,
    real_mobile: null,
  },
  bs_edge: {
    base: "BrowserStack",
    browser: "Edge",
    browser_version: "latest",
    os: "Windows",
    os_version: "10",
    device: null,
    real_mobile: null,
  },
  bs_firefox: {
    base: "BrowserStack",
    browser: "Firefox",
    browser_version: "latest",
    os: "Windows",
    os_version: "10",
    device: null,
    real_mobile: null,
  },
  bs_chrome: {
    base: "BrowserStack",
    browser: "Chrome",
    browser_version: "latest",
    os: "Windows",
    os_version: "10",
    device: null,
    real_mobile: null,
  },
};
