window.onload = function () {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth/2.5, window.innerHeight/3);
    
    const container = document.getElementById('hero-canvas');
    // append in the front of the container rather than the back
    container.insertBefore(renderer.domElement, container.firstChild);

    const light = new THREE.DirectionalLight(0xD3B31F, 3);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    const light2 = new THREE.DirectionalLight(0xD3B31F, 2);
    light.position.set(-5, -5, 5).normalize();
    scene.add(light2);


    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const loader = new THREE.GLTFLoader();
    var model;
    loader.load('public/helmet.glb', (gltf) => {
        model = gltf.scene;
        model.scale.set(1, 1, 1);
        scene.add(model);
    });

   

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    let alt = false;
    let once = false;

    function animate() {
        requestAnimationFrame(animate);
        if (model && !once) {
            camera.position.set(model.position.x + 1, model.position.y + 0.3, model.position.z + 0.1);
            once = true;
        }

        if (model){ 
            if (alt) model.rotation.y += 0.005;
            if (!alt) model.rotation.y -= 0.005;
            if (model.rotation.y >= 0) alt = false;
            else if (model && model.rotation.y <= -2) alt = true;
        }

        

        controls.update();
        renderer.render(scene, camera);
    }
    animate();


    // handle window resizing
    window.addEventListener('resize', () => {
        const width = Math.min(window.innerWidth/3, 200);
        const height = Math.min(window.innerHeight/3, 200);
        

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

};



