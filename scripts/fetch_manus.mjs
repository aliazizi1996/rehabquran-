import https from 'https';
import fs from 'fs';

https.get("https://manus.im/share/file/308b1a67-b4b2-4261-b74b-3b986f21aecc", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    fs.writeFileSync("manus_page.html", data);
    console.log("Downloaded HTML, length:", data.length);
    
    // search for urls
    const matches = data.match(/https?:\/\/[^"'\s\\<>]+/g) || [];
    const interesting = matches.filter(u => 
      u.includes("file") || 
      u.includes("download") || 
      u.includes("308b1a67") || 
      u.includes(".png") || 
      u.includes(".jpg") || 
      u.includes(".svg") ||
      u.includes("share")
    );
    console.log("Interesting URLs count:", interesting.length);
    for (const url of [...new Set(interesting)]) {
      console.log("-", url);
    }
    
    const nextDataMatch = data.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      console.log("Found __NEXT_DATA__!");
      try {
        const json = JSON.parse(nextDataMatch[1]);
        console.log("NextData:", JSON.stringify(json.props?.pageProps, null, 2));
      } catch (e) {
        console.error("JSON err:", e.message);
      }
    }
  });
}).on("error", err => {
  console.error("HTTP error:", err);
});
