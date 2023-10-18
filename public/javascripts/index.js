const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const warnings = document.querySelector('#warnings')
const labels= ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y']

async function loadModel(handImageData,boundingBox) {
  try {
    // Load the model from the 'model1.json' file
    const model = await tf.loadLayersModel('./model1.json');

    // Create a canvas element and set its dimensions to match the input image
    let canvas = document.createElement('canvas');
    canvas.width = handImageData.width;
    canvas.height = handImageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(handImageData, 0, 0);

    // Define the new dimensions for resizing
    const resizedWidth = 28;
    const resizedHeight = 28;

    // Create a new canvas for resizing the image
    let resizeCanvas = document.createElement('canvas');
    resizeCanvas.width = resizedWidth;
    resizeCanvas.height = resizedHeight;
    const resizeCtx = resizeCanvas.getContext('2d');

    // Resize the original image to match the model's input size (28x28)
    resizeCtx.drawImage(canvas, 0, 0, resizedWidth, resizedHeight);

    // Convert resized canvas to grayscale ImageData
    const grayscaleImageData = resizeCtx.getImageData(0, 0, resizedWidth, resizedHeight);
    for (let i = 0; i < grayscaleImageData.data.length; i += 4) {
      const avg = (grayscaleImageData.data[i] + grayscaleImageData.data[i + 1] + grayscaleImageData.data[i + 2]) / 3;
      grayscaleImageData.data[i] = avg;
      grayscaleImageData.data[i + 1] = avg;
      grayscaleImageData.data[i + 2] = avg;
    }

    // Convert grayscale ImageData to tensor
    const inputTensor = tf.browser.fromPixels(grayscaleImageData, 1); // 1 indicates grayscale
    
    // Preprocess the tensor (Normalization and Reshaping)
    const processedTensor = inputTensor
      .toFloat() // Convert to float32 data type
      .div(tf.scalar(255)) // Normalize pixel values to the range [0, 1]
      .reshape([1, resizedWidth, resizedHeight, 1]); // Reshape to match the model's input shape
    
    // Make predictions
    const predictions = model.predict(processedTensor);
    
    // Get predicted class
    const classProbabilities = Array.from(predictions.dataSync());
    const predictedClass = classProbabilities.indexOf(Math.max(...classProbabilities));
    
    drawBoundingBox(canvasCtx, boundingBox, { color: '#FF0000', lineWidth: 1.5 });

    // Draw the predicted class label above the bounding box
    const labelX = boundingBox.x + boundingBox.width / 2;
    const labelY = boundingBox.y - 15; // 5 pixels above the bounding box
    canvasCtx.font = '20px Arial';
    canvasCtx.fillStyle = 'blue';
    canvasCtx.fillText(`${labels[predictedClass]}`, labelX, labelY);

    // Clean up: Dispose tensors to release memory
    inputTensor.dispose();
    processedTensor.dispose();
    predictions.dispose();
    
  } catch (error) {
    console.error('Error loading or predicting from the model:', error);
  }
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      const boundingBox = getHandBoundingBox(landmarks);
      if (boundingBox.width > 100 || boundingBox.height > 100) {
        warnings.textContent="Output : Please move your hand away from the screen";
      }
   
      if (boundingBox.width < 50 || boundingBox.height < 50) {
        warnings.textContent="Output : Please move your hand closer";

      }
      if (boundingBox.width < 100 &&boundingBox.height < 100 && boundingBox.width > 50 && boundingBox.height> 50) {
        warnings.textContent="Output: ";

      }
      // Extract the portion of the image corresponding to the bounding box from the canvas
const handImageData = canvasCtx.getImageData(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
loadModel(handImageData,boundingBox)
       drawBoundingBox(canvasCtx, boundingBox, { color: '#FF0000', lineWidth: 1.5 });

      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 1 });

      // Draw landmarks with reduced size
      for (const landmark of landmarks) {
        const x = landmark.x * canvasElement.width;
        const y = landmark.y * canvasElement.height;

        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 1.5, 0, 2 * Math.PI); // 3 is the radius for the smaller circles
        canvasCtx.fillStyle = '#FF0000'; // Color of the smaller circles
        canvasCtx.fill();
      }
    }
  }
  canvasCtx.restore();
}


function getHandBoundingBox(landmarks) {
  let xMin = Number.MAX_SAFE_INTEGER;
  let yMin = Number.MAX_SAFE_INTEGER;
  let xMax = Number.MIN_SAFE_INTEGER;
  let yMax = Number.MIN_SAFE_INTEGER;
  

  for (const landmark of landmarks) {
    const x = landmark.x * canvasElement.width;
    const y = landmark.y * canvasElement.height;
    xMin = Math.min(xMin, x);
    yMin = Math.min(yMin, y);
    xMax = Math.max(xMax, x);
    yMax = Math.max(yMax, y);
  }

  return { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin };
}

function drawBoundingBox(ctx, box, style) {
  let offset = 10;
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  ctx.strokeRect(box.x - offset, box.y - offset, box.width + 2 * offset, box.height + 2 * offset);
}


const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: videoElement.width,
  height: videoElement.height
});
// ;
const web= document.querySelector('.key1')
web.addEventListener('click',()=>{
  alert("Please wait while the modules are loaded")
  camera.start()
})
    // Get the button element by its ID
    var resetBtn = document.getElementById('resetBtn');

    // Add a click event listener to the button
    resetBtn.addEventListener('click', function() {
        // Refresh the page when the button is clicked
        location.reload();
    });
