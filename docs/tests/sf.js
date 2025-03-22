self.sf1Sentinel = true;

setTimeout(( ) => {
    self.sf2Sentinel = true;
}, 1);

self.sf3Sentinel = true;

self.sf4Sentinel = new Promise(resolve => {
    const xhr = new XMLHttpRequest();
    xhr.onload = ev => {
        const result = [];
        for ( const json of ev.target.responseText.split(/\n+/) ) {
            if ( json === '' ) { continue; }
            result.push(JSON.parse(json));
        }
        xhr.onload = null;
        resolve(result);
    };
    xhr.open('GET', './abc.jsonl');
    xhr.send();
});

self.sf5Sentinel = new Promise(resolve => {
    return fetch('./abc.jsonl').then(response =>
        response.text()
    ).then(text => {
        const result = [];
        for ( const json of text.split(/\n+/) ) {
            if ( json === '' ) { continue; }
            result.push(JSON.parse(json));
        }
        resolve(result);
    });
});
