self.ffubo1Sentinel = fetch('./sample.json').then(response =>
    response.text()
).then(text =>
    JSON.parse(text)
);
