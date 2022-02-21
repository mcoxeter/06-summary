#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
const config = require('./config.json');

async function app() {
  const stockFolders = await getStockFolders();

  console.log(
    'Symbol, currentPrice, 02-screen, 03-management, 04-moat, total-score, 05-mos-ourBuy, 05-mos-warren-buy'
  );

  for (const stockFolder of stockFolders) {
    const price = currentPrice(stockFolder);
    const buys = mosBuys(stockFolder);
    const screen = screenRating(stockFolder);
    const management = managementScore(stockFolder);
    const moat = moatScore(stockFolder);

    const total = screen + management + moat;

    console.log(
      `${stockName(
        stockFolder
      )}, ${price} ${screen}, ${management}, ${moat}, ${total}, ${
        buys.ourBuyPrice
      }, ${buys.warrenBuyPrice}`
    );
  }
}

function stockName(stockFolder: string): string {
  const parts = stockFolder.split('\\');
  return parts[parts.length - 1];
}

function currentPrice(stockFolder: string): number {
  const lastDataFile = fs
    .readdirSync(`${stockFolder}/01-data`)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .find(() => true);

  const screen = require(`${stockFolder}/01-data/${lastDataFile}`);
  return screen.Price ?? 0;
}

function screenRating(stockFolder: string): number {
  const lastDataFile = fs
    .readdirSync(`${stockFolder}/02-screen`)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .find(() => true);

  const screen = require(`${stockFolder}/02-screen/${lastDataFile}`);
  return screen.rating;
}

function managementScore(stockFolder: string): number {
  const lastDataFile = fs
    .readdirSync(`${stockFolder}/03-management`)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .find(() => true);

  const management = require(`${stockFolder}/03-management/${lastDataFile}`);
  return management.score ?? 0;
}

function moatScore(stockFolder: string): number {
  const lastDataFile = fs
    .readdirSync(`${stockFolder}/04-moat`)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .find(() => true);

  const moat = require(`${stockFolder}/04-moat/${lastDataFile}`);
  return moat.score ?? 0;
}

function mosBuys(stockFolder: string): {
  ourBuyPrice: string;
  warrenBuyPrice: string;
} {
  const lastDataFile = fs
    .readdirSync(`${stockFolder}/05-mos`)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a))
    .find(() => true);

  const mos = require(`${stockFolder}/05-mos/${lastDataFile}`);
  if (mos.warrenBuffettAnalysis && mos.dcfAnalysis) {
    return {
      warrenBuyPrice: mos.warrenBuffettAnalysis.buyPrice,
      ourBuyPrice: mos.dcfAnalysis.buyPrice
    };
  } else {
    return {
      warrenBuyPrice: '0',
      ourBuyPrice: '0'
    };
  }
}

async function getStockFolders(): Promise<string[]> {
  const basePath = `${config.path}/Evaluation`;
  let stocks: string[] = [];

  const files = await fs.promises.readdir(basePath);

  for (const file of files) {
    const stockPath = path.join(basePath, file);
    if (await isStockFolder(file, basePath)) {
      stocks.push(stockPath);
    }
  }
  return stocks;
}

async function isStockFolder(
  file: string,
  baseFolder: string
): Promise<boolean> {
  const stockFolder = path.join(baseFolder, file);
  const stat = await fs.promises.stat(stockFolder);
  if (!stat.isDirectory()) {
    return false;
  }

  const manditoryFolders = [
    '01-data',
    '02-screen',
    '03-management',
    '04-moat',
    '05-mos'
  ];

  for (const manditoryFolder of manditoryFolders) {
    const subFolder = path.join(stockFolder, manditoryFolder);
    if (fs.existsSync(subFolder)) {
      const stat = await fs.promises.stat(subFolder);
      if (!stat.isDirectory()) {
        return false;
      }
    } else {
      return false;
    }
  }

  return true;
}

app();
