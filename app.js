// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

// var app = express();

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// module.exports = app;

const express = require('express')
const path = require('path')
const { get } = require('request')
const faceapi = require('./dist/face-api')
const fileUpload = require("express-fileupload");

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const viewsDir = path.join(__dirname, 'views')
app.use(express.static(viewsDir))
app.use(express.static(path.join(__dirname, './public')))
app.use(express.static(path.join(__dirname, './images')))
app.use(express.static(path.join(__dirname, './media')))
app.use(express.static(path.join(__dirname, './weights')))
app.use(express.static(path.join(__dirname, './dist')))
app.use(fileUpload())

app.get('/', (req, res) => res.redirect('/face_detection'))
app.get('/face_detection', (req, res) => res.sendFile(path.join(viewsDir, 'faceDetection.html')))
app.get('/face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'faceLandmarkDetection.html')))
app.get('/face_expression_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'faceExpressionRecognition.html')))
app.get('/age_and_gender_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'ageAndGenderRecognition.html')))
app.get('/face_extraction', (req, res) => res.sendFile(path.join(viewsDir, 'faceExtraction.html')))
app.get('/face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'faceRecognition.html')))
app.get('/video_face_tracking', (req, res) => res.sendFile(path.join(viewsDir, 'videoFaceTracking.html')))
app.get('/webcam_face_detection', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceDetection.html')))
app.get('/webcam_face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceLandmarkDetection.html')))
app.get('/webcam_face_expression_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceExpressionRecognition.html')))
app.get('/webcam_age_and_gender_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'webcamAgeAndGenderRecognition.html')))
app.get('/bbt_face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceLandmarkDetection.html')))
app.get('/bbt_face_similarity', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceSimilarity.html')))
app.get('/bbt_face_matching', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceMatching.html')))
app.get('/bbt_face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceRecognition.html')))
app.get('/batch_face_landmarks', (req, res) => res.sendFile(path.join(viewsDir, 'batchFaceLandmarks.html')))
app.get('/batch_face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'batchFaceRecognition.html')))

app.post('/fetch_external_image', async (req, res) => {
  const { imageUrl } = req.body
  if (!imageUrl) {
    return res.status(400).send('imageUrl param required')
  }
  try {
    const externalResponse = await request(imageUrl)
    res.set('content-type', externalResponse.headers['content-type'])
    return res.status(202).send(Buffer.from(externalResponse.body))
  } catch (err) {
    return res.status(404).send(err.toString())
  }
})

app.post('/register-photo', async (req, res) => {
  try {
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
  } catch (error) {

  }


})

app.listen(3000, () => console.log('Listening on port 3000!'))

function request(url, returnBuffer = true, timeout = 10000) {
  return new Promise(function (resolve, reject) {
    const options = Object.assign(
      {},
      {
        url,
        isBuffer: true,
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
        }
      },
      returnBuffer ? { encoding: null } : {}
    )

    get(options, function (err, res) {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}