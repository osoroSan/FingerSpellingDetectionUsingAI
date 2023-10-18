const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const warnings = document.querySelector('#warnings')

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
  camera.start()
})
    // Get the button element by its ID
    var resetBtn = document.getElementById('resetBtn');

    // Add a click event listener to the button
    resetBtn.addEventListener('click', function() {
        // Refresh the page when the button is clicked
        location.reload();
    });
