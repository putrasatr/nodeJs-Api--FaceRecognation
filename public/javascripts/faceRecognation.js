const faceapi = require('../../dist/face-api')
const fs = require('fs')
const path = require('path')
require('../js/commons')
require('../js/faceDetectionControls')


const SSD_MOBILENETV1 = 'ssd_mobilenetv1'
let minConfidence = 0.5

// tiny_face_detector options
let inputSize = 512
let scoreThreshold = 0.5
let selectedFaceDetector = SSD_MOBILENETV1

function getFaceDetectorOptions() {
    return selectedFaceDetector === SSD_MOBILENETV1
        ? new faceapi.SsdMobilenetv1Options({ minConfidence })
        : new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
}
function getCurrentFaceDetectionNet() {
    if (selectedFaceDetector === SSD_MOBILENETV1) {
        return faceapi.nets.ssdMobilenetv1
    }
    if (selectedFaceDetector === TINY_FACE_DETECTOR) {
        return faceapi.nets.tinyFaceDetector
    }
}

// implements nodejs wrappers for HTMLCanvasElement, HTMLImageElement, ImageData
const { Canvas, Image, ImageData, createCanvas, loadImage } = require('canvas')

// patch nodejs environment, we need to provide an implementation of
// HTMLCanvasElement and HTMLImageElement
// const  = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData})

// async function uploadRefImage(e) {
//     const imgFile = $('#refImgUploadInput').get(0).files[0]
//     const img = await faceapi.bufferToImage(imgFile)
//     $('#refImg').get(0).src = img.src
//     updateReferenceImageResults()
// }

// async function uploadQueryImage(e) {
//     const imgFile = $('#queryImgUploadInput').get(0).files[0]
//     const img = await faceapi.bufferToImage(imgFile)
//     $('#queryImg').get(0).src = img.src
//     updateQueryImageResults()
// }

async function updateReferenceImageResults() {
    let refImageDir = path.join(__dirname, `../images/dybala.jpeg`)

    const canvas = createCanvas(200, 200)
    const ctx = canvas.getContext('2d')

    // Write "Awesome!"
    ctx.font = '30px Impact'
    ctx.rotate(0.1)
    ctx.fillText('Awesome!', 50, 100)

    // Draw line under text
    var text = ctx.measureText('Awesome!')
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath()
    ctx.lineTo(50, 102)
    ctx.lineTo(50 + text.width, 102)
    ctx.stroke()
    const modelPathRoot = '../../weights'
    const modelPath = path.join(__dirname, modelPathRoot);
    // console.log(modelPath)
    faceapi.loadFaceLandmarkModel(modelPath)
    faceapi.loadFaceRecognitionModel(modelPath)
    faceapi.loadSsdMobilenetv1Model(modelPath)
    // // Draw cat with lime helmet
    // let image = await loadImage(refImageDir)
    // ctx.drawImage(image, 50, 0, 70, 70)
    // // let inputImgEl = `<img id="image" src="${canvas.toDataURL()}" alt="image"/>`
    // let inputImgEl = await fs.readFileSync(refImageDir)
    // let img = new Image()
    // img.onload = () => ctx.drawImage(img, 0, 0)
    // img.onerror = err => { throw err }
    // img.src = inputImgEl
    // // let inputImgEl = canvas.toDataURL()
    // const fullFaceDescriptions = await faceapi
    //     .detectAllFaces(img)
    //     .withFaceLandmarks()
    //     .withFaceDescriptors()
    // // console.log(fullFaceDescriptions)


    // const data = await fs.readFileSync(refImageDir, { encoding: 'base64' })
    // const inputImgEl = await canvas.loadImage('../images/dybala.jpeg')
    // console.log(inputImgEl)

    // if (!fullFaceDescriptions.length) {
    //     return
    // }

    // // create FaceMatcher with automatically assigned labels
    // // from the detection results for the reference image
    // faceMatcher = new faceapi.FaceMatcher(fullFaceDescriptions)

    // faceapi.matchDimensions(canvas, inputImgEl)
    // // resize detection and landmarks in case displayed image is smaller than
    // // original size
    // const resizedResults = faceapi.resizeResults(fullFaceDescriptions, inputImgEl)
    // // draw boxes with the corresponding label as text
    // const labels = faceMatcher.labeledDescriptors
    //     .map(ld => ld.label)
    // resizedResults.forEach(({ detection, descriptor }) => {
    //     const label = faceMatcher.findBestMatch(descriptor).toString()
    //     const options = { label }
    //     const drawBox = new faceapi.draw.DrawBox(detection.box, options)
    //     drawBox.draw(canvas)
    // })
}
updateReferenceImageResults()

async function updateQueryImageResults() {
    if (!faceMatcher) {
        return
    }

    const inputImgEl = $('#queryImg').get(0)
    const canvas = $('#queryImgOverlay').get(0)
    console.log('inputImgEl', inputImgEl)
    console.log('canvas', canvas)
    const results = await faceapi
        .detectAllFaces(inputImgEl, getFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
    faceapi.matchDimensions(canvas, inputImgEl)
    // resize detection and landmarks in case displayed image is smaller than
    // original size
    const resizedResults = faceapi.resizeResults(results, inputImgEl)

    resizedResults.forEach(({ detection, descriptor }) => {
        const label = faceMatcher.findBestMatch(descriptor).toString()
        const options = { label }
        const drawBox = new faceapi.draw.DrawBox(detection.box, options)
        drawBox.draw(canvas)
    })
}

async function updateResults() {
    await updateReferenceImageResults()
    await updateQueryImageResults()
}

async function run() {
    // load face detection, face landmark model and face recognition models
    await changeFaceDetector(selectedFaceDetector)
    await faceapi.loadFaceLandmarkModel('/')
    await faceapi.loadFaceRecognitionModel('/')
}

