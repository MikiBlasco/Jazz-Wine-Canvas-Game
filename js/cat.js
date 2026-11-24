class Cat {
    constructor(ctx, x, y) {       
        this.ctx = ctx;
        //this.cats = cats;

        this.cats = [];

        this.img = new Image();
        this.img.src = "images/cat-3.png"
        
        //size of the cat
        this.width = 35
        this.height = 42
        //coordinates
        this.x = x; //randomness on the x that we will build on a function?
        this.y = y; //begining of "y" axi = 0
        //velocity
        this.vx = 1;
        this.vy = 1;
        //key
        this.collision = false 
            
    }
     
        
    //How fast a new cat falls. It only gets faster in the last two screens
    //(70+ points) and it is very fast in the last one (80+ points).
    fallSpeed(score) {
        if (score < 70) return 1
        if (score < 80) return 1 + (score - 70) * 0.1        // from 1 to 2
        return Math.min(4, 2 + (score - 80) * 0.1)           // from 2 to 4
    }

    //x is optional: the tutorial chooses where the cat falls
    spawn(score, x) {
        if (x === undefined) {
            x = Math.floor((Math.random() * (this.ctx.canvas.width - 35)))
        }
        const newCat = new Cat(ctx, x, -10)
        newCat.vy = this.fallSpeed(score)
        this.cats.push(newCat)
    }

    //Fewer normal cats than before (there were too many at some moments):
    //one every 5 seconds at the beginning, then a bit more often.
    generate(score, frameNumber) {

        if (frameNumber <= 50 || score <= 0) return

        let every = 300
        if (score >= 40) every = 260
        if (score >= 80) every = 210

        if (frameNumber % every === 0) this.spawn(score)
   }

   checkCollision(){

    if (cat.cats.some((object) =>
       game.player.collidesWith(object)) !== this.collision){
       return this.collision = !this.collision
       }

   }

   destroy(){
    this.cats.forEach(object => {
        if (game.player.collidesWith(object)){
            let index = cat.cats.indexOf(object)             
            this.cats.splice(index,1)  
           //return collision = !collision        
        }          
    })
   }
    
    move() {

        this.cats.forEach(object =>{

            if(Math.random() > 0.5){
                object.y += object.vy * (this.speedMul || 1)
                object.x -= object.vx
            } else {
                object.y += object.vy * (this.speedMul || 1)
                object.x += object.vx
            }
            //if(Math.random() < 0.5)

            }
        )
     
    }

    //drawing the cats from the array one by one.
    draw() {
         this.cats.forEach(object=>{
            this.ctx.drawImage(
                object.img,
                object.x,
                object.y,               
                object.width,
                object.height,
                
            );
        })                    
    }    
}