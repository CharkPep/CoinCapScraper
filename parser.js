const cheerio = require('cheerio');
const redis = require('redis')
const puppeteer = require('puppeteer')
const client = redis.createClient() 
const fs = require('fs')


const Parse = (async (page) => {
    /// UNCOMMENT IF NEEDED
    /// PAGE SCROLLER
    // await page.evaluate(async () => {
    //     await new Promise((resolve) => {
    //       let totalHeight = 0;
    //       const distance = 1000; // Adjust scroll distance if needed
    //       const timer = setInterval(() => {
    //         const scrollHeight = document.body.scrollHeight;
    //         window.scrollBy(0, distance);
    //         totalHeight += distance;
      
    //         if (totalHeight >= scrollHeight) {
    //           clearInterval(timer);
    //           resolve();
    //         }
    //       }, 1); // Adjust scroll speed as needed
    //     });
    // });


    const coinInfo = [
        'id',
        'icon',
        'name',
        'symbol',
        'price',
        '1h',
        '24h',
        '7d',
        'shortMarketCap',
        'makertCap',
        'Volume24h',
        'VolumeInCoin',
        'Circulating Supply',
        '7dCandle'
    ]
    
    const $ = cheerio.load(await page.content());
    const selector = '#__next > div > div.main-content > div.cmc-body-wrapper > div > div:nth-child(1) > div.sc-beb003d5-2.bkNrIb > table > tbody > tr'
    
    
    $(selector).each(async (parentIndex, parentElem) => {
        var indx = 0
        const coin = {}
        $(parentElem).children().each((index, elem) => {
            var value = $(elem).text()
            if(index == 2){
                value = $('div > a > div',$(elem).html()).find('img').attr('src')
                coin[coinInfo[indx]] = value
                indx++
                value = $('p:first-child',$(elem).html()).text()
                coin[coinInfo[indx]] = value
                indx++
                value = $('.coin-item-symbol',$(elem).html()).text()
                coin[coinInfo[indx]] = value
                indx++
            }
            else if(index == 7){
                value = $('span:first-child',$(elem).html()).text()
                coin[coinInfo[indx]] = value
                indx++
                value = $('span:eq(1)',$(elem).html()).text()
                coin[coinInfo[indx]] = value
                indx++
    
            }
            else if(index == 8){
                value = $('p:eq(0)',$(elem).html()).text()
                coin[coinInfo[indx]] = value
                indx++
                value = $('p:eq(1)',$(elem).html()).text()
                coin[coinInfo[indx]] = value
                indx++
    
            }
            else if(value){
                coin[coinInfo[indx]] = value
                indx++
            }
            else if(index == 10){
                value = $($(elem)).find('img').attr('src')
                coin[coinInfo[indx]] = value
                indx++
            }

            ///SAVE PATH FOR ICONS
            const path = `./coin_icon/icon_${coin.symbol}.png`

            ///UNCOMENT IF NEEDED ICONS
            //saveIcon(coin.icon, path )

        })
        await client.hSet('CoinMarketCap', coin.symbol, JSON.stringify(coin))    
    })
    
})


const saveIcon = (imageUrl, savePath) => {
    https.get(imageUrl, response => {
        const fileStream = fs.createWriteStream(savePath);
        response.pipe(fileStream);
      
        fileStream.on('finish', () => {
          fileStream.close();
          console.log('Image saved successfully.');
        });
      }).on('error', error => {
        console.error('Error downloading the image:', error);
      });

}

const startParse = async () => {
    console.log('Started parsing...')
    const startTime = new Date()
    await client.connect();
  
    const browser = await puppeteer.launch({ headless: "false" });
    const maxConcurrentPages = 12; // Adjust the number of concurrent pages as per your system's capacity
  
    const promises = [];
  
    for (let i = 1; i <= 97; i++) {
      const promise = (async () => {
        const page = await browser.newPage();
        page.setViewport({   width: 640, height: 8000, })
        const URL = `https://coinmarketcap.com/?page=${i}`;
        await page.goto(URL);
        await Parse(page);
        await page.close();
      })();
  
      promises.push(promise);
  
      if (promises.length >= maxConcurrentPages) {
        await Promise.race(promises);
        promises.splice(0, maxConcurrentPages);
      }
    }
  
    await Promise.all(promises);
  
    await browser.close();
    const endTime = new Date()
    console.log('Finished in', endTime - startTime, 'ms')
  };
  

  startParse();
  
