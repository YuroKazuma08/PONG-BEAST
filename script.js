'use strict'



/**
 * --------------------------------------------------- PONG-BEAST v1.0 --------------------------------------------------- 
 * Author:              Piolo Quintos
 * Date Finished:       Monday, August 16, 2021 - 3:00 PM
 * Most Recent Update:  Monday, August 16, 2021 - 3:00 PM (V1.0)
 * 
 * Version History:
 *    V1.0 >   Created PONG-BEAST v1.0
 * 
 * Table of Contents:
 *    SECTION 1: VARIABLE DECLARATIONS    -  LINE 38
 *       >  GET DOM ELEMENTS              -  LINE 41
 *       >  FOR CANVAS SCALING            -  LINE 48
 *       >  GAME STATE VARIABLES          -  LINE 51
 *    SECTION 2: CANVAS SCALING           -  LINE 62
 *    SECTION 3: GAME FUNCTIONS           -  LINE 79
 *       >  GAME CLOCK                    -  LINE 82
 *       >  PLAYER 1 CONTROLS             -  LINE 100
 *       >  PLAYER 2 CONTROLS             -  LINE 112
 *       >  AI CONTROL SYSTEM             -  LINE 122
 *       >  UPDATE ANIMATION FRAME        -  LINE 193
 *       >  CALL NEXT ANIMATION FRAME     -  LINE 207
 *    SECTION 4: PONG AI CALCULATIONS     -  LINE 248
 *    SECTION 5: GAME OBJECTS             -  LINE 304
 *       >  PADDLE CLASS                  -  LINE 307
 *       >  PONG BALL CLASS               -  LINE 338
 *       >  INSTANTIATE CLASSES           -  LINE 378
 *    SECTION 6: EVENT LISTENERS          -  LINE 396
 *       >  FOR PLAYER CONTROLS           -  LINE 399
 *       >  START BUTTON                  -  LINE 428
 *  ---------------------------------------------------------------------------------------------------------------------- 
 */



/* ----------------------------------------------------- SECTION 1 ----------------------------------------------------- */
/* ----------------------------------------------- VARIABLE DECLARATIONS ----------------------------------------------- */

// GET DOM ELEMENTS
const [ p1score, p2score ] = [...document.querySelectorAll('h1')];
const startBtn = document.querySelector('.start-btn');
const cover = document.querySelector('.cover');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// FOR CANVAS SCALING
const scale = window.devicePixelRatio;

// GAME STATE VARIABLES
let keyState = {};
let isNear = false;
let bounceCount = 0;
let lastFrameTime = 0;
let isGameOver = false;
let movePlayerTwo = false;
let calculatedPosition = 0;



/* ----------------------------------------------------- SECTION 2 ----------------------------------------------------- */
/* -------------------------------------------------- CANVAS SCALING -------------------------------------------------- */

function fixCanvas() {
   
   const newHeight = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
   const newWidth = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);

   canvas.setAttribute('height', newHeight * scale);
   canvas.setAttribute('width', newWidth * scale);

}

fixCanvas();



/* ----------------------------------------------------- SECTION 3 ----------------------------------------------------- */
/* -------------------------------------------------- GAME FUNCTIONS -------------------------------------------------- */

// GAME CLOCK - USED TO ANIMATE FRAMES AND GOVERN GAME STATES
function gameClock(currentFrame) {

   if (isGameOver) {

      const dt = (currentFrame - lastFrameTime) / 1000;

      if (dt >= 2.5) {

         isGameOver = false;
         lastFrameTime = currentFrame;

         restartGame();

      }

   } else {

      // PLAYER 1 CONTROLS

      if (keyState['w'] && Math.abs(player1.dy) < 7) player1.dy--;
      if (!keyState['w'] && player1.dy < 0) player1.dy++;
      if (keyState['s'] && Math.abs(player1.dy) < 7) player1.dy++;
      if (!keyState['s'] && player1.dy > 0) player1.dy--;

      /*    < ------------------------ ENABLE ONLY FOR TWO PLAYER MODE ------------------------ >

      // NOTE:
      // UNCOMMENT PLAYER 2 CONTROLS IN SECTION 6: EVENT LISTENERS TO ENABLE TWO PLAYER CONFIGURATION.

      // PLAYER 2 CONTROLS

      if (keyState['arrowup'] && Math.abs(player2.dy) < 7 && !movePlayerTwo) player2.dy--;
      if (!keyState['arrowup'] && player2.dy < 0) player2.dy++;
      if (keyState['arrowdown'] && Math.abs(player2.dy) < 7 && !movePlayerTwo) player2.dy++;
      if (!keyState['arrowdown'] && player2.dy > 0) player2.dy--;

      */ // < ------------------------ ENABLE ONLY FOR TWO PLAYER MODE ------------------------ >


      /* ------------------------------------------- AI CONTROL SYSTEM ------------------------------------------- */
      
      
      if (player2.dy < 0) player2.dy++;
      if (player2.dy > 0) player2.dy--;

      if (movePlayerTwo) {

         const distanceToMove = calculatedPosition - (player2.position.y + (player2.height / 2));
         
         if (Math.abs(distanceToMove) > 21 && player2.position.y + player2.dy >= 0
            && player2.position.y + player2.height + player2.dy <= canvas.height) {

            if (distanceToMove > 0 && Math.abs(player2.dy) < 7) {

               player2.dy += 2;

            } else if (distanceToMove < 0 && Math.abs(player2.dy) < 7) {

               player2.dy -= 2;

            }

         }

      }


      /* ------------------------------------------- AI CONTROL SYSTEM ------------------------------------------- */

      
      if (collisionWithPlayerOne()) {

         pong.velocity.x = -pong.velocity.x;
         pong.velocity.y += player1.dy / 2;
         bounceCount++;
         if (bounceCount % 10 === 0 && Math.abs(pong.velocity.x) < 25) pong.velocity.x += pong.velocity.x > 0 ? 1: -1;

         calculatedPosition = calculatePosition();


      } else if (collisionWithPlayerTwo()) {

         movePlayerTwo = false;

         pong.velocity.x = -pong.velocity.x;
         pong.velocity.y += player2.dy / 2;
         bounceCount++;
         if (bounceCount % 10 === 0 && Math.abs(pong.velocity.x) < 25) pong.velocity.x += pong.velocity.x > 0 ? 1: -1;
         
      }

      if (pong.position.x - pong.radius + pong.velocity.x < 0) {                    // PLAYER 2 WINS THE ROUND

         lastFrameTime = currentFrame;

         let score = +p2score.innerHTML.match(/(?<=^PONG-BEAST v1\.0<br><br>SCORE: )\d+$/g)[0];
         p2score.innerHTML = `PONG-BEAST v1.0<br><br>SCORE: ${++score}`;
         isGameOver = true;

      } else if (pong.position.x + pong.radius + pong.velocity.x > canvas.width) {  // PLAYER 1 WINS THE ROUND

         lastFrameTime = currentFrame;

         let score = +p1score.innerHTML.match(/(?<=^PLAYER 1 \(YOU\)<br><br>SCORE: )\d+$/g)[0];
         p1score.innerHTML = `PLAYER 1 (YOU)<br><br>SCORE: ${++score}`;
         isGameOver = true;

      }


      // UPDATE ANIMATION FRAME

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      player1.updatePosition();
      player1.drawPaddle();
      player2.updatePosition();
      player2.drawPaddle();

      pong.updateBallPosition();
      pong.drawBall();

   }

   // CALL NEXT ANIMATION FRAME
   
   window.requestAnimationFrame(gameClock);

}



function collisionWithPlayerTwo() {

   return pong.position.x + pong.radius + pong.velocity.x >= player2.position.x &&
         pong.position.y - pong.velocity.y >= player2.position.y + player2.dy &&
         pong.position.y + pong.velocity.y <= player2.position.y + player2.height + player2.dy;

}

function collisionWithPlayerOne() {

   return pong.position.x - pong.radius + pong.velocity.x <= player1.position.x + player1.width &&
         pong.position.y - pong.velocity.y >= player1.position.y + player1.dy &&
         pong.position.y + pong.velocity.y <= player1.position.y + player1.height + player1.dy;

}

function restartGame() {

   player1.position.y = Math.round((canvas.height / 2) - (player1.height / 2));
   player2.position.y = Math.round((canvas.height / 2) - (player2.height / 2));

   pong.position = {
      x: Math.round((canvas.width / 2) - pong.radius),
      y: Math.round((canvas.height / 2) - pong.radius)
   }
   pong.velocity = {
      x: -5,
      y: Math.round((Math.random() - 0.5) * 10)
   }

}


/* ----------------------------------------------------- SECTION 4 ----------------------------------------------------- */
/* --------------------------------------------- FOR PONG AI CALCULATIONS --------------------------------------------- */


/**
 * function calculatePosition >  This function is used to predict the Pong Ball's future position after colliding with the player's paddle
 *                               and will be used to move PONG-BEAST V1.0's paddle so as to collide with the Pong Ball.
 * 
 * timeCalculated    - The total time it takes for the Pong Ball to reach the opposite paddle.
 * displacement      - The total distance the Pong Ball will travel with respect to the Y-Axis.
 * bounces           - The total amount of times that the Pong Ball will collide with the top and bottom walls of the canvas.
 * r                 - The remaining amount of distance that the ball will travel with respect to the Y-Axis after last wall collision/bounce.
 * finalPosition     - The calculated Position of the Pong Ball in the Y-Axis during collision with the opposite paddle.
 */

function calculatePosition() {

   const timeCalculated = ((player2.position.x - (player1.position.x + player1.width) - (pong.radius * 2)) / Math.abs(pong.velocity.x));
   const displacement = (Math.abs(pong.velocity.y)) * timeCalculated;

   let bounces = 0;
   let r = 0;
   let finalPosition = undefined;

   if (displacement > canvas.height - pong.position.y || displacement > pong.position.y) {

      if (pong.velocity.y > 0) {          // PONG BALL IS INITIALLY GOING DOWN

         bounces = Math.floor((displacement - (canvas.height - pong.position.y - pong.radius)) / (canvas.height - (pong.radius * 2))) + 1;
         r = displacement - ((canvas.height - (pong.radius * 2)) * (bounces - 1)) - (canvas.height - pong.position.y - pong.radius);
         finalPosition = bounces % 2 === 0 ? r : canvas.height - r;

      } else if (pong.velocity.y < 0) {   // PONG BALL IS INITIALLY GOING UP

         bounces = Math.floor((displacement - (pong.position.y - pong.radius)) / (canvas.height - (pong.radius * 2))) + 1;
         r = displacement - ((canvas.height - (pong.radius * 2)) * (bounces - 1)) - (pong.position.y - pong.radius);
         finalPosition = bounces % 2 === 0 ? canvas.height - r : r;
         
      }

   } else if (displacement) {             // PONG BALL WILL NOT COLLIDE WITH THE WALLS

      finalPosition = pong.velocity.y > 0 ? pong.position.y + displacement : pong.position.y - displacement;
      
   } else {                               // PONG BALL HAS NO Y-COMPONENT IN ITS VELOCITY
      
      finalPosition = pong.position.y;

   }

   movePlayerTwo = true;
   return finalPosition.toFixed(1);

}


/* ----------------------------------------------------- SECTION 5 ----------------------------------------------------- */
/* ------------------------------------------ CREATE CLASSES FOR GAME OBJECTS ------------------------------------------ */

class Paddle {

   constructor (_canvasHeight, _canvasWidth) {
      this.height = Math.round(_canvasHeight * 0.17);
      this.width = Math.round(_canvasWidth / 100);
      this.position = {
         x: Math.round(_canvasWidth - this.width - 10),
         y: Math.round((_canvasHeight / 2) - (this.height / 2))
      }
      this.dy = 0;
   }

   drawPaddle() {

      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
      ctx.fillStyle = 'white';

   }

   updatePosition() {

      if (this.position.y + this.dy >= 0 && this.position.y + this.height + this.dy <= canvas.height) {

         this.position.y += this.dy;

      }

   }

}

class Ball {

   constructor (_canvasHeight, _canvasWidth) {
      this.radius = Math.round(_canvasHeight / 100);
      this.position = {
         x: Math.round((_canvasWidth / 2) - this.radius),
         y: Math.round((_canvasHeight / 2) - this.radius)
      }
      this.velocity = {
         x: -5,
         y: Math.round((Math.random() - 0.5) * 10)
      }
   }

   drawBall() {

      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.stroke();
      ctx.closePath();

   }

   updateBallPosition() {

      if (this.position.y + this.velocity.y <= 0 || this.position.y + this.radius + this.velocity.y >= canvas.height){

         this.velocity.y = -this.velocity.y;

      }
      
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;

   }

}


// INSTANTIATE THE PADDLE CLASS

const player1 = new Paddle(canvas.height, canvas.width);
player1.position.x = 10;         // ADJUSTS THE POSITION TO THE LEFT OF THE CANVAS
player1.drawPaddle();

const player2 = new Paddle(canvas.height, canvas.width);
player2.drawPaddle();


// INSTANTIATE THE BALL CLASS

const pong = new Ball(canvas.height, canvas.width);
pong.drawBall();



/* ----------------------------------------------------- SECTION 6 ----------------------------------------------------- */
/* -------------------------------------------------- EVENT LISTENERS -------------------------------------------------- */

// FOR PLAYER CONTROL FUNCTIONALITY

window.addEventListener('keydown', (e) => {

   // UNCOMMENT KEYS 'arrowup' AND 'arrowdown' FOR TWO PLAYER CONFIGURATION

   const key = e.key.toLowerCase();
   if (/* key === 'arrowup' || key === 'arrowdown' || */ key === 'w' || key === 's') {
      
      keyState[key] = true;

   }

})

window.addEventListener('keyup', (e) => {

   // UNCOMMENT KEYS 'arrowup' AND 'arrowdown' FOR TWO PLAYER CONFIGURATION

   const key = e.key.toLowerCase();
   if (/* key === 'arrowup' || key === 'arrowdown' || */ key === 'w' || key === 's') {
      
      keyState[key] = false;

   }

})


// START GAME

startBtn.addEventListener('click', () => {

   cover.classList.add('hidden');
   window.requestAnimationFrame(gameClock);

})