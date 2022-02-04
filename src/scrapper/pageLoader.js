import playwright from 'playwright';
import { addItems, getTotalAdsCount, scrapeTruckItem } from '../parser/htmlParser';

const RETRY = 5;
const ADPERPAGE = 32;

export async function initBrowser() {
    const browser = await playwright.chromium.launch({
        headless: true // setting this to true will not run the UI
    });

    return browser;
}

async function retryGoto(page, url, retryCount)
{
    try
    {
        await page.goto(url);
    }
    catch(e)
    {
        if(retryCount == 0)
            throw(e);
        await retryGoto(page, url, retryCount-1);
    }
}

export async function loadPage(browser, url) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try
    {
        await retryGoto(page, url, RETRY);
        const pageHtml = await page.content();
        return { pageHtml : pageHtml, context: context };
    }
    catch(e)
    {
        console.error(e);
        context.close();
        return {pageHtml: null, context: null};
    }
}

export async function getNextPageUrl(url, pageNumber) {
    const FORWARDITERATOR = 5; // Length of "page=" string that we are searching
    const matchPageRegex = /page=[\d]+/g;
    const index = url.search(matchPageRegex);
    const matchQuery = /\?[A-Za-z]/g;
    
    if (matchQuery.test(url)) //Test if a query string already exists in url
    {
        if(index == -1) //append page query in the end
            return url + "&page=" + pageNumber;
        else
        {
            let matchedPage = url.match(matchPageRegex);
            matchedPage = matchedPage[0];
            let newUrlBegin = url.slice(0,index + FORWARDITERATOR);
            let newUrlEnd = url.slice(index + matchedPage.length, url.length);
            
            return newUrlBegin + pageNumber + newUrlEnd; //replace page query page number
        }
    }
    else
        return url + "?page=" + pageNumber; //New query with page
}

export async function getAdPagesList(browser, initUrl) {
    const initPage = await loadPage(browser, initUrl);

    if (initPage.pageHtml == null || initPage.context == null) return; //Retry failed for the initial page

    let adCount = await getTotalAdsCount(initPage.pageHtml);

    let listingPages = [initPage];

    let ads = [];
    //Open each page in one tab
    for (let i = 2; i <= Math.ceil(adCount / ADPERPAGE); i++) {
        let tmpUrl = await getNextPageUrl(initUrl, i);
        let tmpPage = await loadPage(browser, tmpUrl);
        if (tmpPage.pageHtml == null || tmpPage.context == null) return;
        listingPages.push(tmpPage);
    }

    //Scrape information from each page and close the page after consolidating all the data in ads array;
    for (let i = 0; i < listingPages.length; i++) {
        console.log("Scraping Page:", 1 + i);
        let newAds = await addItems(listingPages[i].pageHtml);
        ads = [...ads, ...newAds];
        listingPages[i].context.close();
    }

    return ads;
}

export async function makeTruckItems(browser, listEntry) {
    const truckPage = await loadPage(browser, listEntry.link);

    if (truckPage.pageHtml == null || truckPage.context == null) return; //Retry failed for the initial page

    let truckInfo = await scrapeTruckItem(truckPage.pageHtml);

    truckPage.context.close();

    truckInfo.id = listEntry.id;

    return truckInfo;
}