function loadHTML(elementId, url) {
    fetch(url+ "/index.html")
        .then(response => response.text())
        .then(data => {

            const script = document.createElement('script');
            script.src = url + '/script.js';
            document.body.appendChild(script);

            // add stylesheet
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url + '/style.css';
            document.head.appendChild(link);
                    
            document.getElementById(elementId).innerHTML = data;
        })
        .catch(error => console.error('Error loading HTML:', error));
}


document.addEventListener('DOMContentLoaded', () => {
    loadHTML('header', 'header');

    loadHTML('footer', 'footer');
});


function loadFolder(folder) {
    // logs all HTML files in the folder
    fetch(folder)
        .then(response => response.text())
        .then(data => {
            // get the file names
            let fileNames = data.match(/href="[^"]+"/g);
            fileNames = fileNames.map(fileName => fileName.slice(6, -1));

            // load the HTML files
            fileNames.forEach(fileName => {
                if (fileName.endsWith('.html')) {
                    loadHTML(fileName.slice(0, -5), folder + '/' + fileName);
                }
            });
        })
        .catch(error => console.error('Error loading folder:', error));
}
