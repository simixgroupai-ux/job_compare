process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');

async function run() {
    const url = "https://maps.app.goo.gl/grLis8JasaRY1gyd7";
    console.log("Fetching:", url);

    try {
        const response = await fetch(url, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log("Final URL:", response.url);

        const text = await response.text();
        fs.writeFileSync('debug_maps.html', text);
        console.log("Saved HTML to debug_maps.html");
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
