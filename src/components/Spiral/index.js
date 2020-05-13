import React from 'react'

// AudioContext
import { ctx, analyser } from '../../utils/getAnalyser'

import styles from '../../styles.module.css'
const { 
  Scene, 
  PerspectiveCamera,
  WebGLRenderer, 
  Group, 
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  BufferGeometry
 } = require('three')


// ThreeJS
var camera, scene, renderer, canvas
var particles = []
var circleCounter

var parent

// Props and Default Props
var settings

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      source: {}
    }
  }

  componentDidMount() {
    settings = {
      R: 0.7,
      G: 0,
      B: 0.7,
      fov: 50,
      intensity: 0.08,
      radius: 65,
      minRadius: 35,
      maxRadius: 65,
      animate: true
    }

    this.setupRendering()
    this.setupParticles()
    this.setupEventHandlers()
    this.animate()
  }

  setupRendering() {
    // Get parent element
    parent = this.poop.parentElement

    scene = new Scene()

    // Camera
    const cameraSettings = {
      fov: 20,
      width: parent.clientWidth,
      height: parent.clientHeight
    }
    camera = new PerspectiveCamera(
      cameraSettings.fov,
      cameraSettings.width / cameraSettings.height,
      1,
      10000
    )
    camera.position.set(0, 0, 175)

    // Renderer
    // renderer = new THREE.CanvasRenderer({ alpha: true })
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(parent.clientWidth, parent.clientHeight)
    renderer.setClearColor(0x000000, 0)

    // Create canvas and append it
    canvas = renderer.domElement
    // Create Canvas in HTML imperatively
    // document.body.appendChild( renderer.domElement );
    // use ref as a mount point of the Three.js scene instead of the document.body
    this.poop.appendChild(canvas)
  }

  // Set up Particles Geometry
  setupParticles() {
    let particle
    const particleGroup = new Group();

    for (let i = 0; i <= 2048; i++) {
      //WebGL
      let geometry = new BufferGeometry().fromGeometry(new SphereGeometry(0.33, 0.33, 0.33));
      let material = new MeshBasicMaterial({ color: 0xffff00 });

      // particle = particles[i++] = new THREE.Particle(material)
      particle = particles[i++] = new Mesh(geometry, material);
      particleGroup.add(particle)
    }
    scene.add(particleGroup);
  }

  animate = () => {
    requestAnimationFrame(this.animate)

    this.animateParticles()
    this.changeCircleRadius()

    camera.lookAt(scene.position)
    renderer.render(scene, camera)
  }

  changeCircleRadius() {
    if (settings.animate) {
      if (circleCounter) {
        settings.radius += 0.05
        if (settings.radius >= settings.maxRadius) {
          circleCounter = false
        }
      } else {
        settings.radius -= 0.05
        if (settings.radius <= settings.minRadius) {
          console.log('hit')
          circleCounter = true
        }
      }
    }
  }

  animateParticles() {
    const { radius, intensity } = settings

    const timeByteData = new Uint8Array(analyser.fftSize)
    const timeFloatData = new Float32Array(analyser.fftSize)
    analyser.getByteTimeDomainData(timeByteData)
    analyser.getFloatTimeDomainData(timeFloatData)

    for (let j = 0; j <= particles.length; j++) {
      const particle = particles[j++]

      // COLOR
      const R = settings.R + timeFloatData[j]
      const G = settings.G - timeFloatData[j]
      const B = settings.B - timeFloatData[j]
      particle.material.color.setRGB(R, G, B)

      // CIRCLE
      particle.position.x = Math.sin(j) * (j / (j / radius))
      particle.position.y = timeFloatData[j] * timeByteData[j] * intensity
      particle.position.z = Math.cos(j) * (j / (j / radius))
      camera.position.y = 80
      camera.fov = 35
    }
    camera.fov = settings.fov
    camera.updateProjectionMatrix()
  }

  windowResize() {
    let width = window.innerWidth
    let height = window.innerHeight

    width = parent.clientWidth
    height = parent.clientHeight

    console.log({ width, height }, settings.radius)

    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  setupEventHandlers() {
    const ref = this.props.audioRef2 || this.props.audioRef
    const audio = ref.current
    const source = ctx.createMediaElementSource(audio) // creates audio source

    audio.addEventListener('play', () => {
      console.log('PLAY event')
      ctx.resume();
    })

    audio.addEventListener('pause', () => {
      console.log('PAUSE event')
    })

    audio.addEventListener('loadeddata', () => {
      console.log('LOADED_DATA event')
      source.connect(ctx.destination) // connects the audioNode to the audioDestinationNode (computer speakers)
      source.connect(analyser) // connects the analyser node to the audioNode and the audioDestinationNode
    })

    audio.addEventListener('ended', () => {
      console.log('ENDED event')
      // Force call initiateAudio to "replay" the song
      // this.audio.load();
      // this.audio.play();
    })

    window.addEventListener('resize', this.windowResize, false)
  }

  render() {
    return (
      <div
        // onClick={this.handleClick}
        className={styles.circle}
        ref={(ref) => (this.poop = ref)}
      >
        {/* Canvas Goes Here */}
      </div>
    )
  }
}

export default React.forwardRef((props, ref) => (
  <App audioRef2={ref} {...props} />
))
