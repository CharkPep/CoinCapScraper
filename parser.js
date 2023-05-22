const cheerio = require('cheerio');
const axios = require('axios')
const redis = require('redis')
const puppeteer = require('puppeteer')
const client = redis.createClient() 
const https = require('https');
const fs = require('fs');

// async function autoScroll(page){
//     await page.evaluate(async () => {
//         await new Promise((resolve) => {
//             var totalHeight = 0;
//             var distance = 100;
//             var timer = setInterval(() => {
//                 var scrollHeight = document.body.scrollHeight;
//                 window.scrollBy(0, distance);
//                 totalHeight += distance;

//                 if(totalHeight >= scrollHeight - window.innerHeight){
//                     clearInterval(timer);
//                     resolve();
//                 }
//             }, 100);
//         });
//     });
// }

function timeoutFunction(delay) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, delay);
    });
  }
  

const Parse = (async (page) => {
    // await page.evaluate(async () => {
    //     await new Promise((resolve) => {
    //       let totalHeight = 0;
    //       const distance = 3000;
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
                //Icon
                //console.log($('div > a > div',$(elem).html()).find('img').attr('src'))
                value = $('div > a > div',$(elem).html()).find('img').attr('src')
                coin[coinInfo[indx]] = value
                indx++
                //Name
                ///console.log($('p:first-child',$(elem).html()).text())
                value = $('p:first-child',$(elem).html()).text()
                coin[coinInfo[indx]] = value
                indx++
                //Symbol
                //console.log($('.coin-item-symbol',$(elem).html()).text())
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
            //console.log(index, $(elem).text())
            //console.log(coinInfo[indx])
            const path = `./coin_icon/icon_${coin.symbol}.png`
            //saveIcon(coin.icon, path )

        })
        //console.log(coin.symbol, coin.id)

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
    console.log(endTime - startTime)
  };
  

  startParse();
  
