// this code is based on Coding Challenge #56: Attraction and Repulsion Forces
// by Daniel Shiffman
// https://www.youtube.com/watch?v=OAcXnzRNiCY

class Particle {

    constructor(x, y) {
      this.pos = createVector(x, y);
      this.prev = createVector(x, y);
      this.vel = createVector(); //p5.Vector.random2D();
      //this.vel = p5.Vector.random2D();
      //this.vel.setMag(random(2, 5));
      this.acc = createVector();
    }
  
    update() {
      this.vel.add(this.acc);
      this.vel.limit(5);
      this.pos.add(this.vel);
      this.acc.mult(0);
    }
  
    show() {
      stroke(255, 255);
      strokeWeight(10);
      
      line(this.pos.x, this.pos.y, this.prev.x, this.prev.y);
  
      this.prev.x = this.pos.x;
      this.prev.y = this.pos.y;
  
    }
  
    attracted(target) {
      // var dir = target - this.pos
      var force = p5.Vector.sub(target, this.pos);
      var d = force.mag();
      d = constrain(d, 20, 40);
      var G = 50;
      var strength = G / (d * d);
      force.setMag(strength);
      if (d < 20) {
        force.mult(-10);
      }
      this.acc.add(force);
    }
  
  }