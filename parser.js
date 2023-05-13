const cheerio = require('cheerio');
const axios = require('axios')
const redis = require('redis')
const puppeteer = require('puppeteer')
const client = redis.createClient() 
const https = require('https');
const fs = require('fs');

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

const Parse = (async (page) => {
    // const res = await axios({ 
    //     method : 'GET',
    //     url : URL
    // })

    
    await autoScroll(page);


    //console.log(await page.content())

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
            saveIcon(coin.icon, path )

        })
        console.log(coin.symbol, coin)
    
        
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

const startParse = (async () => {
    await client.connect()
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    for(var i = 1;i <= 97;i++){
        const URL = `https://coinmarketcap.com/?page=${i}`
        await page.goto(URL);

        await Parse(page)
    }
})


module.exports = {
    startParse
}
