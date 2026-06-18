import * as cheerio from "cheerio";
import { fetchPageWithBrowser } from "./browser.js";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1"
};

function findProduct(data) {
  if (!data) return null;
  if (data["@type"] === "Product") return data;
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findProduct(item);
      if (found) return found;
    }
  }
  if (data["@graph"]) {
    for (const item of data["@graph"]) {
      const found = findProduct(item);
      if (found) return found;
    }
  }
  return null;
}

function parseOffer(offer) {
  if (!offer) return null;
  const price = parseFloat(offer.price ?? offer.lowPrice ?? offer.highPrice);
  if (Number.isNaN(price)) return null;
  return {
    price,
    currency: offer.priceCurrency || "USD"
  };
}

function resolveUrl(baseUrl, relative) {
  if (!relative) return null;
  try {
    return new URL(relative, baseUrl).href;
  } catch {
    return null;
  }
}

function normalizeImageUrl(image, baseUrl) {
  if (!image) return null;
  if (typeof image === "string") return resolveUrl(baseUrl, image);
  if (image.url) return resolveUrl(baseUrl, image.url);
  if (Array.isArray(image)) return normalizeImageUrl(image[0], baseUrl);
  return null;
}

function extractImage($, baseUrl) {
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try {
      const product = findProduct(JSON.parse($(script).html() || ""));
      if (product?.image) {
        const url = normalizeImageUrl(product.image, baseUrl);
        if (url) return url;
      }
    } catch {
      // try next script tag
    }
  }

  const metaImage =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $('meta[property="product:image"]').attr("content");

  if (metaImage) return resolveUrl(baseUrl, metaImage);

  const itemprop = $('[itemprop="image"]').first();
  const itempropSrc =
    itemprop.attr("src") || itemprop.attr("content") || itemprop.attr("href");
  if (itempropSrc) return resolveUrl(baseUrl, itempropSrc);

  const imgSelectors = [
    ".product-image img",
    ".product-image-main img",
    "#product-image img",
    ".gallery img",
    "img.product-image",
    ".product img",
    ".thumbnail img",
    ".carousel-inner img",
    "#productPhoto img"
  ];

  for (const selector of imgSelectors) {
    const src =
      $(selector).first().attr("src") || $(selector).first().attr("data-src");
    if (src) return resolveUrl(baseUrl, src);
  }

  return null;
}

function extractFromEmbeddedState(html, pageUrl) {
  const match = html.match(
    /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/
  );
  if (!match) return null;

  try {
    const state = JSON.parse(match[1]);
    const product = state.owProduct?.product;
    if (!product) return null;

    const sku = product.sku;
    const title = product.name || product.displayName || product.seoTitle;
    let price = null;
    const currency = pageUrl.includes(".com.au") ? "AUD" : "USD";

    const priceEntry = state.owProductPrice?.price?.[sku];
    if (priceEntry?.price != null) {
      price = priceEntry.price / 100;
    } else if (product.edlpPrice) {
      price = parseFloat(product.edlpPrice);
    }

    if (price == null || Number.isNaN(price)) return null;

    let imageUrl = null;
    if (product.image) {
      imageUrl = resolveUrl(pageUrl, product.image);
    } else if (product.images?.preview?.[0]) {
      imageUrl = resolveUrl(pageUrl, product.images.preview[0]);
    } else if (product.images?.full?.[0]) {
      imageUrl = resolveUrl(pageUrl, product.images.full[0]);
    }

    return {
      title: title || "",
      price,
      currency,
      imageUrl
    };
  } catch {
    return null;
  }
}

function extractFromJsonLd($) {
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try {
      const data = JSON.parse($(script).html() || "");
      const product = findProduct(data);
      if (!product) continue;

      const offers = product.offers;
      if (!offers) continue;

      const offer = Array.isArray(offers) ? offers[0] : offers;
      const parsed = parseOffer(offer);
      if (!parsed) continue;

      return {
        title: product.name || "",
        ...parsed
      };
    } catch {
      // try next script tag
    }
  }
  return null;
}

function extractFromMeta($) {
  const price = $('meta[property="product:price:amount"]').attr("content");
  if (!price) return null;

  const parsed = parseFloat(price);
  if (Number.isNaN(parsed)) return null;

  return {
    title:
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text().trim(),
    price: parsed,
    currency:
      $('meta[property="product:price:currency"]').attr("content") || "USD"
  };
}

function parsePriceText(raw) {
  if (!raw) return null;

  const text = raw.trim();
  const currencyMap = { "£": "GBP", $: "USD", "€": "EUR", "¥": "JPY" };
  let currency = "USD";

  for (const [symbol, code] of Object.entries(currencyMap)) {
    if (text.includes(symbol)) {
      currency = code;
      break;
    }
  }

  const match = text.match(/[\d,]+\.?\d*/);
  if (!match) return null;

  const price = parseFloat(match[0].replace(/,/g, ""));
  if (Number.isNaN(price)) return null;

  return { price, currency };
}

function extractFromPricePatterns($) {
  const selectors = [
    '[itemprop="price"]',
    "[data-price]",
    ".price_color",
    ".price",
    ".product-price",
    "#price",
    'p[class*="SyLxb"]',
    '[class*="UnitPrice"]'
  ];

  for (const selector of selectors) {
    const el = $(selector).first();
    if (!el.length) continue;

    const raw = el.attr("content") || el.attr("data-price") || el.text().trim();

    const parsed = parsePriceText(raw);
    if (!parsed) continue;

    return {
      title: $("h1").first().text().trim() || $("title").text().trim(),
      ...parsed
    };
  }

  return null;
}

function extractProductFromHtml(html, pageUrl) {
  const $ = cheerio.load(html);
  const priceData =
    extractFromEmbeddedState(html, pageUrl) ||
    extractFromJsonLd($) ||
    extractFromMeta($) ||
    extractFromPricePatterns($);

  if (!priceData) return null;

  return {
    ...priceData,
    imageUrl: priceData.imageUrl || extractImage($, pageUrl)
  };
}

const ALLOWED_CLOUDFLARE_HOSTS = [
  "cdnjs.cloudflare.com",
  "static.cloudflareinsights.com"
];

const CLOUDFLARE_CHALLENGE_PATTERN =
  /cf-browser-verification|challenge-platform|just a moment.*cloudflare/i;

const CLOUDFLARE_BLOCK_PATTERN =
  /cf-browser-verification|challenge-platform|cloudflare|just a moment|attention required/i;

function usesAllowedCloudflareService(html) {
  return ALLOWED_CLOUDFLARE_HOSTS.some((host) => html.includes(host));
}

function isCloudflareBlock(status, html) {
  if (!html) return status === 403 || status === 503;

  if (usesAllowedCloudflareService(html)) {
    return CLOUDFLARE_CHALLENGE_PATTERN.test(html);
  }

  if (status === 403 || status === 503) return true;

  return CLOUDFLARE_BLOCK_PATTERN.test(html);
}

async function fetchWithHttp(url) {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    redirect: "follow"
  });

  const html = await res.text();

  return { status: res.status, html };
}

export async function scrapePrice(url) {
  let html = null;
  let status = null;

  try {
    const httpResult = await fetchWithHttp(url);
    html = httpResult.html;
    status = httpResult.status;

    const httpProduct = extractProductFromHtml(html, url);
    if (httpProduct) return httpProduct;

    if (!httpResult.status.toString().startsWith("2")) {
      const retryable =
        httpResult.status === 403 ||
        httpResult.status === 503 ||
        isCloudflareBlock(httpResult.status, html);

      if (!retryable) {
        throw new Error(`Failed to fetch page (${httpResult.status})`);
      }
    }
  } catch (err) {
    if (!html) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to reach the store website"
      );
    }
  }

  const shouldTryBrowser =
    isCloudflareBlock(status, html) || status === 403 || status === 503;

  if (shouldTryBrowser) {
    try {
      html = await fetchPageWithBrowser(url);
      status = 200;

      const browserProduct = extractProductFromHtml(html, url);
      if (browserProduct) return browserProduct;
    } catch {
      // fall through to error handling below
    }
  }

  if (isCloudflareBlock(status, html)) {
    throw new Error(
      "This site is protected by Cloudflare and blocked automated access. Add the price manually instead."
    );
  }

  // const fs = await import("fs/promises");
  // await fs.writeFile("debug.html", html);

  throw new Error("Could not extract price from this page");
}
