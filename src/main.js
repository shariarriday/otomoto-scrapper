import regeneratorRuntime from "regenerator-runtime";

import { getAdPagesList, initBrowser, makeTruckItems } from "./scrapper/pageLoader";
import { chunk } from "lodash";
import { writeFile } from 'fs';

const initUrl = "https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/od-2014/q-actros?search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at+%3Adesc";

const CHUNKSIZE = 8;

async function main() 
{
    const browser = await initBrowser();
    
    let adsList = await getAdPagesList(browser, initUrl);
    
    let adChunk = chunk(adsList, CHUNKSIZE);

    let truckInfo = [];

    for(let i = 0; i < adChunk.length; i++)
    {
        let scrapeTruckPromise = adChunk[i].map((element) => {
            return makeTruckItems(browser, element);
        });

        //Finish working with a chunk and enter all the object to the array
        await Promise.all(scrapeTruckPromise).then(value => truckInfo.push(value));
    }
    
    writeFile("TruckInfo.json", JSON.stringify(truckInfo), () => {
        console.log("File written successfully");
        browser.close();
        return;
    });
}

main();