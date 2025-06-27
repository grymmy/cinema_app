var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var speed = 2;
var direction = 1;
var y = 25;
var x = 50
var z = 0.1;
var timerForMiddle = 0;
function theDrawingStuff() {
    ctx.clearRect(0,0,canvas.width, canvas.height);

        //the like green wall background thingy so that it isn't so blank
        ctx.beginPath();
        ctx.fillStyle = "rgb(236, 240, 163)";
        ctx.rect(0, 0, canvas.width, 150);
        ctx.fill();
        ctx.closePath();
        //this makes bob. he loves popcorn.
        ctx.beginPath();
        const face = new Path2D();
        face.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fillStyle = "rgb(211, 172, 125)";
        ctx.fill(face)
        ctx.fillStyle = "rgb(51, 54, 120)";
        ctx.rect(x-10, y+25, 20, y+30);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "rgb(38, 38, 44)";
        ctx.rect(x-10, y+70, 20, 50);
        ctx.fill();
        ctx.closePath();

        //bob's floor
        ctx.beginPath();
        ctx.fillStyle = "rgb(149, 87, 26)";
        ctx.rect(0, 150, canvas.width, 1000);
        ctx.fill();
        ctx.closePath();

        //microwave counter
        ctx.beginPath();
        ctx.fillStyle = "rgb(162, 160, 157)";
        ctx.rect(340, 75, 120, 100);
        ctx.fill();
        ctx.closePath();
        
        //the microwave
        ctx.beginPath();
        ctx.moveTo(450, 25);
        ctx.lineTo(450, 80);
        ctx.lineTo(350, 80);
        ctx.lineTo(350, 25);
        ctx.fillStyle = "rgb(80, 80, 81)";
        ctx.fill();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.moveTo(375, 30);
        ctx.rect(365, 30, 80, 45);
        ctx.fillStyle = "rgb(23, 23, 23)";
        ctx.fill();
        ctx.closePath();

        //microwave button
        ctx.beginPath();
        const button = new Path2D();
        button.arc(357, 60, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgb(44, 219, 9)";
        ctx.fill(button)


        //bob can talk now
        ctx.beginPath();
        ctx.font = "20px serif";
        ctx.fillStyle = "rgb(23, 23, 23)";
        ctx.fillText("Hello, I am Bob! I'm so hungry... what should i eat?!", 100, 230)

        if(x > 230){
            ctx.clearRect(100, 270, canvas.width, -100);
            ctx.beginPath();
            ctx.fillStyle = "rgb(149, 87, 26)";
            ctx.rect(0, 150, canvas.width, 1000);
            ctx.fill();
            ctx.closePath();


        //microwave counter redo for text
        ctx.beginPath();
        ctx.fillStyle = "rgb(162, 160, 157)";
        ctx.rect(340, 75, 120, 100);
        ctx.fill();
        ctx.closePath();
        
        //the microwave redo for text
        ctx.beginPath();
        ctx.moveTo(450, 25);
        ctx.lineTo(450, 80);
        ctx.lineTo(350, 80);
        ctx.lineTo(350, 25);
        ctx.fillStyle = "rgb(80, 80, 81)";
        ctx.fill();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.moveTo(375, 30);
        ctx.rect(365, 30, 80, 45);
        ctx.fillStyle = "rgb(23, 23, 23)";
        ctx.fill();
        ctx.closePath();

        //microwave button redo for text
        ctx.beginPath();
        const button = new Path2D();
        button.arc(357, 60, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgb(44, 219, 9)";
        ctx.fill(button)
            ctx.fillStyle = "rgb(19, 18, 17)";
            ctx.fillText("maybe some microwave popcorn", 100, 230)

        }
        
        //This is legit just him making popcorn
        if(timerForMiddle > 0 && timerForMiddle < 200){
            const popcorn = new Path2D();
            popcorn.rect(300, 75, 30, 15);
            ctx.fillStyle = "rgb(179, 120, 48)";
            ctx.fill(popcorn)
        }
        if(timerForMiddle >= 180){
        ctx.fillStyle = "rgb(239, 69, 12)";
        ctx.fill(button)
        }
            
        
        //we didn't start the fire (except we did)
        if(timerForMiddle >= 200){

        const fire3 = new Path2D();
        fire3.arc(-x+700, -y +85, z*2, 0, Math.PI * 2);
        ctx.fillStyle = "rgb(225, 65, 7)";
        ctx.fill(fire3);

        

        const fire2 = new Path2D();
        fire2.arc(-x+700, y , z*1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgb(225, 149, 7)";
        ctx.fill(fire2);

        const fire1 = new Path2D();
        fire1.arc(-x+700, -y + 85 , z+5, 0, Math.PI * 2);
        ctx.fillStyle = "rgb(225, 203, 7)";
        ctx.fill(fire1);
        }
        if(timerForMiddle >= 800){
            ctx.fillStyle = "rgb(18, 17, 16)";
            ctx.fillText("...and that's why you don't make microwave popcorn.", 25, 200);
            ctx.fillText(" Get some amazing, delicious, free popcorn that won't burn down your", 25, 250);
            ctx.fillText("house by making an animation like this!", 25, 270);
            ctx.fillText("Don't be like Bob. Do the YSWS", 70, 350);
        }
    }

function allTheTimeAndMovementStuff() {
    y+= direction;
    if(y < 25 || y > 50) {
        direction = -direction;
    }
    if(x < 300) {
        x+= 1;
    }
    if(x >= 300) {
        timerForMiddle+= 1;
    }
    if(timerForMiddle >= 200) {
        z+= 1;
    }
    
}
theDrawingStuff();
function loop() {
	// clear old frame;
  ctx.clearRect(0,0,canvas.width, canvas.height);
  allTheTimeAndMovementStuff();
  theDrawingStuff();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

  draw();
  
  