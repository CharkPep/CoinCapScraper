# CoinMarketCap Scraper

This script is a scraper for CoinMarketCap, a website that provides cryptocurrency market data. It uses Puppeteer, Cheerio, and Redis to scrape and store data from multiple pages on CoinMarketCap.

## Prerequisites

Before running the script, make sure you have the following dependencies installed:

- Node.js
- npm (Node Package Manager)

## Installation

1. Clone the repository or download the script file.
2. Open a terminal or command prompt and navigate to the project directory.
3. Run the following command to install the required dependencies:

```bash
npm install puppeteer cheerio redis https fs
```

## Run the script:
```bash
node your-script-name.js
```
### Explanation
The script uses Puppeteer to launch a headless Chrome browser and navigate to multiple pages on CoinMarketCap.
The Parse function is responsible for extracting data from the HTML content of each page. It uses Cheerio, a jQuery-like library for server-side HTML parsing, to traverse and extract specific elements.
The extracted data is stored in a Redis database using the client.hSet function.
The saveIcon function downloads and saves the icons of the coins.
The startParse function controls the overall scraping process. It creates a new browser page for each page on CoinMarketCap, invokes the Parse function, and closes the page after processing.
The script limits the number of concurrent pages using maxConcurrentPages to optimize performance and manage system resources.

## Redis

This script utilizes Redis, an open-source, in-memory data structure store, to store the scraped data from CoinMarketCap. Redis provides fast access and retrieval of data, making it suitable for caching and real-time applications.
