const faceapi = require('../../dist/face-api')
require('../js/commons')
require('../js/bbt')
require('../js/imageSelectionControls')
require('../js/faceDetectionControls')
let faceMatcher = null

async function uploadRefImage(e) {
    const imgFile = $('#refImgUploadInput').get(0).files[0]
    const img = await faceapi.bufferToImage(imgFile)
    $('#refImg').get(0).src = img.src
    updateReferenceImageResults()
}

async function loadRefImageFromUrl(url) {
    const img = await requestExternalImage($('#refImgUrlInput').val())
    $('#refImg').get(0).src = img.src
    updateReferenceImageResults()
}

async function uploadQueryImage(e) {
    const imgFile = $('#queryImgUploadInput').get(0).files[0]
    const img = await faceapi.bufferToImage(imgFile)
    $('#queryImg').get(0).src = img.src
    updateQueryImageResults()
}

async function loadQueryImageFromUrl(url) {
    const img = await requestExternalImage($('#queryImgUrlInput').val())
    $('#queryImg').get(0).src = img.src
    updateQueryImageResults()
}

async function updateReferenceImageResults() {
    const inputImgEl = $('#refImg').get(0)
    const canvas = $('#refImgOverlay').get(0)

    const fullFaceDescriptions = await faceapi
        .detectAllFaces(inputImgEl, getFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()

    if (!fullFaceDescriptions.length) {
        return
    }

    // create FaceMatcher with automatically assigned labels
    // from the detection results for the reference image
    faceMatcher = new faceapi.FaceMatcher(fullFaceDescriptions)

    faceapi.matchDimensions(canvas, inputImgEl)
    // resize detection and landmarks in case displayed image is smaller than
    // original size
    const resizedResults = faceapi.resizeResults(fullFaceDescriptions, inputImgEl)
    // draw boxes with the corresponding label as text
    const labels = faceMatcher.labeledDescriptors
        .map(ld => ld.label)
    resizedResults.forEach(({ detection, descriptor }) => {
        const label = faceMatcher.findBestMatch(descriptor).toString()
        const options = { label }
        const drawBox = new faceapi.draw.DrawBox(detection.box, options)
        drawBox.draw(canvas)
    })
}

async function updateQueryImageResults() {
    if (!faceMatcher) {
        return
    }

    const inputImgEl = $('#queryImg').get(0)
    const canvas = $('#queryImgOverlay').get(0)

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