function loadHTML(elementId, url) {
    fetch(url+ "/index.html")
        .then(response => response.text())
        .then(data => {

            const script = document.createElement('script');
            script.src = url + '/script.js';
            document.body.appendChild(script);
            
            document.getElementById(elementId).innerHTML = data;
        })
        .catch(error => console.error('Error loading HTML:', error));
}


document.addEventListener('DOMContentLoaded', () => {
    loadHTML('header', '../header');

    loadHTML('footer', '../footer');
});
