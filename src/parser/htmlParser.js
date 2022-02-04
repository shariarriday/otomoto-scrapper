import * as cheerio from "cheerio";

async function htmlLoader(html) {
    
    const $ = cheerio.load(html);

    return $;
}

async function htmlLoadElement($, elementId) {
    return await $(elementId);
}

export async function addItems(html) {
    const $ = await htmlLoader(html);

    const listMain = await htmlLoadElement($, "main");
    const listItems = listMain.children("article");

    const ads = [];
    listItems.each((idx, element) => {
        //console.log("Id: ", element.attribs.id);
        //console.log("Href: ", $(element).find("a").attr("href"));

        let ad = { id: element.attribs.id, link: $(element).find("a").attr("href") };
        ads.push(ad);
    })
    
    return ads;
}

export async function getTotalAdsCount(html) {
    try {
        const $ = await htmlLoader(html);
        const resultsHeading = await htmlLoadElement($, "h1.e1l24m9v0.ooa-x3g7qd-Text.eu5v0x0");
        
        let totalString = resultsHeading[0].childNodes[0].data;
    
        // resultsHeading.each((idx, element) => {
        //     if(element.name == "h1")
        //         totalSring = element.childNodes[0].data;
        // })
    
        let adCount = totalString.split(' ')[2];
    
        return adCount;
    }
    catch (e)
    {
        console.error(e);
        return -1;
    }
}

export async function scrapeTruckItem(html) {
    const $ = await htmlLoader(html);

    const listItems = await htmlLoadElement($, "div[class=offer-params__value]");

    const vehicleTitleElement = await htmlLoadElement($, "span.offer-title.big-text.fake-title");
    const vehicleTitle = vehicleTitleElement[0]?.childNodes[2].data.trim() || "Unavailable";
    const vehiclePriceElement = await htmlLoadElement($, "div[class=offer-price]");
    const vehiclePrice = vehiclePriceElement[0]?.attribs["data-price"].replace(' ', '') || "Unavailable";
    const vehicleModel = listItems[3]?.childNodes[0].data.trim() || "Unavailable";
    const vehicleProduction = listItems[4]?.childNodes[0].data.trim() || "Unavailable";
    const vehicleRegistration = listItems[14]?.childNodes[0].data.trim() || "Unavailable";
    const vehicleMileage = listItems[5]?.childNodes[0].data.trim() || "Unavailable";
    const vehiclePower = listItems[7]?.childNodes[0].data.trim() || "Unavailable";

    return {
        title: vehicleTitle,
        price: vehiclePrice,
        model: vehicleModel,
        productionDate: vehicleProduction,
        registrationDate: vehicleRegistration,
        milage: vehicleMileage,
        power: vehiclePower
    }
}