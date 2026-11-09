const GAME_WIDTH = 960;
const GAME_HEIGHT = 600;

class TownScene extends Phaser.Scene {
  constructor() { super("TownScene"); }

  create() {
    this.makeTextures();
    this.drawTown();
    this.player = this.physics.add.sprite(480, 390, "player-down");
    this.player.setDepth(20).setCollideWorldBounds(true).setSize(17, 19).setOffset(7, 11);
    this.playerSpeed = 145;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,E");
    this.nearby = null;
    this.dialogOpen = false;
    this.createHud();
    this.createInteractions();
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setZoom(1);
    this.input.keyboard.on("keydown-E", () => {
      if (this.dialogOpen) this.closeDialog();
      else if (this.nearby) this.openDialog(this.nearby);
    });
    this.input.keyboard.on("keydown-ESC", () => this.closeDialog());
    this.add.text(18, 16, "HARMON'S TOWN", { fontFamily:"monospace", fontSize:"13px", color:"#24404a", fontStyle:"bold", backgroundColor:"#fff4d6", padding:{x:8,y:5} }).setDepth(30);
  }

  makeTextures() {
    const g = this.make.graphics({x:0,y:0,add:false});
    // Player sprites: simple GBA-inspired trainer with directional variants.
    const drawPlayer = (direction) => {
      g.clear();
      g.fillStyle(0x263d4b); g.fillRect(8,2,16,8);
      g.fillStyle(0xe9b58b); g.fillRect(10,7,12,12);
      g.fillStyle(0x293c55); g.fillRect(8,17,16,8);
      g.fillStyle(0xf2d9a5); g.fillRect(9,24,6,5); g.fillRect(18,24,6,5);
      g.fillStyle(0x4c7892); g.fillRect(7,18,18,5);
      g.fillStyle(0x253845);
      if (direction === "left") g.fillRect(10,11,3,3);
      else if (direction === "right") g.fillRect(19,11,3,3);
      else if (direction === "up") { g.fillRect(10,7,12,3); g.fillRect(8,3,16,5); }
      else { g.fillRect(11,12,2,2); g.fillRect(19,12,2,2); }
      g.generateTexture("player-"+direction, 32, 32);
    };
    ["down","up","left","right"].forEach(drawPlayer);

    // Grass tile and path tile.
    g.clear(); g.fillStyle(0x77b96b); g.fillRect(0,0,32,32);
    g.fillStyle(0x68a95f); [[4,7],[20,4],[13,24],[27,18],[2,27]].forEach(([x,y])=>g.fillRect(x,y,2,4));
    g.generateTexture("grass",32,32);
    g.clear(); g.fillStyle(0xd9c28d); g.fillRect(0,0,32,32);
    g.fillStyle(0xcbb27c); [[5,8],[22,21],[14,3],[28,11]].forEach(([x,y])=>g.fillRect(x,y,3,2));
    g.generateTexture("path",32,32);
    g.clear(); g.fillStyle(0x4d9eb0); g.fillRect(0,0,32,32);
    g.fillStyle(0x80c9d0); g.fillRect(4,5,8,2); g.fillRect(19,20,9,2);
    g.generateTexture("water",32,32);
    g.destroy();
  }

  drawTown() {
    // Base grass field.
    for (let y=0;y<GAME_HEIGHT;y+=32) for (let x=0;x<GAME_WIDTH;x+=32) this.add.image(x+16,y+16,"grass").setDepth(0);

    // Winding paths.
    const pathTiles = [];
    for (let x=320;x<=640;x+=32) pathTiles.push([x,352]);
    for (let y=224;y<=352;y+=32) pathTiles.push([480,y]);
    for (let x=160;x<=800;x+=32) pathTiles.push([x,480]);
    for (let y=352;y<=480;y+=32) pathTiles.push([320,y],[640,y]);
    pathTiles.forEach(([x,y])=>this.add.image(x+16,y+16,"path").setDepth(1));

    // Pond.
    for (let y=128;y<=224;y+=32) for (let x=32;x<=128;x+=32) this.add.image(x+16,y+16,"water").setDepth(1);
    this.add.ellipse(80,126,116,20,0x4d9eb0).setDepth(2);

    // Decorative trees around edges.
    const treeSpots = [[64,320],[160,96],[256,96],[768,96],[864,160],[864,320],[64,512],[160,544],[800,544],[896,480],[256,512],[704,512],[32,64],[928,64]];
    treeSpots.forEach(([x,y])=>this.drawTree(x,y));

    // Buildings: walls, roof, door and signs.
    this.drawBuilding(260,190,"Background",0xb85f52);
    this.drawBuilding(480,130,"Carleton University",0x6686ad);
    this.drawBuilding(700,190,"WORKSHOP",0xc28a4d);
    this.drawBuilding(480,430,"PROJECT LAB",0x7d9c65);

    // Town sign and flower patches.
    this.drawSign(180,390,"WELCOME!");
    [[220,300],[235,300],[730,340],[745,340],[120,450],[140,450],[820,400],[840,400]].forEach(([x,y],i)=>{
      this.add.circle(x,y,4,[0xf1c75b,0xe98b91,0xffffff][i%3]).setDepth(3);
      this.add.circle(x+4,y+3,3,0xf4e7c4).setDepth(2);
    });
  }

  drawTree(x,y) {
    this.add.ellipse(x,y+17,34,10,0x4e8c50).setDepth(2);
    this.add.rectangle(x,y+5,9,19,0x80583b).setDepth(3);
    this.add.circle(x,y-8,18,0x397e50).setDepth(4);
    this.add.circle(x-9,y-4,11,0x4b9658).setDepth(4);
    this.add.circle(x+9,y-3,11,0x4b9658).setDepth(4);
    this.add.circle(x-5,y-14,5,0x76b86b).setDepth(5);
  }

  drawBuilding(x,y,label,roofColor) {
    const w=112,h=76;
    this.add.rectangle(x,y+18,w,h,0xf1dfb5).setDepth(3);
    this.add.rectangle(x,y-20,w+12,30,roofColor).setDepth(4);
    this.add.rectangle(x,y-34,w-12,8,Phaser.Display.Color.ValueToColor(roofColor).darken(18).color).setDepth(4);
    this.add.rectangle(x,y+27,22,36,0x79523b).setDepth(5);
    this.add.rectangle(x,y+24,12,15,0x9ed4d5).setDepth(6);
    this.add.rectangle(x-37,y+7,18,18,0x9ed4d5).setDepth(5);
    this.add.rectangle(x+37,y+7,18,18,0x9ed4d5).setDepth(5);
    this.add.rectangle(x,y-1,w+4,5,0xffedc9).setDepth(5);
    this.add.text(x,y-58,label,{fontFamily:"monospace",fontSize:"10px",fontStyle:"bold",color:"#29414a",backgroundColor:"#fff1cf",padding:{x:5,y:4}}).setOrigin(.5).setDepth(10);
  }

  drawSign(x,y,label) {
    this.add.rectangle(x,y+10,7,28,0x80583b).setDepth(4);
    this.add.rectangle(x,y-3,74,24,0xb77c48).setDepth(5);
    this.add.rectangle(x,y-3,66,16,0xf3d89e).setDepth(6);
    this.add.text(x,y-3,label,{fontFamily:"monospace",fontSize:"8px",color:"#4a4434",fontStyle:"bold"}).setOrigin(.5).setDepth(7);
  }

  createInteractions() {
    this.obstacles = this.physics.add.staticGroup();
    // Invisible collision blocks in front of buildings, trees and pond.
    [[260,230,112,20],[480,170,112,20],[700,230,112,20],[480,470,112,20],
     [80,126,110,115],[64,320,30,30],[160,96,30,30],[256,96,30,30],[768,96,30,30],
     [864,160,30,30],[864,320,30,30],[64,512,30,30],[160,544,30,30],[800,544,30,30],
     [896,480,30,30],[256,512,30,30],[704,512,30,30]].forEach(([x,y,w,h])=>{
       const o=this.add.rectangle(x,y,w,h,0x000000,0); this.physics.add.existing(o,true); this.obstacles.add(o);
     });

    this.interactables = [
      {x:260,y:255,name:"My House",title:"A little about me",body:"Hi! I'm Harmon, a Computer Science graduate from Carleton University. Welcome to my little corner of the internet.",action:"about"},
      {x:480,y:195,name:"Library",title:"Education",body:"Carleton University\\nBachelor of Computer Science\\n2021 – 2026\\n\\nThis is where my interest in software development grew.",action:"education"},
      {x:700,y:255,name:"Workshop",title:"Skills & tools",body:"Languages: Java, Python, C, C++, JavaScript, HTML/CSS\\n\\nTools: React, Node.js, Git, VS Code, IntelliJ\\n\\nI'm always learning something new.",action:"skills"},
      {x:480,y:495,name:"Project Lab",title:"Featured projects",body:"GrindnSharpen — full-stack fitness app\\nOregon Trail — Python / Pygame\\nTic Tac Toe — Java\\n\\nChoose a project link below to explore the code.",action:"projects"},
      {x:180,y:420,name:"Town Sign",title:"How to explore",body:"Use the arrow keys or WASD to move. Walk close to a building or sign, then press E to interact. Press E or Esc to close this message.",action:"help"}
    ];
    this.prompt = this.add.text(0,0,"",{fontFamily:"monospace",fontSize:"11px",color:"#ffffff",backgroundColor:"#263f50",padding:{x:8,y:6}}).setOrigin(.5).setDepth(40).setVisible(false);
    this.interactables.forEach(item=>{
      item.zone=this.add.zone(item.x,item.y,95,54);
      this.physics.add.existing(item.zone,true);
    });
  }

  createHud() {
    this.dialog = this.add.container(0,0).setDepth(100).setVisible(false);
    const panel = this.add.rectangle(GAME_WIDTH/2,GAME_HEIGHT-104,GAME_WIDTH-40,156,0x203a4b).setStrokeStyle(4,0xf5e5bd);
    const inner = this.add.rectangle(GAME_WIDTH/2,GAME_HEIGHT-104,GAME_WIDTH-52,144,0x294d5c).setStrokeStyle(2,0x76949a);
    this.dialogTitle = this.add.text(54,GAME_HEIGHT-171,"",{fontFamily:"monospace",fontSize:"17px",fontStyle:"bold",color:"#ffe6a7"});
    this.dialogBody = this.add.text(54,GAME_HEIGHT-137,"",{fontFamily:"monospace",fontSize:"14px",color:"#fffdf0",lineSpacing:7,wordWrap:{width:GAME_WIDTH-110}});
    this.dialogHint = this.add.text(GAME_WIDTH-62,GAME_HEIGHT-43,"E / ESC",{fontFamily:"monospace",fontSize:"11px",color:"#c4d6ce"}).setOrigin(1);
    this.dialog.add([panel,inner,this.dialogTitle,this.dialogBody,this.dialogHint]);
    this.dialogTitle.setDepth(101); this.dialogBody.setDepth(101); this.dialogHint.setDepth(101);
  }

  openDialog(item) {
    this.dialogOpen=true;
    this.dialogTitle.setText(item.title);
    this.dialogBody.setText(item.body);
    this.dialog.setVisible(true);
    this.physics.world.pause();
    this.player.anims?.stop();
  }

  closeDialog() {
    if (!this.dialogOpen) return;
    this.dialogOpen=false;
    this.dialog.setVisible(false);
    this.physics.world.resume();
  }

  update() {
    if (!this.player || this.dialogOpen) return;
    const left=this.cursors.left.isDown || this.keys.A.isDown;
    const right=this.cursors.right.isDown || this.keys.D.isDown;
    const up=this.cursors.up.isDown || this.keys.W.isDown;
    const down=this.cursors.down.isDown || this.keys.S.isDown;
    let vx=0,vy=0;
    if(left) vx=-1; else if(right) vx=1;
    if(up) vy=-1; else if(down) vy=1;
    if(vx && vy) { vx*=0.7071; vy*=0.7071; }
    this.player.setVelocity(vx*this.playerSpeed,vy*this.playerSpeed);
    if(vx<0) this.player.setTexture("player-left");
    else if(vx>0) this.player.setTexture("player-right");
    else if(vy<0) this.player.setTexture("player-up");
    else if(vy>0) this.player.setTexture("player-down");

    let closest=null, distance=Infinity;
    this.interactables.forEach(item=>{
      const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,item.x,item.y);
      if(d<76 && d<distance) { closest=item; distance=d; }
    });
    this.nearby=closest;
    if(closest) {
      this.prompt.setText("E  TALK");
      this.prompt.setPosition(closest.x,closest.y-48).setVisible(true);
    } else this.prompt.setVisible(false);
  }
}


// Start Phaser only after the TownScene class has been defined.
const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#8dc9d0",
  pixelArt: true,
  render: { antialias: false, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [TownScene]
};

new Phaser.Game(config);
