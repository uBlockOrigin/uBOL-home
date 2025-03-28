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
    xhr.open('GET', './sample.jsonl');
    xhr.send();
});

self.sf5Sentinel = fetch('./sample.jsonl').then(response =>
    response.text()
).then(text => {
    const result = [];
    for ( const json of text.split(/\n+/) ) {
        if ( json === '' ) { continue; }
        result.push(JSON.parse(json));
    }
    return result;
});

{
    const sentinel = {};
    const frame = document.createElement('iframe');
    sentinel.frame = frame;
    frame.style.display = 'none';
    document.body.appendChild(frame);
    sentinel.getElementsByTagName = frame?.contentWindow?.document
        ? frame.contentWindow.document.body.getElementsByTagName
        : document.body.getElementsByTagName;
    self.sf6Sentinel = sentinel;
}
