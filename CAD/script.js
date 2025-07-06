
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
            link.href = url + '/styles.css';
            document.head.appendChild(link);
            
            document.getElementById(elementId).innerHTML = data;
        })
        .catch(error => console.error('Error loading HTML:', error));
}


document.addEventListener('DOMContentLoaded', () => {
    loadHTML('header', '/header');
    loadHTML('CAD', '/CAD/src');
});
