var { Engine, Render, Runner, Composite, Bodies, MouseConstraint, Mouse, Constraint, Events, Body } = Matter;

var engine = Engine.create();
var world = engine.world;
var render = Render.create({
    element: document.body,   
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent',
        showConstraints: false
    }
});

engine.constraintIterations = 5;

var USER_NON_INTERACTABLE = 1;
var USER_INTERACTABLE = 2;

var mouse = Mouse.create(render.canvas);
var mConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    collisionFilter: {
        mask: USER_INTERACTABLE
    }
});

engine.world.gravity.y = 0;

var segments = [];
var segmentLinks = [];

var circles = [];
var circleLinks = [];

var ground = Bodies.rectangle(613, 600, 1230, 100, {
    render: {
        fillStyle: 'blue'
    },
    isStatic: true
})

var audioCord = Composite.create();
var circleCord = Composite.create();

var segmentHeight = 5;
var segmentLength = 15;
var gap = 0;
var posX = 200;
var posY = 10;
var offset = segmentHeight / 2;
var halfLength = offset;
var finalSegmentPos = 0;

for (let i = 0; i < 100; i++) {
    
    //Rope segment generator
    posY+=segmentHeight;
    var  segment = Bodies.rectangle(posX, posY, segmentLength, segmentHeight, {
        collisionFilter: { group: -1, category: USER_NON_INTERACTABLE },
        restitution: 0,
        frictionAir: 0.5,
        restingThresh: 0.1,
        render: {
            fillStyle: 'black'
        }
    })

    segments.push(segment);

    //this is used to offset i so the constraint doesn't just use the same segment for body A and B
    //if no segment constraint (link) has been created, nothing happens since it will select the same point
    var j = 0;
    if(segmentLinks.length > 0) {
        j = 1;
    }

    var constraint = Constraint.create({
        bodyA: segments[i - j],
        pointA: {x: 0, y: halfLength},
        bodyB: segments[i],
        pointB: {x: 0, y: -halfLength},
        length: gap,  
        stiffness: 1,
        damping: 0.1,
        render: { visible: false }
    })

    segmentLinks.push(constraint);
}


var headLength = 65;
var headHalf = headLength / 2;

var jackBody = Bodies.rectangle(500, 500, 22, headLength, {
    render: {
        fillStyle: 'black'
    }   
});

var jackHead = Bodies.rectangle(500, 550, 12, 50, {
    render: {
        fillStyle: 'black'
    }   
}); 

var jack = Body.create({
    parts: [jackBody, jackHead],
    frictionAir: 0.5,
    restitution: 0,
    collisionFilter: { group: -1, category: USER_INTERACTABLE }
})

var headLink = Constraint.create({
    bodyA: jack,
    pointA: {x: 0, y: -40},
    bodyB: segments[segments.length - 1],
    pointB: {x: 0, y: 0},
    length: 0,  
    stiffness: 1,
    render: { visible: false }
});


//Adds all segments and links to audioCord composite

Composite.add(audioCord, [...segments, ...segmentLinks]);

Composite.add(audioCord, [jack, headLink]);

//sets the first segment as an anchor point
segments[0].isStatic = true;
Composite.add(world, [mConstraint, audioCord, circleCord]);

//makes the thing run
Render.run(render);
var runner = Runner.create();
Runner.run(runner, engine);




//draws the cord graphic
Events.on(render, 'afterRender', () => {
    var ctx = render.context;
    ctx.beginPath();

    segments.forEach((segment, i) => {
        var { x, y } = segment.position;
        var nextSegment = segments[i + 1];
        
        
        if(nextSegment) {
            var currCP = segment.position;
            var nextCP = nextSegment.position;
            var currEnd = midpoint(segment);
            var nextEnd = midpoint(nextSegment);
            var lerpEP = lerp(currEnd, nextEnd, 0.5);
            var lerpCP = lerp(currCP, nextCP, 0.5);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else { 
                ctx.quadraticCurveTo(x, y, currEnd.x, currEnd.y); 
                ctx.quadraticCurveTo(lerpCP.x, lerpCP.y, lerpEP.x, lerpEP.y); 
            }  
        }       
    })

    ctx.lineJoin = "round";
    ctx.lineWidth = 15;
    ctx.strokeStyle = 'black';
    ctx.stroke();
})

function midpoint(segment) {
    var bottomRight = segment.vertices[2];
    var bottomLeft = segment.vertices[3];

    var a1 = bottomLeft.x;
    var a2 = bottomLeft.y;
    var b1 = bottomRight.x;
    var b2 = bottomRight.y;
    return {
        x: (a1 + b1) / 2,
        y: (a2 + b2) / 2
    };
}

function lerp(p1, p2, t) {
    return {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t
    };
}