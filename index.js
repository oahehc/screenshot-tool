import puppeteer from 'puppeteer';
import ora from 'ora';
import inquirer from 'inquirer';

// https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts
const devices = ['iPhone SE', 'iPhone XR', 'iPad Pro'];
const desktopSizes = [
  { w: 1600, h: 1200 },
  { w: 1280, h: 800 },
  { w: 980, h: 600 },
];

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
        type: 'list',
        name: 'device',
        message: 'select the device',
        choices: ['all', 'desktop', 'mobile'],
      },
      {
        type: 'number',
        name: 'waitFor',
        message: 'set waitFor (ms)',
        default: 1000,
      },
    ])
    .then(({ targetUrl, device, waitFor }) => {
      const spinner = ora('take screenshot: ').start();
      (async () => {
        try {
          const browser = await puppeteer.launch({ headless: true });
          // const browser = await puppeteer.launch({ headless: false, slowMo: 2000 });
          const page = await browser.newPage();
          await page.goto(targetUrl, { waitUntil: 'networkidle2' });
          if (device === 'mobile' || device === 'all') {
            for (let device of devices) {
              await page.emulate(puppeteer.devices[device]);

              await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
              await page.waitForTimeout(waitFor);
              await page.screenshot({
                path: `./screenshots/${Date.now()}_${device.replace(/\s/, '_')}.jpg`,
                fullPage: true,
                quality: 60,
              });
              await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
              await page.waitForTimeout(waitFor);
              await page.screenshot({
                path: `./screenshots/${Date.now()}_${device.replace(/\s/, '_')}_dark.jpg`,
                fullPage: true,
                quality: 60,
              });
            }
          }

          if (device === 'desktop' || device === 'all') {
            for (let size of desktopSizes) {
              const { w, h } = size;
              await page.setViewport({ width: w, height: h });

              await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
              await page.waitForTimeout(waitFor);
              await page.screenshot({
                path: `./screenshots/${Date.now()}_W${w}xH${h}.jpg`,
                fullPage: true,
                quality: 60,
              });
              await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
              await page.waitForTimeout(waitFor);
              await page.screenshot({
                path: `./screenshots/${Date.now()}_W${w}xH${h}_dark.jpg`,
                fullPage: true,
                quality: 60,
              });
            }
          }
          spinner.succeed('finish');
          await browser.close();
        } catch (e) {
          spinner.fail('error');
          console.log('error:', e);
        }
      })();
    })
    .catch(error => {
      console.log(error);
      return 1;
    });
})();
