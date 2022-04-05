import fs from'fs';
import puppeteer from 'puppeteer';
import ora from 'ora';
import inquirer from 'inquirer';

// https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts
// const devices = ['iPhone SE', 'iPhone XR', 'iPad Pro'];
const deviceMap = {
  iPhone4: { w: 320, h: 480 },
  iPhoneSE: { w: 375, h: 667 },
  iPhoneXR: { w: 414, h: 896 },
  iPadPro: { w: 1024, h: 1366 },
  Laptop: { w: 1440 , h: 800 },
  DT: { w: 2560 , h: 1600 },
};
const dir = './screenshots';

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

(function screenshot() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'targetUrl',
        default: 'http://localhost:3000',
        message: 'type the screenshot URL',
        validate: function (input) {
          const match = input.match(/^http/);
          if (!match) return 'URL format incorrect';
          return true;
        },
      },
      {
        type: 'checkbox',
        name: 'devices',
        default: ['iPhone4', 'iPhoneXR', 'iPadPro', 'DT'],
        message: 'select the devices',
        choices: Object.keys(deviceMap).map((val) => ({ name: val, value: val })),
      },
      {
        type: 'number',
        name: 'waitFor',
        message: 'set waitFor (ms)',
        default: 1000,
      },
    ])
    .then(({ targetUrl, devices, waitFor }) => {
      (async () => {
        try {
          const spinner = ora(`loading`).start();
          const browser = await puppeteer.launch({ headless: true });
          // const browser = await puppeteer.launch({ headless: false, slowMo: 2000 });
          const page = await browser.newPage();
          await page.goto(targetUrl, { waitUntil: 'networkidle2' });
          const sizes = devices.map((d) => deviceMap[d]);
          spinner.stop();
          for (let size of sizes) {
            const { w, h } = size;
            const spinner = ora(`W${w}xH${h}`).start();
            await page.setViewport({ width: w, height: h });

            await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
            await page.waitForTimeout(waitFor);
            await page.screenshot({
              path: `${dir}/${Date.now()}_W${w}xH${h}.jpg`,
              fullPage: true,
              quality: 60,
            });
            await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
            await page.waitForTimeout(waitFor);
            await page.screenshot({
              path: `${dir}/${Date.now()}_W${w}xH${h}_dark.jpg`,
              fullPage: true,
              quality: 60,
            });
            spinner.succeed(`W${w}xH${h}`);
          }
          await browser.close();
        } catch (e) {
          console.log('error:', e);
        }
      })();
    })
    .catch(error => {
      console.log(error);
      return 1;
    });
})();
