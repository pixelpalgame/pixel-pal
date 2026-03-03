// ── WORLD DRAWING ──────────────────────────────────────────
function drawRect(ctx,x,y,w,h,fill,stroke,lw=1){
  ctx.fillStyle=fill; ctx.fillRect(x,y,w,h);
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.strokeRect(x,y,w,h);}
}
function neon(ctx,text,x,y,col,size=18){
  ctx.save();
  ctx.font=`bold ${size}px monospace`;
  ctx.shadowColor=col; ctx.shadowBlur=12;
  ctx.fillStyle=col; ctx.fillText(text,x,y);
  ctx.shadowBlur=0; ctx.restore();
}
function win(ctx,x,y,w,h){
  drawRect(ctx,x,y,w,h,'#3a2010');
  drawRect(ctx,x+3,y+3,w-6,h-6,'rgba(135,185,230,0.25)');
  drawRect(ctx,x,y+h/2-1,w,2,'#3a2010');
  drawRect(ctx,x+w/2-1,y,2,h,'#3a2010');
  // curtains
  ctx.fillStyle='rgba(120,30,30,0.55)';
  ctx.fillRect(x+3,y+3,10,h-6);
  ctx.fillRect(x+w-13,y+3,10,h-6);
}

function drawSky(ctx) {
  const h=gt.h, night=h<6||h>=22, eve=h>=18&&h<22;
  const g=ctx.createLinearGradient(0,0,0,300);
  if(night){g.addColorStop(0,'#03030e');g.addColorStop(1,'#08081a');}
  else if(eve){g.addColorStop(0,'#180828');g.addColorStop(1,'#381020');}
  else{g.addColorStop(0,'#4477bb');g.addColorStop(1,'#99bbdd');}
  ctx.fillStyle=g; ctx.fillRect(0,0,WW,300);

  if(night||eve){
    // stars
    ctx.fillStyle='rgba(255,255,255,0.8)';
    [[80,40],[300,90],[600,30],[950,70],[1300,45],[1700,80],[2100,35],[2500,60],[2900,25],[3200,70]].forEach(([sx,sy])=>{
      ctx.beginPath(); ctx.arc(sx,sy,1.3,0,Math.PI*2); ctx.fill();
    });
    // moon
    ctx.fillStyle='#ffffcc';
    ctx.beginPath(); ctx.arc(3100,65,22,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=night?'#03030e':'#180828';
    ctx.beginPath(); ctx.arc(3114,57,20,0,Math.PI*2); ctx.fill();
  } else {
    ctx.fillStyle='rgba(255,230,80,0.9)';
    ctx.beginPath(); ctx.arc(3080,75,30,0,Math.PI*2); ctx.fill();
  }
}

function drawGym(ctx,ox) {
  drawRect(ctx,ox,180,480,340,'#18283a');
  drawRect(ctx,ox,460,480,50,'#20202a'); // floor
  // wall lines
  ctx.strokeStyle='rgba(0,200,220,0.07)'; ctx.lineWidth=1;
  for(let i=0;i<480;i+=60){ctx.beginPath();ctx.moveTo(ox+i,180);ctx.lineTo(ox+i,460);ctx.stroke();}
  // mirrors
  ctx.fillStyle='rgba(150,210,255,0.08)'; ctx.fillRect(ox+10,190,460,200);
  ctx.strokeStyle='rgba(150,210,255,0.25)'; ctx.lineWidth=1.5; ctx.strokeRect(ox+10,190,460,200);
  // treadmills
  for(let i=0;i<3;i++){
    const tx=ox+70+i*110;
    drawRect(ctx,tx,410,80,30,'#2a2a3a','#444');
    drawRect(ctx,tx+5,380,70,32,'#333','#555');
    ctx.fillStyle='rgba(0,220,160,0.6)';
    ctx.fillRect(tx+8,381,(frame*2+i*30)%65,3);
  }
  // bench press
  drawRect(ctx,ox+340,420,120,18,'#2a2a3a'); drawRect(ctx,ox+335,412,130,10,'#555');
  drawRect(ctx,ox+330,408,12,14,'#888'); drawRect(ctx,ox+453,408,12,14,'#888');
  // weight rack
  drawRect(ctx,ox+375,380,90,60,'#1e1e2e','#333');
  ['#cc2222','#2244cc','#22aa44','#ccaa00'].forEach((c,i)=>{
    ctx.fillStyle=c; ctx.beginPath(); ctx.arc(ox+395+i*18,410,7,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#111'; ctx.lineWidth=1; ctx.stroke();
  });
  // motivational poster
  drawRect(ctx,ox+30,220,110,70,'#cc2200');
  ctx.fillStyle='#fff'; ctx.font='bold 10px monospace';
  ctx.fillText('NO PAIN',ox+34,248); ctx.fillText('NO GAIN',ox+34,264);
  // sign
  neon(ctx,'IRON ZONE',ox+150,175,'#00ffcc',16);
  // windows
  win(ctx,ox+10,200,90,80); win(ctx,ox+360,200,90,80);
}

function drawApartment(ctx,ox) {
  // upper floor bg
  drawRect(ctx,ox,80,760,210,'#c08860');
  // lower floor bg
  drawRect(ctx,ox,300,760,210,'#b87850');
  // floor line
  drawRect(ctx,ox,298,760,6,'#3a2010');
  // ceiling strips
  drawRect(ctx,ox,80,760,12,'#3a2010');
  drawRect(ctx,ox,300,760,12,'#3a2010');
  // floorboards upper
  ctx.fillStyle='#9a7050'; ctx.fillRect(ox,258,760,40);
  for(let i=0;i<760;i+=55){ctx.fillStyle='rgba(0,0,0,0.12)';ctx.fillRect(ox+i,258,1,40);}
  // floorboards lower
  ctx.fillStyle='#9a7050'; ctx.fillRect(ox,460,760,50);
  for(let i=0;i<760;i+=55){ctx.fillStyle='rgba(0,0,0,0.12)';ctx.fillRect(ox+i,460,1,50);}

  // UPPER LEFT: bedroom
  drawRect(ctx,ox+30,195,200,66,'#7a4a8a','#5a2a68',2);
  ctx.fillStyle='#e8d0f0'; ctx.fillRect(ox+35,200,80,24);
  ctx.fillStyle='#dcc8e8'; ctx.fillRect(ox+120,200,80,24);
  ctx.fillStyle='#9a6aaa'; ctx.fillRect(ox+30,224,200,37);
  drawRect(ctx,ox+240,210,50,52,'#8b5a2a','#6a4020');
  if(gt.h>=20||gt.h<7){
    ctx.fillStyle='rgba(255,220,100,0.22)';
    ctx.beginPath(); ctx.arc(ox+265,205,32,0,Math.PI*2); ctx.fill();
  }
  // lamp on nightstand
  ctx.fillStyle='#c8a040'; ctx.fillRect(ox+258,196,14,4);
  ctx.fillStyle='#e8c060'; ctx.fillRect(ox+262,188,6,10);
  // pictures
  drawRect(ctx,ox+320,100,60,45,'#5a3010'); drawRect(ctx,ox+324,104,52,37,'#3a6a8a');
  drawRect(ctx,ox+390,100,40,35,'#5a3010'); drawRect(ctx,ox+394,104,32,27,'#7a4a20');

  // UPPER RIGHT: study area
  drawRect(ctx,ox+420,230,240,14,'#6a4020','#4a2a10');
  drawRect(ctx,ox+480,165,90,68,'#1a1a2e','#2a2a3e',2);
  const screenCol = (gt.h>=8&&gt.h<23) ? '#0a2040' : '#050810';
  drawRect(ctx,ox+484,169,82,60,screenCol);
  if(gt.h>=8&&gt.h<23){
    ctx.fillStyle='rgba(0,200,100,0.5)';
    for(let i=0;i<5;i++) ctx.fillRect(ox+488,173+i*11,(frame*3+i*20)%70,3);
  }
  drawRect(ctx,ox+462,228,100,10,'#1a1a2e','#2a2a3e');
  drawRect(ctx,ox+630,110,110,152,'#6a4020','#4a2a10');
  ctx.fillStyle='#6a4020'; ctx.fillRect(ox+630,143,110,4); ctx.fillRect(ox+630,178,110,4);
  const bc=['#c03030','#3050c0','#208030','#c07020','#802080','#20a0a0'];
  for(let r=0;r<3;r++) for(let c=0;c<6;c++){
    ctx.fillStyle=bc[(r*6+c)%bc.length];
    ctx.fillRect(ox+634+c*17,r===0?114:r===1?148:182,14,r===0?26:r===1?27:26);
  }
  drawRect(ctx,ox+470,205,60,28,'#2a2a3e','#1a1a2e');

  // LOWER LEFT: living room
  // COUCH — proper with cushions and back
  const couchX = ox+22, couchY = 390;
  drawRect(ctx,couchX,couchY,240,28,'#c04030','#8a2a20',2);       // back rest
  drawRect(ctx,couchX,couchY+28,240,48,'#b03828','#8a2a20',2);    // seat base
  // armrests
  ctx.fillStyle='#a03020'; ctx.fillRect(couchX,couchY,18,76); ctx.fillRect(couchX+222,couchY,18,76);
  // cushions
  ctx.fillStyle='#d05040';
  ctx.fillRect(couchX+20,couchY+30,66,44); ctx.fillRect(couchX+90,couchY+30,66,44); ctx.fillRect(couchX+160,couchY+30,60,44);
  ctx.strokeStyle='#b03828'; ctx.lineWidth=1;
  ctx.strokeRect(couchX+20,couchY+30,66,44); ctx.strokeRect(couchX+90,couchY+30,66,44); ctx.strokeRect(couchX+160,couchY+30,60,44);
  // throw pillow
  ctx.fillStyle='#f0c040'; ctx.fillRect(couchX+18,couchY+2,30,24);

  // coffee table
  drawRect(ctx,ox+80,445,120,18,'#6a4020','#4a2a10');
  // mug on table
  ctx.fillStyle='#8b5a2a'; ctx.fillRect(ox+178,436,10,10);
  ctx.fillStyle='rgba(180,80,20,0.8)'; ctx.fillRect(ox+180,437,6,7);

  // READING CHAIR — right of couch near bookshelf area
  drawRect(ctx,ox+290,395,55,70,'#5a3860','#3a1840',2); // body
  ctx.fillStyle='#6a4870'; ctx.fillRect(ox+290,395,55,22); // back cushion
  ctx.fillStyle='#4a2850'; ctx.fillRect(ox+290,395,10,70); ctx.fillRect(ox+335,395,10,70); // armrests
  ctx.fillStyle='#6a4870'; ctx.fillRect(ox+300,417,36,46); // seat cushion
  // reading lamp next to chair
  ctx.fillStyle='#888070'; ctx.fillRect(ox+350,380,4,90);
  ctx.fillStyle='#e0c050'; ctx.fillRect(ox+344,378,18,6);
  if(gt.h>=18||gt.h<8){
    ctx.fillStyle='rgba(255,220,80,0.25)';
    ctx.beginPath(); ctx.arc(ox+352,380,28,0,Math.PI*2); ctx.fill();
  }

  // TV with glow effect
  drawRect(ctx,ox+360,348,130,100,'#1a1a2e','#0a0a1e',2);
  const tvOn = char.loc==='apartment' && (char.action==='idle'||char.action==='read');
  const tvCol = tvOn ? `hsl(${frame*1.5%360},18%,${12+Math.sin(frame*0.05)*4}%)` : '#040810';
  drawRect(ctx,ox+365,353,120,90,tvCol);
  if(tvOn){
    // scanlines
    ctx.fillStyle='rgba(0,0,0,0.12)';
    for(let i=0;i<9;i++) ctx.fillRect(ox+365,353+i*10,120,4);
    // tv glow on wall
    ctx.fillStyle=`hsla(${frame*1.5%360},40%,60%,0.04)`;
    ctx.fillRect(ox+320,320,220,160);
  }
  drawRect(ctx,ox+415,446,30,10,'#1a1a2e');
  // floor lamp (left side)
  ctx.fillStyle='#808070'; ctx.fillRect(ox+290,360,6,100);
  ctx.fillStyle='#f5d060'; ctx.fillRect(ox+280,358,26,8);
  if(gt.h>=19||gt.h<7){
    ctx.fillStyle='rgba(255,220,100,0.2)';
    ctx.beginPath(); ctx.arc(ox+293,360,35,0,Math.PI*2); ctx.fill();
  }

  // RADIO — small shelf unit with animated LED
  const radioX = ox+250, radioY = 380;
  drawRect(ctx,radioX,radioY,38,22,'#2a2a3a','#1a1a2a');
  // speaker grille
  ctx.fillStyle='#111';
  for(let i=0;i<4;i++) for(let j=0;j<3;j++) ctx.fillRect(radioX+3+i*6,radioY+5+j*5,3,3);
  // LED indicator
  ctx.fillStyle='#004400';
  ctx.beginPath(); ctx.arc(radioX+32,radioY+5,3,0,Math.PI*2); ctx.fill();
  // antenna
  ctx.strokeStyle='#555'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(radioX+32,radioY); ctx.lineTo(radioX+38,radioY-14); ctx.stroke();
  // pulse ring when on
  if(false){
    const pulse=(frame*0.06)%1;
    ctx.strokeStyle=`rgba(0,255,68,${0.5-pulse*0.5})`;
    ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(radioX+32,radioY+5,3+pulse*12,0,Math.PI*2); ctx.stroke();
  }

  // LOWER RIGHT: kitchen — NO fridge/stove, has pantry + countertop appliances
  // counter
  drawRect(ctx,ox+480,430,240,30,'#b08060','#7a5030');
  ctx.fillStyle='#c8a070'; ctx.fillRect(ox+478,424,244,8);
  // cabinets above
  drawRect(ctx,ox+480,310,238,115,'#8b6040','#6a4020');
  ctx.strokeStyle='#6a4020'; ctx.lineWidth=1;
  ctx.strokeRect(ox+484,314,112,107); ctx.strokeRect(ox+600,314,114,107);
  // pantry cabinet (tall, right side — replaces fridge)
  drawRect(ctx,ox+724,300,56,162,'#7a5030','#5a3820',2);
  ctx.strokeStyle='#5a3820'; ctx.lineWidth=1;
  ctx.strokeRect(ox+727,303,50,76); ctx.strokeRect(ox+727,382,50,76);
  ctx.fillStyle='#c8a070'; ctx.fillRect(ox+748,338,8,8); ctx.fillRect(ox+748,418,8,8); // handles
  ctx.fillStyle='#8b6040'; ctx.fillText&&0; // label
  ctx.font='8px monospace'; ctx.fillStyle='rgba(255,200,100,0.4)'; ctx.fillText('PANTRY',ox+727,300);

  // SINK — already there, keep
  drawRect(ctx,ox+555,416,60,16,'#bbc8d0','#9aaab8',2);
  ctx.fillStyle='#a0a8b0'; ctx.fillRect(ox+582,404,4,14);
  // dish rack animation if washing
  if(char.action==='cook'&&char.loc==='apartment'){
    const dishWave=Math.sin(frame*0.15)*2;
    ctx.fillStyle='rgba(100,200,255,0.3)'; ctx.fillRect(ox+558,418,54,12+dishWave);
    // bubbles
    ['rgba(200,240,255,0.6)','rgba(180,220,255,0.5)'].forEach((c,i)=>{
      ctx.fillStyle=c;
      ctx.beginPath(); ctx.arc(ox+565+i*16,(frame*0.4+i*30)%14+412,2+i,0,Math.PI*2); ctx.fill();
    });
  }

  // Countertop appliances (replace stove)
  // Hot plate (small electric burner)
  drawRect(ctx,ox+490,418,44,14,'#3a3a3a','#222');
  ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(ox+512,415,6,0,Math.PI*2); ctx.fill();
  // burner glow if cooking
  if(char.action==='cook'&&char.loc==='apartment'){
    const glow=0.4+Math.sin(frame*0.1)*0.15;
    ctx.fillStyle=`rgba(255,80,0,${glow})`;
    ctx.beginPath(); ctx.arc(ox+512,415,6,0,Math.PI*2); ctx.fill();
    // steam
    for(let s=0;s<3;s++){
      const sy=((frame*0.8+s*20)%30);
      ctx.strokeStyle=`rgba(200,200,220,${0.4-sy/75})`;
      ctx.lineWidth=1.5; ctx.beginPath();
      ctx.moveTo(ox+505+s*6,416-sy);
      ctx.quadraticCurveTo(ox+502+s*6,420-sy-8,ox+507+s*6,416-sy-14);
      ctx.stroke();
    }
  }
  // microwave
  drawRect(ctx,ox+540,400,60,20,'#3a3a3a','#222');
  drawRect(ctx,ox+543,403,38,14,'#1a1a1a');
  ctx.fillStyle='#004400'; ctx.fillRect(ox+583,405,12,10);
  if(char.action==='cook'&&char.loc==='apartment'){
    ctx.fillStyle='#00ff44'; ctx.font='7px monospace'; ctx.fillText(String(gt.m).padStart(2,'0')+':'+String(Math.floor(frame/30)%60).padStart(2,'0'),ox+584,413);
  }
  // pot if cooking
  if(char.action==='cook'&&char.loc==='apartment'){
    drawRect(ctx,ox+504,405,16,12,'#5a5a5a','#3a3a3a');
    ctx.fillStyle='#3a3a3a'; ctx.fillRect(ox+502,404,4,3); ctx.fillRect(ox+520,404,4,3); // handles
  }
  // potted plant on counter
  ctx.fillStyle='#b04020'; ctx.fillRect(ox+700,408,20,18);
  ctx.fillStyle='#3a8a30'; ctx.beginPath(); ctx.arc(ox+710,400,10,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#4a9a40'; ctx.beginPath(); ctx.arc(ox+703,403,8,0,Math.PI*2); ctx.fill();

  // windows
  win(ctx,ox+100,100,100,80); win(ctx,ox+220,100,100,80);
  win(ctx,ox+100,310,100,75); win(ctx,ox+490,100,90,70);
  win(ctx,ox+590,310,100,75);
  // vertical room divider
  drawRect(ctx,ox+378,80,8,390,'#3a2010');
  neon(ctx,'THE GROVE APT 4B',ox+220,76,'#f5c842',13);
}

function drawStore(ctx,ox) {
  drawRect(ctx,ox,120,520,390,'#182a18');
  drawRect(ctx,ox,460,520,50,'#c8c8c0'); // floor
  // floor tiles
  for(let i=0;i<520;i+=50) for(let j=460;j<510;j+=50){
    ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=0.5; ctx.strokeRect(ox+i,j,50,50);
  }
  // shelves
  const shelfCols=['#aa3322','#aa7722','#aaaaaa','#2244aa'];
  const shelfEmoji=[['🍎','🍊','🥦','🍅'],['🥫','🍞','🥜','🍪'],['🥛','🧀','🥚','🧈'],['🍺','🥤','🍷','💧']];
  for(let s=0;s<4;s++){
    const sx=ox+30+s*120;
    drawRect(ctx,sx,180,90,280,shelfCols[s]+'22',shelfCols[s]+'66');
    ctx.fillStyle=shelfCols[s]+'99';
    [180,240,300,360].forEach(sy=>ctx.fillRect(sx,sy,90,5));
    ctx.font='13px serif';
    shelfEmoji[s].forEach((e,i)=>ctx.fillText(e,sx+5,190+i*65));
  }
  // checkout counter
  drawRect(ctx,ox+20,420,120,50,'#182a18','#2a3a2a');
  drawRect(ctx,ox+22,408,80,16,'#223a22','#2a4a2a');
  ctx.fillStyle='#333'; ctx.fillRect(ox+25,422,90,8);
  for(let i=0;i<9;i++){ctx.fillStyle='#444';ctx.fillRect(ox+26+i*10,422,8,8);}
  // overhead lights glow
  for(let i=0;i<4;i++){
    ctx.fillStyle='rgba(255,255,200,0.12)';
    ctx.beginPath(); ctx.arc(ox+80+i*110,155,38,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffffcc'; ctx.fillRect(ox+68+i*110,145,24,7);
  }
  // big windows
  ctx.fillStyle='rgba(130,210,130,0.1)'; ctx.fillRect(ox,190,520,230);
  ctx.strokeStyle='rgba(80,170,80,0.35)'; ctx.lineWidth=3;
  ctx.strokeRect(ox+10,200,240,210); ctx.strokeRect(ox+265,200,240,210);
  neon(ctx,"MO'S MARKET",ox+130,116,'#44ff44',15);

  // ── SHOPPING CART follows character ─────────────────────
  if ((char.action === 'shop' || shopCart.items.length > 0) && char.loc === 'store') {
    // Cart sits just ahead of character (in direction they face)
    const offset = char.facing === 1 ? 22 : -36;
    const cx = char.wx - ox + offset;  // local canvas x
    const cy = 444;                     // sits on the floor

    // Cart basket (wire frame look)
    ctx.fillStyle   = '#b0b8cc';
    ctx.fillRect(cx, cy, 32, 18);
    ctx.strokeStyle = '#7080a0';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(cx, cy, 32, 18);

    // Wire grid lines inside basket
    ctx.strokeStyle = 'rgba(80,100,140,0.4)';
    ctx.lineWidth   = 0.8;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i*8, cy); ctx.lineTo(cx + i*8, cy+18); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(cx, cy+9); ctx.lineTo(cx+32, cy+9); ctx.stroke();

    // Handle bar
    ctx.fillStyle = '#888';
    ctx.fillRect(cx + (char.facing === 1 ? -5 : 32), cy - 4, 5, 4);

    // Wheels
    ctx.fillStyle = '#444';
    ctx.beginPath(); ctx.arc(cx+5,  cy+20, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+27, cy+20, 3, 0, Math.PI*2); ctx.fill();

    // Items stacked in cart
    if (shopCart.items.length > 0) {
      ctx.font = '8px serif';
      shopCart.items.slice(-4).forEach((item, i) => {
        ctx.fillText(item, cx + 2 + (i % 3) * 10, cy + (i < 3 ? 11 : 17));
      });
    }

    // Item-drop animation: during 'grab' phase, item falls from shelf into cart
    if (shopCart.phase === 'grab' && shopCart.phaseTimer > 4) {
      const t   = Math.min(1, (shopCart.phaseTimer - 4) / (shopCart.GRAB_FRAMES - 4));
      const shelfY  = 235;  // approximate shelf height on canvas
      const dropY   = shelfY + (cy - shelfY) * t;
      const shelfIdx = Math.max(0, shopCart.aisleIdx - 1) % SHELF_ITEMS.length;
      const rowItems = SHELF_ITEMS[shelfIdx];
      const dropItem = rowItems[Math.floor(shopCart.aisleIdx * 7) % rowItems.length];
      ctx.font = '10px serif';
      // Slight arc: item swings as it falls
      const arcX = cx + 14 + Math.sin(t * Math.PI) * 8;
      ctx.fillText(dropItem, arcX, dropY);
    }
  }
}

function drawStreet(ctx,ox) {
  // sidewalk
  ctx.fillStyle='#888'; ctx.fillRect(ox,460,320,50);
  for(let i=0;i<5;i++){ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ox+i*64,460);ctx.lineTo(ox+i*64,510);ctx.stroke();}
  // lamp post
  ctx.fillStyle='#555'; ctx.fillRect(ox+100,200,7,265);
  ctx.fillStyle='#666'; ctx.fillRect(ox+80,200,50,10);
  if(gt.h>=19||gt.h<7){
    ctx.fillStyle='rgba(255,220,100,0.45)';
    ctx.beginPath(); ctx.arc(ox+104,205,32,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffffaa'; ctx.fillRect(ox+94,197,20,9);
  }
  // bus stop shelter
  drawRect(ctx,ox+170,310,100,175,'#3a3a4a');
  ctx.fillStyle='rgba(140,190,255,0.18)'; ctx.fillRect(ox+175,315,90,100);
  ctx.strokeStyle='rgba(140,190,255,0.4)'; ctx.lineWidth=2; ctx.strokeRect(ox+175,315,90,100);
  ctx.font='14px monospace'; ctx.fillStyle='#88aaff'; ctx.fillText('BUS STOP',ox+178,348);
  // bench
  drawRect(ctx,ox+180,400,80,10,'#5a4030');
  ctx.fillStyle='#4a3020'; ctx.fillRect(ox+185,410,7,28); ctx.fillRect(ox+245,410,7,28);
  // bin
  drawRect(ctx,ox+268,440,28,38,'#444');
  drawRect(ctx,ox+266,435,32,8,'#555');
  // graffiti
  ctx.font='13px monospace'; ctx.fillStyle='rgba(255,50,50,0.45)'; ctx.fillText('NO SLEEP',ox+18,428);
  ctx.fillStyle='rgba(60,60,255,0.35)'; ctx.fillText('CITY NEVER DIES',ox+40,455);
}

function drawNightclub(ctx,ox) {
  drawRect(ctx,ox,100,620,410,'#0a0318');
  // dance floor tiles
  for(let tx=0;tx<8;tx++) for(let ty=0;ty<3;ty++){
    const hue=(tx*45+ty*60+frame*4)%360;
    ctx.fillStyle=`hsla(${hue},${18}%,${12}%,0.95)`;
    ctx.fillRect(ox+40+tx*40,ty*28+400,38,26);
  }
  // DJ booth
  drawRect(ctx,ox+420,355,170,115,'#18082e','#281040');
  drawRect(ctx,ox+425,345,160,14,'#28104a');
  // turntables (no arc, just circles drawn safely)
  const spin=frame*0.04;
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(ox+468,374,20,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#555'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(ox+468,374,14,spin,spin+4.2); ctx.stroke();
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(ox+538,374,20,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(ox+538,374,14,-spin,-spin+4.2); ctx.stroke();
  // spotlights
  const beams=[[255,0,102],[0,255,200],[255,150,0],[160,0,255],[0,255,130]];
  beams.forEach(([r,g,b],i)=>{
    const bx=ox+80+i*95;
    const ang=Math.sin(frame*0.02+i*1.3)*0.45;
    const ex=bx+Math.sin(ang)*140, ey=500;
    const lg=ctx.createLinearGradient(bx,120,ex,ey);
    lg.addColorStop(0,`rgba(${r},${g},${b},0.3)`);
    lg.addColorStop(1,`rgba(${r},${g},${b},0)`);
    ctx.fillStyle=lg;
    ctx.beginPath();
    ctx.moveTo(bx-4,122); ctx.lineTo(bx+4,122);
    ctx.lineTo(ex+18,ey); ctx.lineTo(ex-18,ey);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.beginPath(); ctx.arc(bx,126,5,0,Math.PI*2); ctx.fill();
  });
  // bar
  drawRect(ctx,ox+18,345,165,125,'#28183a','#381848');
  drawRect(ctx,ox+16,338,169,10,'#38204a');
  ['#cc2244','#2244cc','#22aa44','#ccaa00','#aa22cc'].forEach((c,i)=>{
    ctx.fillStyle=c+'bb'; ctx.fillRect(ox+28+i*26,310,14,30);
    ctx.fillStyle=c; ctx.fillRect(ox+32+i*26,304,7,9);
  });
  // rope
  ctx.fillStyle='#aa2222'; ctx.fillRect(ox+20,468,8,48); ctx.fillRect(ox+122,468,8,48);
  ctx.strokeStyle='#cc4444'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(ox+28,490); ctx.lineTo(ox+122,490); ctx.stroke();
  ctx.font='14px monospace'; ctx.fillStyle='rgba(255,100,100,0.6)'; ctx.fillText('VIP',ox+58,487);
  neon(ctx,'ECLIPSE',ox+200,94,'#cc44ff',20);
}

function drawPark(ctx,ox) {
  // grass
  const g=ctx.createLinearGradient(ox,330,ox,510);
  g.addColorStop(0,'#2a6a2a'); g.addColorStop(1,'#1a4a1a');
  ctx.fillStyle=g; ctx.fillRect(ox,330,600,180);
  // path
  ctx.fillStyle='#8a7a60'; ctx.fillRect(ox+210,420,160,90);
  // trees
  [[80,280],[170,260],[340,290],[490,270],[555,285]].forEach(([tx,ty])=>{
    ctx.fillStyle='#5a3010'; ctx.fillRect(tx+ox-5,ty,10,140);
    ctx.fillStyle='#2a7a2a'; ctx.beginPath(); ctx.arc(tx+ox,ty-8,34,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#3a8a3a'; ctx.beginPath(); ctx.arc(tx+ox-6,ty+6,26,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1a5a1a'; ctx.beginPath(); ctx.arc(tx+ox+7,ty-3,20,0,Math.PI*2); ctx.fill();
  });
  // pond
  ctx.fillStyle='rgba(40,100,180,0.6)';
  ctx.beginPath(); ctx.arc(ox+430,440,72,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(100,180,255,0.35)'; ctx.lineWidth=2; ctx.stroke();
  // ducks
  ctx.fillStyle='#ffffaa';
  ctx.beginPath(); ctx.arc(ox+412,438,7,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(ox+448,443,7,0,Math.PI*2); ctx.fill();
  // bench
  drawRect(ctx,ox+230,448,100,10,'#5a4030');
  ctx.fillStyle='#4a3020'; ctx.fillRect(ox+235,458,8,24); ctx.fillRect(ox+317,458,8,24);
  // fountain
  ctx.fillStyle='#8888aa'; ctx.beginPath(); ctx.arc(ox+120,468,38,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#5a5a88'; ctx.fillRect(ox+115,435,10,35);
  for(let i=0;i<5;i++){
    ctx.fillStyle='rgba(100,180,255,0.5)';
    ctx.beginPath(); ctx.arc(ox+120+Math.sin(frame*0.08+i)*10,436-i*4,2,0,Math.PI*2); ctx.fill();
  }
  // flowers
  ['#ff4466','#ff8844','#ffff44','#44ff88'].forEach((c,i)=>{
    ctx.fillStyle='#2a6a2a'; ctx.fillRect(ox+350+i*28,462,3,20);
    ctx.fillStyle=c; ctx.beginPath(); ctx.arc(ox+351+i*28,460,5,0,Math.PI*2); ctx.fill();
  });
  neon(ctx,'GROVE PARK  OPEN 24H',ox+170,96,'#44ff88',14);
}

function drawWorld() {
  wctx.save();
  try {
    drawSky(wctx);
    // ground road
    wctx.fillStyle='#282420'; wctx.fillRect(0,510,WW,80);
    wctx.fillStyle='#383530'; wctx.fillRect(0,510,WW,4);
    wctx.fillStyle='rgba(255,220,50,0.4)';
    for(let i=0;i<WW;i+=80) wctx.fillRect(i,548,40,3);

    drawGym(wctx,0);
    drawApartment(wctx,480);
    drawStore(wctx,1240);
    drawStreet(wctx,1760);
    drawNightclub(wctx,2080);
  } catch(e) { console.error('drawWorld error:',e); }
  wctx.restore();
}

// ── CHARACTER DRAWING ──────────────────────────────────────

// Lift animation: 120 frame cycle
// 0-15:   standing, hands at sides (rest)
// 16-30:  squat down to bar
// 31-45:  gripping / loading up
// 46-70:  explosive pull — bar from floor to waist
// 71-85:  drive overhead — full press
// 86-100: hold overhead (strain)
// 101-110: lower back to shoulders
// 111-119: lower to floor, stand up
function drawLift(body, hairCol='#3a2010') {
  const CYCLE = 120;
  const f = frame % CYCLE;

  const shirt = '#3a5a88';
  const pants = '#2a3a5a';
  const shoe  = '#2c2010';
  const bar   = '#aaaaaa';
  const plate = '#cc2222';

  // Helper: draw head at (hx, hy)
  function head(hx, hy, strain=false) {
    cctx.fillStyle = body; cctx.fillRect(hx, hy, 12, 11);
    cctx.fillStyle = hairCol; cctx.fillRect(hx, hy, 12, 3); cctx.fillRect(hx, hy, 3, 7);
    // eyes — squint when straining
    cctx.fillStyle = '#2c1810';
    if (strain) {
      cctx.fillRect(hx+2, hy+6, 3, 1); cctx.fillRect(hx+8, hy+6, 3, 1); // squint lines
    } else {
      cctx.fillRect(hx+2, hy+6, 2, 2); cctx.fillRect(hx+8, hy+6, 2, 2);
    }
    // mouth — gritted/open when straining
    cctx.fillStyle = '#8b4513';
    if (strain) {
      cctx.fillRect(hx+3, hy+9, 6, 2); // open mouth
      cctx.fillStyle = '#cc6633'; cctx.fillRect(hx+4, hy+10, 4, 1); // teeth
    } else {
      cctx.fillRect(hx+3, hy+9, 6, 1);
    }
    // neck
    cctx.fillStyle = body; cctx.fillRect(hx+4, hy+11, 4, 3);
    // Alien overlay for lift state
    if (typeof playerCharData !== 'undefined' && playerCharData?.type === 'alien') {
      cctx.fillStyle = '#55bb66';
      cctx.fillRect(hx, hy, 12, 3); cctx.fillRect(hx, hy, 3, 9);
      cctx.fillStyle = '#88ffcc';
      cctx.fillRect(hx+5, Math.max(0, hy-3), 2, 5);
      cctx.fillStyle = '#000022';
      cctx.fillRect(hx+1, hy+4, 4, 5); cctx.fillRect(hx+7, hy+4, 4, 5);
      cctx.fillStyle = '#88ccff';
      cctx.fillRect(hx+2, hy+5, 2, 2); cctx.fillRect(hx+8, hy+5, 2, 2);
    }
  }

  // Helper: barbell at (bx, by) with given width
  function barbell(bx, by, bw=30) {
    cctx.fillStyle = bar;  cctx.fillRect(bx, by, bw, 3);
    cctx.fillStyle = plate; cctx.fillRect(bx-1, by-3, 4, 9); cctx.fillRect(bx+bw-3, by-3, 4, 9);
    // collar rings
    cctx.fillStyle = '#888'; cctx.fillRect(bx+2, by-1, 2, 5); cctx.fillRect(bx+bw-4, by-1, 2, 5);
  }

  // Helper: effort sparks when straining
  function sparks(sx, sy) {
    const t = frame * 0.4;
    ['#ffdd00','#ff8800','#ffffff'].forEach((c,i) => {
      cctx.fillStyle = c;
      cctx.fillRect(sx + Math.round(Math.sin(t+i*2.1)*4), sy + Math.round(Math.cos(t+i*1.7)*3), 2, 2);
    });
  }

  if (f < 16) {
    // ── REST / STANDING ── arms at sides, looking at bar on floor
    head(10, 2);
    cctx.fillStyle = shirt; cctx.fillRect(8, 16, 17, 14);
    cctx.fillStyle = shirt; cctx.fillRect(5, 16, 4, 12); cctx.fillRect(24, 16, 4, 12);
    cctx.fillStyle = body;  cctx.fillRect(5, 28, 4, 4);  cctx.fillRect(24, 28, 4, 4);
    cctx.fillStyle = pants; cctx.fillRect(8, 30, 17, 10);
    cctx.fillStyle = pants; cctx.fillRect(8, 40, 7, 10); cctx.fillRect(18, 40, 7, 10);
    cctx.fillStyle = shoe;  cctx.fillRect(7, 48, 9, 3);  cctx.fillRect(17, 48, 9, 3);
    // bar on floor
    barbell(1, 44, 30);

  } else if (f < 31) {
    // ── SQUAT DOWN ── bending knees, lowering toward bar
    const t = (f - 16) / 15; // 0→1
    const squat = Math.round(t * 8); // body drops 8px
    const headY = 2 + squat;
    head(10, headY);
    cctx.fillStyle = shirt; cctx.fillRect(8, 16+squat, 17, 14);
    // arms angling down toward bar
    cctx.fillStyle = shirt;
    cctx.fillRect(5, 16+squat, 4, 10+squat); cctx.fillRect(24, 16+squat, 4, 10+squat);
    cctx.fillStyle = body;
    cctx.fillRect(5, 26+squat*2, 4, 4); cctx.fillRect(24, 26+squat*2, 4, 4);
    // bent legs
    cctx.fillStyle = pants; cctx.fillRect(8, 30+squat, 17, 10);
    cctx.fillStyle = pants;
    cctx.fillRect(7, 40+squat, 8, 10-squat); cctx.fillRect(18, 40+squat, 8, 10-squat);
    cctx.fillStyle = shoe;
    cctx.fillRect(6, 48, 10, 3); cctx.fillRect(17, 48, 10, 3);
    barbell(1, 44, 30);

  } else if (f < 46) {
    // ── GRIP ── fully squatted, hands on bar
    const grip = (f - 31) / 15;
    head(10, 10);
    cctx.fillStyle = shirt; cctx.fillRect(8, 24, 17, 12);
    // arms reaching down to bar
    cctx.fillStyle = shirt;
    cctx.fillRect(4, 24, 4, 18); cctx.fillRect(24, 24, 4, 18);
    cctx.fillStyle = body;
    cctx.fillRect(4, 42, 4, 4); cctx.fillRect(24, 42, 4, 4);
    // knees bent wide
    cctx.fillStyle = pants; cctx.fillRect(8, 36, 17, 10);
    cctx.fillStyle = pants;
    cctx.fillRect(5, 45, 8, 6); cctx.fillRect(19, 45, 8, 6);
    cctx.fillStyle = shoe;
    cctx.fillRect(4, 49, 11, 3); cctx.fillRect(18, 49, 11, 3);
    barbell(1, 44, 30);
    // hands gripping — highlight knuckles
    if (grip > 0.5) {
      cctx.fillStyle = '#ddaa88'; cctx.fillRect(4, 43, 4, 2); cctx.fillRect(24, 43, 4, 2);
    }

  } else if (f < 71) {
    // ── PULL ── bar travels from floor (y=44) to waist (y=30), body rises
    const t = (f - 46) / 25;
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // ease in-out
    const barY = Math.round(44 - ease * 16);
    const bodyRise = Math.round(ease * 10);
    const strain = t > 0.4;
    head(10, 10 - bodyRise, strain);
    cctx.fillStyle = shirt; cctx.fillRect(8, 24-bodyRise, 17, 14);
    // arms pulling up with bar
    const armLen = Math.round(18 - ease * 8);
    cctx.fillStyle = shirt;
    cctx.fillRect(4, 24-bodyRise, 4, armLen); cctx.fillRect(24, 24-bodyRise, 4, armLen);
    cctx.fillStyle = body;
    cctx.fillRect(4, 24-bodyRise+armLen, 4, 4); cctx.fillRect(24, 24-bodyRise+armLen, 4, 4);
    // legs straightening
    cctx.fillStyle = pants; cctx.fillRect(8, 38-bodyRise, 17, 10);
    cctx.fillStyle = pants;
    cctx.fillRect(8, 48-bodyRise, 7, bodyRise+3); cctx.fillRect(18, 48-bodyRise, 7, bodyRise+3);
    cctx.fillStyle = shoe; cctx.fillRect(7, 48, 9, 3); cctx.fillRect(17, 48, 9, 3);
    barbell(1, barY, 30);
    if (strain) sparks(16, barY - 4);

  } else if (f < 86) {
    // ── PRESS OVERHEAD ── bar goes from waist (y=30) to overhead (y=2)
    const t = (f - 71) / 15;
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    const barY = Math.round(30 - ease * 26);
    const strain = true;
    head(10, 2, strain);
    cctx.fillStyle = shirt; cctx.fillRect(8, 14, 17, 16);
    // arms going up — extended above head
    const armUp = Math.round(ease * 12);
    cctx.fillStyle = shirt;
    cctx.fillRect(4, 14-armUp, 4, 14+armUp); cctx.fillRect(24, 14-armUp, 4, 14+armUp);
    cctx.fillStyle = body;
    cctx.fillRect(4, 14-armUp-4, 4, 4); cctx.fillRect(24, 14-armUp-4, 4, 4);
    cctx.fillStyle = pants; cctx.fillRect(8, 30, 17, 10);
    cctx.fillStyle = pants; cctx.fillRect(8, 40, 7, 10); cctx.fillRect(18, 40, 7, 10);
    cctx.fillStyle = shoe; cctx.fillRect(7, 48, 9, 3); cctx.fillRect(17, 48, 9, 3);
    barbell(1, barY, 30);
    sparks(16, barY - 4);
    // effort lines
    cctx.fillStyle = 'rgba(255,200,50,0.5)';
    cctx.fillRect(0, barY+1, 3, 1); cctx.fillRect(29, barY+1, 3, 1);

  } else if (f < 101) {
    // ── HOLD OVERHEAD ── shaking slightly, fully extended
    const shake = Math.sin(frame * 0.8) * 1.5;
    head(10 + Math.round(shake * 0.5), 2, true);
    cctx.fillStyle = shirt; cctx.fillRect(8, 14, 17, 16);
    cctx.fillStyle = shirt;
    cctx.fillRect(4, 2, 4, 26); cctx.fillRect(24, 2, 4, 26);
    cctx.fillStyle = body;
    cctx.fillRect(4, -2, 4, 4); cctx.fillRect(24, -2, 4, 4);
    cctx.fillStyle = pants; cctx.fillRect(8, 30, 17, 10);
    cctx.fillStyle = pants; cctx.fillRect(8, 40, 7, 10); cctx.fillRect(18, 40, 7, 10);
    cctx.fillStyle = shoe; cctx.fillRect(7, 48, 9, 3); cctx.fillRect(17, 48, 9, 3);
    barbell(1 + Math.round(shake), 0, 30);
    // sweat drops
    cctx.fillStyle = 'rgba(100,180,255,0.7)';
    cctx.fillRect(22 + Math.round(shake), 10, 2, 3);
    cctx.fillRect(10, 12 + Math.round(shake*0.5), 2, 3);

  } else if (f < 111) {
    // ── LOWER TO SHOULDERS ── controlled descent
    const t = (f - 101) / 10;
    const barY = Math.round(t * 26);
    head(10, 2);
    cctx.fillStyle = shirt; cctx.fillRect(8, 14, 17, 16);
    cctx.fillStyle = shirt;
    cctx.fillRect(4, 2+barY, 4, 26-barY); cctx.fillRect(24, 2+barY, 4, 26-barY);
    cctx.fillStyle = body;
    cctx.fillRect(4, barY-2, 4, 4); cctx.fillRect(24, barY-2, 4, 4);
    cctx.fillStyle = pants; cctx.fillRect(8, 30, 17, 10);
    cctx.fillStyle = pants; cctx.fillRect(8, 40, 7, 10); cctx.fillRect(18, 40, 7, 10);
    cctx.fillStyle = shoe; cctx.fillRect(7, 48, 9, 3); cctx.fillRect(17, 48, 9, 3);
    barbell(1, barY, 30);

  } else {
    // ── LOWER TO FLOOR & STAND ── squat back down, set bar down
    const t = (f - 111) / 9;
    const squat = Math.round((1-t) * 8);
    head(10, 2 + squat);
    cctx.fillStyle = shirt; cctx.fillRect(8, 16+squat, 17, 14);
    cctx.fillStyle = shirt;
    cctx.fillRect(5, 16+squat, 4, 10+squat); cctx.fillRect(24, 16+squat, 4, 10+squat);
    cctx.fillStyle = body;
    cctx.fillRect(5, 26+squat*2, 4, 4); cctx.fillRect(24, 26+squat*2, 4, 4);
    cctx.fillStyle = pants; cctx.fillRect(8, 30+squat, 17, 10);
    cctx.fillStyle = pants;
    cctx.fillRect(7, 40+squat, 8, 10-squat); cctx.fillRect(18, 40+squat, 8, 10-squat);
    cctx.fillStyle = shoe; cctx.fillRect(6, 48, 10, 3); cctx.fillRect(17, 48, 10, 3);
    barbell(1, 26 + Math.round(t * 18), 30);
  }
}

function drawChar() {
  cctx.clearRect(0,0,32,52);
  const m=mood.v;
  let body=m>30?'#f5c8a0':m<-20?'#c0b0c8':'#e8b88a';
  let shirt='#4a6fa5', pants='#2a3a5a', shoe='#2c2010';

  // Apply character customisation from creation screen
  const _pcd = typeof playerCharData !== 'undefined' ? playerCharData : null;
  if (_pcd) {
    if (_pcd.skin) body = _pcd.skin;
    if (_pcd.type === 'female')     shirt = '#cc4488';
    else if (_pcd.type === 'alien') { body = '#55bb66'; shirt = '#5533aa'; }
  }
  // hairCol computed after body override so alien gets matching head color
  const hairCol = _pcd
    ? (_pcd.type === 'alien' ? body : (_pcd.hair || '#3a2010'))
    : '#3a2010';

  // Alien face overlay — call before each action state's return
  // Overwrites hair with head color, adds big eyes + partial antenna
  function alienHead(hx, hy) {
    if (!_pcd || _pcd.type !== 'alien') return;
    cctx.fillStyle = '#55bb66';
    cctx.fillRect(hx, hy, 12, 3); cctx.fillRect(hx, hy, 3, 9); // hide hair
    cctx.fillStyle = '#88ffcc';
    cctx.fillRect(hx+5, Math.max(0, hy-3), 2, 5); // antenna stick (clipped at canvas top)
    cctx.fillStyle = '#000022';
    cctx.fillRect(hx+1, hy+4, 4, 5); cctx.fillRect(hx+7, hy+4, 4, 5); // big eyes
    cctx.fillStyle = '#88ccff';
    cctx.fillRect(hx+2, hy+5, 2, 2); cctx.fillRect(hx+8, hy+5, 2, 2); // eye shine
    cctx.fillStyle = '#336644';
    cctx.fillRect(hx+3, hy+10, 6, 1); // small mouth
  }

  // Female hair overlay — longer hair on both sides
  function femaleHair(hx, hy) {
    if (!_pcd || _pcd.type !== 'female') return;
    cctx.fillStyle = hairCol;
    cctx.fillRect(hx, hy, 3, 14);     // left side longer
    cctx.fillRect(hx+9, hy, 3, 14);   // right side longer
  }

  // shadow
  cctx.fillStyle='rgba(0,0,0,0.25)';
  cctx.beginPath(); cctx.arc(16,51,9,0,Math.PI*2); cctx.fill();

  // ── LIFT ───────────────────────────────────────
  if (char.action==='lift') { drawLift(body, hairCol); return; }

  // ── SLEEP ──────────────────────────────────────
  if (char.asleep) {
    cctx.fillStyle=body; cctx.fillRect(2,22,28,18);
    cctx.fillStyle=hairCol; cctx.fillRect(2,22,28,4);
    cctx.fillStyle='#2c1810'; cctx.fillRect(7,28,3,1); cctx.fillRect(16,28,3,1);
    cctx.fillStyle=shirt; cctx.fillRect(2,34,28,10);
    cctx.fillStyle=pants; cctx.fillRect(2,44,28,8);
    const zOff=(frame*0.04)%1;
    cctx.fillStyle='rgba(180,180,255,0.8)'; cctx.font='8px monospace';
    cctx.globalAlpha=Math.max(0,Math.sin(frame*0.04)*0.9);
    cctx.fillText('z',23,16); cctx.globalAlpha=Math.max(0,Math.sin(frame*0.04-1)*0.9);
    cctx.fillText('z',27,10); cctx.globalAlpha=Math.max(0,Math.sin(frame*0.04-2)*0.9);
    cctx.fillText('z',30,5); cctx.globalAlpha=1;
    return;
  }

  // ── COOK / WASH DISHES ────────────────────────
  if (char.action==='cook') {
    const CYCLE=80, f=frame%CYCLE;
    // head
    cctx.fillStyle=body; cctx.fillRect(10,2,12,11);
    cctx.fillStyle=hairCol; cctx.fillRect(10,2,12,3); cctx.fillRect(10,2,3,7);
    cctx.fillStyle='#2c1810'; cctx.fillRect(12,8,2,2); cctx.fillRect(18,8,2,2);
    // apron
    cctx.fillStyle='#e8e0d0'; cctx.fillRect(9,16,15,20);
    // shirt showing on sides
    cctx.fillStyle=shirt; cctx.fillRect(7,16,4,18); cctx.fillRect(22,16,5,18);
    cctx.fillStyle=body; cctx.fillRect(14,13,5,3); // neck
    // washing motion — arms scrubbing left-right
    const scrub = Math.sin(f*0.2)*4;
    cctx.fillStyle=shirt; cctx.fillRect(4,18,5,12); cctx.fillRect(23,18,5,12);
    cctx.fillStyle=body;
    cctx.fillRect(4+Math.round(scrub),30,5,4);
    cctx.fillRect(23-Math.round(scrub),30,5,4);
    // dish/pot being held
    cctx.fillStyle='#bbc8d0'; cctx.fillRect(6+Math.round(scrub*0.5),32,20,5);
    cctx.fillStyle='rgba(100,200,255,0.4)'; cctx.fillRect(7,33,18,3); // water sheen
    // bubbles above dish
    ['rgba(200,240,255,0.8)','rgba(180,220,255,0.6)','rgba(220,250,255,0.7)'].forEach((c,i)=>{
      const bx=10+i*5, by=26-((frame*0.5+i*8)%12);
      cctx.fillStyle=c; cctx.beginPath(); cctx.arc(bx,by,1.5,0,Math.PI*2); cctx.fill();
    });
    // steam wisps
    cctx.strokeStyle='rgba(200,200,220,0.35)'; cctx.lineWidth=1.5;
    [12,18,24].forEach((sx,i)=>{
      const sy = 22 - ((frame*0.3+i*10)%14);
      cctx.beginPath(); cctx.moveTo(sx,32); cctx.quadraticCurveTo(sx+2,sy+6,sx-1,sy); cctx.stroke();
    });
    cctx.fillStyle=pants; cctx.fillRect(8,34,17,10);
    cctx.fillStyle=pants; cctx.fillRect(8,44,7,8); cctx.fillRect(18,44,7,8);
    cctx.fillStyle=shoe; cctx.fillRect(7,50,9,2); cctx.fillRect(17,50,9,2);
    alienHead(10, 2); femaleHair(10, 2);
    return;
  }

  // ── DANCE ─────────────────────────────────────
  if (char.action==='dance') {
    const BEAT=30; // frames per beat at ~30fps = 1 beat/sec
    const b=frame%BEAT, t=b/BEAT;
    const bounce=Math.round(Math.sin(frame*0.21)*4); // body bobs
    const armL=Math.round(Math.sin(frame*0.21)*8);
    const armR=Math.round(Math.sin(frame*0.21+Math.PI)*8);
    const hipShift=Math.round(Math.sin(frame*0.21)*3);
    const headTilt=Math.round(Math.sin(frame*0.105)*2);

    // left leg kick alternating
    const legL=Math.round(Math.sin(frame*0.21)*6);
    const legR=Math.round(Math.sin(frame*0.21+Math.PI)*6);

    // glow ring (club vibes)
    const hue=(frame*3)%360;
    cctx.fillStyle=`hsla(${hue},80%,60%,0.08)`;
    cctx.beginPath(); cctx.arc(16,30,18,0,Math.PI*2); cctx.fill();

    // head (bounces + slight tilt offset)
    cctx.fillStyle=body; cctx.fillRect(10+headTilt,2+bounce,12,11);
    cctx.fillStyle=hairCol; cctx.fillRect(10+headTilt,2+bounce,12,3); cctx.fillRect(10+headTilt,2+bounce,3,7);
    cctx.fillStyle='#2c1810';
    // happy squint eyes when dancing
    cctx.fillRect(12+headTilt,8+bounce,2,1); cctx.fillRect(18+headTilt,8+bounce,2,1);
    // open mouth (singing along)
    cctx.fillStyle='#8b4513'; cctx.fillRect(13+headTilt,10+bounce,5,2);
    cctx.fillStyle='#cc6633'; cctx.fillRect(14+headTilt,11+bounce,3,1);
    cctx.fillStyle=body; cctx.fillRect(14,13+bounce,5,3); // neck

    // shirt + body with hip shift
    cctx.fillStyle=shirt; cctx.fillRect(8+hipShift,16+bounce,17,14);
    // arms flung outward and up — proper dance pose
    cctx.fillStyle=shirt;
    cctx.fillRect(3,16+bounce-armL,5,armL>0?armL+8:8); // left arm up when armL>0
    cctx.fillRect(24,16+bounce-armR,5,armR>0?armR+8:8);
    cctx.fillStyle=body;
    cctx.fillRect(3,16+bounce-armL+(armL>0?armL+4:4),5,4);
    cctx.fillRect(24,16+bounce-armR+(armR>0?armR+4:4),5,4);

    // pants
    cctx.fillStyle=pants; cctx.fillRect(8+hipShift,30+bounce,17,10);
    // legs kicking alternately
    cctx.fillStyle=pants;
    cctx.fillRect(8,40+bounce,7,8+legL);
    cctx.fillRect(18,40+bounce,7,8+legR);
    cctx.fillStyle=shoe;
    cctx.fillRect(7,48+bounce+legL,9,3);
    cctx.fillRect(17,48+bounce+legR,9,3);

    // music note particle
    if(frame%25===0){
      cctx.fillStyle=`hsl(${hue},90%,70%)`;
      cctx.font='bold 9px monospace';
      cctx.fillText('♪',24,2);
    }
    alienHead(10+headTilt, 2+bounce); femaleHair(10+headTilt, 2+bounce);
    return;
  }

  // ── SHOP ──────────────────────────────────────
  if (char.action==='shop') {
    const f = frame % 160;
    // Phase: 0-60 pushing cart, 61-110 reaching for item, 111-160 putting in cart
    const pushing = f < 61;
    const reaching = f >= 61 && f < 111;
    const reachT = reaching ? (f - 61) / 50 : 0;
    const armReach = Math.round(reachT * 8);

    // Head
    cctx.fillStyle=body; cctx.fillRect(10,2,12,11);
    cctx.fillStyle=hairCol; cctx.fillRect(10,2,12,3); cctx.fillRect(10,2,3,7);
    cctx.fillStyle='#2c1810'; cctx.fillRect(12,8,2,2); cctx.fillRect(18,8,2,2);
    cctx.fillStyle='#8b4513'; cctx.fillRect(13,11,6,1);
    cctx.fillStyle=body; cctx.fillRect(14,13,5,3);
    cctx.fillStyle=shirt; cctx.fillRect(8,16,17,14);

    if (pushing) {
      // Both arms extended forward pushing cart handle
      cctx.fillStyle=shirt;
      cctx.fillRect(4,18,5,14); cctx.fillRect(23,18,5,14);
      cctx.fillStyle=body;
      cctx.fillRect(4,32,5,4); cctx.fillRect(23,32,5,4);
      // Cart handle bar (drawn relative — actual cart is drawn in world)
      cctx.fillStyle='#888'; cctx.fillRect(3,33,26,3);
    } else {
      // One arm reaching up to shelf
      cctx.fillStyle=shirt;
      cctx.fillRect(5,16,4,10); // left arm resting
      cctx.fillRect(23,10-armReach,5,14+armReach); // right arm reaching up
      cctx.fillStyle=body;
      cctx.fillRect(5,26,4,4);
      cctx.fillRect(23,10-armReach-2,5,4); // hand at top of reach

      // Item being grabbed (show emoji-like colored block)
      if (reaching && reachT > 0.4) {
        const itemColors = ['#cc4422','#cc8822','#cccccc','#2244cc'];
        cctx.fillStyle = itemColors[Math.floor(frame/40)%itemColors.length];
        cctx.fillRect(24, 8-armReach, 6, 6);
      }
    }

    // Pants + walking legs while pushing
    const walkStep = pushing ? Math.sin(frame*0.2)*3 : 0;
    cctx.fillStyle=pants; cctx.fillRect(8,30,17,10);
    cctx.fillStyle=pants; cctx.fillRect(8,40,7,8+walkStep); cctx.fillRect(18,40,7,8-walkStep);
    cctx.fillStyle=shoe; cctx.fillRect(7,46+walkStep,9,3); cctx.fillRect(17,46-walkStep,9,3);
    alienHead(10, 2); femaleHair(10, 2);
    return;
  }

  // ── READ ──────────────────────────────────────
  if (char.action==='read') {
    const pageTurn = frame%200 > 190; // occasional page turn
    // seated pose — upper body, legs angled
    cctx.fillStyle=body; cctx.fillRect(10,2,12,11);
    cctx.fillStyle=hairCol; cctx.fillRect(10,2,12,3); cctx.fillRect(10,2,3,7);
    cctx.fillStyle='#2c1810'; cctx.fillRect(12,8,2,2); cctx.fillRect(18,8,2,2);
    cctx.fillStyle='#8b4513'; cctx.fillRect(13,11,6,1);
    cctx.fillStyle=body; cctx.fillRect(14,13,5,3);
    cctx.fillStyle=shirt; cctx.fillRect(8,16,17,14);
    // arms holding book below
    const bookTilt=pageTurn?Math.round(Math.sin(frame*0.5)*2):0;
    cctx.fillStyle=shirt;
    cctx.fillRect(4,20,5,14); cctx.fillRect(23,20,5,14);
    cctx.fillStyle=body;
    cctx.fillRect(4,34,5,4); cctx.fillRect(23,34,5,4);
    // book — open pages
    cctx.fillStyle='#c05030'; cctx.fillRect(3+bookTilt,32,26,14); // cover
    cctx.fillStyle='#fffff0'; cctx.fillRect(5+bookTilt,33,11,12); // left page
    cctx.fillStyle='#f5f0e8'; cctx.fillRect(17+bookTilt,33,10,12); // right page
    cctx.fillStyle='#c05030'; cctx.fillRect(16+bookTilt,33,2,12); // spine
    // text lines on pages
    cctx.fillStyle='rgba(0,0,0,0.15)';
    for(let i=0;i<4;i++){
      cctx.fillRect(6+bookTilt,35+i*3,(frame*0.5+i*7)%9+2,1);
      cctx.fillRect(18+bookTilt,35+i*3,(frame*0.5+i*5+4)%7+1,1);
    }
    // seated legs
    cctx.fillStyle=pants; cctx.fillRect(8,30,17,10);
    cctx.fillStyle=pants; cctx.fillRect(5,38,10,6); cctx.fillRect(18,38,10,6); // knees bent
    cctx.fillStyle=shoe; cctx.fillRect(4,43,11,3); cctx.fillRect(17,43,11,3);
    alienHead(10, 2); femaleHair(10, 2);
    return;
  }

  // ── STUDY ─────────────────────────────────────
  if (char.action==='study') {
    const typing=(frame%12<6); // typing blink
    cctx.fillStyle=body; cctx.fillRect(10,2,12,11);
    cctx.fillStyle=hairCol; cctx.fillRect(10,2,12,3); cctx.fillRect(10,2,3,7);
    cctx.fillStyle='#2c1810'; cctx.fillRect(12,8,2,2); cctx.fillRect(18,8,2,2);
    cctx.fillStyle='#8b4513'; cctx.fillRect(13,11,6,1);
    cctx.fillStyle=body; cctx.fillRect(14,13,5,3);
    cctx.fillStyle=shirt; cctx.fillRect(8,16,17,14);
    // arms on desk
    cctx.fillStyle=shirt; cctx.fillRect(4,20,5,14); cctx.fillRect(23,20,5,14);
    cctx.fillStyle=body; cctx.fillRect(4,34,5,4); cctx.fillRect(23,34,5,4);
    // typing hands on keyboard
    if(typing){
      cctx.fillStyle=body;
      cctx.fillRect(5,36,4,2); cctx.fillRect(23,36,4,2);
    }
    // screen glow on face
    cctx.fillStyle='rgba(0,180,100,0.08)'; cctx.fillRect(8,2,18,14);
    cctx.fillStyle=pants; cctx.fillRect(8,30,17,10);
    cctx.fillStyle=pants; cctx.fillRect(8,40,7,10); cctx.fillRect(18,40,7,10);
    cctx.fillStyle=shoe; cctx.fillRect(7,48,9,3); cctx.fillRect(17,48,9,3);
    alienHead(10, 2); femaleHair(10, 2);
    if (_pcd && _pcd.type === 'alien') {
      // Antenna bob — redraw tip over the static antenna with a vertical oscillation
      const antBob = Math.round(Math.sin(frame * 0.1) * 2);
      cctx.fillStyle = '#55bb66'; // erase old tip
      cctx.fillRect(15, 0, 2, 5);
      cctx.fillStyle = '#88ffcc'; // redraw bobbing tip
      cctx.fillRect(15, Math.max(0, antBob), 2, 4);
      // Eyes glow brighter while typing
      if (typing) {
        cctx.fillStyle = 'rgba(136,204,255,0.4)';
        cctx.fillRect(11, 6, 4, 5);
        cctx.fillRect(17, 6, 4, 5);
      }
    }
    return;
  }

  // ── MEDITATE ──────────────────────────────────────────────
  if (char.action === 'meditate') {
    // Cross-legged seated, hands on knees, eyes closed, occasional aura pulse
    const breathe = Math.sin(frame * 0.025) * 1.5; // slow breath cycle
    const aura = (Math.sin(frame * 0.04) + 1) * 0.5; // 0→1 pulse

    // Aura glow rings
    cctx.strokeStyle = `rgba(150,210,255,${0.06 + aura * 0.1})`;
    cctx.lineWidth = 2;
    cctx.beginPath(); cctx.arc(16, 32, 14 + aura * 4, 0, Math.PI*2); cctx.stroke();
    cctx.beginPath(); cctx.arc(16, 32, 20 + aura * 5, 0, Math.PI*2); cctx.stroke();

    // Head — slightly raised (inhale)
    cctx.fillStyle = body; cctx.fillRect(10, 2 - Math.round(breathe * 0.5), 12, 11);
    cctx.fillStyle = hairCol; cctx.fillRect(10, 2 - Math.round(breathe * 0.5), 12, 3);
    cctx.fillStyle = hairCol; cctx.fillRect(10, 2 - Math.round(breathe * 0.5), 3, 7);
    // Closed eyes
    cctx.fillStyle = '#2c1810';
    cctx.fillRect(12, 8 - Math.round(breathe * 0.5), 3, 1);
    cctx.fillRect(18, 8 - Math.round(breathe * 0.5), 3, 1);
    // Calm mouth
    cctx.fillStyle = '#8b4513'; cctx.fillRect(13, 11, 6, 1);
    cctx.fillStyle = body; cctx.fillRect(14, 13, 5, 2);

    // Torso — upright, shirt
    cctx.fillStyle = shirt; cctx.fillRect(8, 15, 17, 14);
    // Arms resting on knees — bent outward
    cctx.fillStyle = shirt;
    cctx.fillRect(3, 20, 6, 8); cctx.fillRect(24, 20, 6, 8);
    cctx.fillStyle = body;
    cctx.fillRect(3, 27, 5, 4); cctx.fillRect(25, 27, 5, 4);
    // Hands open, palms up on knees
    cctx.fillStyle = body;
    cctx.fillRect(2, 30, 6, 3); cctx.fillRect(25, 30, 6, 3);

    // Cross-legged — legs folded flat
    cctx.fillStyle = pants; cctx.fillRect(4, 33, 26, 8);  // lap
    cctx.fillStyle = pants; cctx.fillRect(2, 39, 12, 5);  // left knee
    cctx.fillStyle = pants; cctx.fillRect(19, 39, 12, 5); // right knee
    cctx.fillStyle = shoe;  cctx.fillRect(2, 43, 9, 3);   // left foot
    cctx.fillStyle = shoe;  cctx.fillRect(22, 43, 9, 3);  // right foot

    // Floating energy dots
    const dots = [[8,8],[16,5],[24,8],[20,14],[12,14]];
    dots.forEach(([dx, dy], i) => {
      const pulse = Math.sin(frame * 0.05 + i * 1.2);
      cctx.fillStyle = `rgba(150,220,255,${0.3 + pulse * 0.3})`;
      cctx.fillRect(dx + Math.round(pulse), dy - Math.round(Math.abs(pulse) * 2), 2, 2);
    });
    alienHead(10, 2 - Math.round(breathe * 0.5)); femaleHair(10, 2 - Math.round(breathe * 0.5));
    return;
  }

  // ── PAINT ─────────────────────────────────────────────────
  if (char.action === 'paint') {
    const CYCLE = 90, f = frame % CYCLE;
    const stroke = f < 45 ? f / 45 : (90 - f) / 45; // 0→1→0 brush stroke motion
    const brushX = Math.round(stroke * 12); // right arm sweeps
    const splat = frame % 40 === 0;

    cctx.fillStyle = body; cctx.fillRect(10, 2, 12, 11);
    cctx.fillStyle = hairCol; cctx.fillRect(10, 2, 12, 3); cctx.fillRect(10, 2, 3, 7);
    cctx.fillStyle = '#2c1810'; cctx.fillRect(12, 8, 2, 2); cctx.fillRect(18, 8, 2, 2);
    // Focused mouth (slight squint concentration)
    cctx.fillStyle = '#8b4513'; cctx.fillRect(13, 11, 4, 1);
    cctx.fillStyle = body; cctx.fillRect(14, 13, 5, 3);
    cctx.fillStyle = shirt; cctx.fillRect(8, 16, 17, 14);

    // Left arm holding palette
    cctx.fillStyle = shirt; cctx.fillRect(3, 18, 5, 12);
    cctx.fillStyle = body;  cctx.fillRect(3, 29, 5, 4);
    // Palette — oval with color blobs
    cctx.fillStyle = '#c8a060'; cctx.fillRect(0, 28, 10, 7);
    ['#ff4444','#44ff44','#4444ff','#ffff44'].forEach((c,i)=>{
      cctx.fillStyle = c; cctx.fillRect(1+i*2, 29, 2, 3);
    });

    // Right arm — brush strokes canvas
    cctx.fillStyle = shirt; cctx.fillRect(24, 16, 5, 10 + Math.round(stroke * 4));
    cctx.fillStyle = body;  cctx.fillRect(24, 26 + Math.round(stroke * 4), 5, 4);
    // Brush
    cctx.fillStyle = '#8b6040'; cctx.fillRect(27, 22 + brushX, 2, 12);
    // Brush tip with paint color
    const hue = (frame * 2) % 360;
    cctx.fillStyle = `hsl(${hue},80%,55%)`; cctx.fillRect(27, 33 + brushX, 2, 3);

    cctx.fillStyle = pants; cctx.fillRect(8, 30, 17, 10);
    cctx.fillStyle = pants; cctx.fillRect(8, 40, 7, 10); cctx.fillRect(18, 40, 7, 10);
    cctx.fillStyle = shoe;  cctx.fillRect(7, 48, 9, 3);  cctx.fillRect(17, 48, 9, 3);

    // Paint splatter on shirt
    cctx.fillStyle = `hsl(${(frame*3)%360},70%,50%)`;
    cctx.fillRect(10, 20, 2, 2); cctx.fillRect(16, 18, 2, 2); cctx.fillRect(13, 22, 1, 1);
    alienHead(10, 2); femaleHair(10, 2);
    return;
  }

  // ── RUN ────────────────────────────────────────────────────
  if (char.action === 'run') {
    const CYCLE = 18, f = frame % CYCLE;
    const phase = f / CYCLE;
    // Running: legs alternate fast, arms pump, body leans forward
    const legL = Math.round(Math.sin(phase * Math.PI * 2) * 10);
    const legR = Math.round(Math.sin(phase * Math.PI * 2 + Math.PI) * 10);
    const armL = Math.round(Math.sin(phase * Math.PI * 2) * 7);
    const armR = Math.round(Math.sin(phase * Math.PI * 2 + Math.PI) * 7);
    const lean = 2; // forward lean

    // Head (leaning forward)
    cctx.fillStyle = body; cctx.fillRect(11+lean, 1, 12, 11);
    cctx.fillStyle = hairCol; cctx.fillRect(11+lean, 1, 12, 3); cctx.fillRect(11+lean, 1, 3, 7);
    cctx.fillStyle = '#2c1810'; cctx.fillRect(13+lean, 7, 2, 2); cctx.fillRect(19+lean, 7, 2, 2);
    // Determined mouth
    cctx.fillStyle = '#8b4513'; cctx.fillRect(14+lean, 10, 5, 1);
    cctx.fillStyle = body; cctx.fillRect(15+lean, 12, 4, 3);

    // Torso leaning, athletic shirt
    cctx.fillStyle = '#e04422'; cctx.fillRect(9+lean, 15, 15, 14); // red running shirt
    // Arms pumping
    cctx.fillStyle = '#e04422';
    cctx.fillRect(6, 15 + armL, 4, 10);
    cctx.fillRect(23, 15 - armR, 4, 10);
    cctx.fillStyle = body;
    cctx.fillRect(6, 25 + armL, 4, 4);
    cctx.fillRect(23, 25 - armR, 4, 4);

    // Legs pumping hard
    cctx.fillStyle = '#1a2a3a'; // dark running shorts
    cctx.fillRect(9+lean, 29, 15, 8);
    cctx.fillStyle = '#1a2a3a';
    cctx.fillRect(9, 37, 7, 5 + Math.max(0, legL)); // left upper leg
    cctx.fillRect(18, 37, 7, 5 + Math.max(0, legR));
    // Calves kick back
    cctx.fillStyle = '#1a2a3a';
    cctx.fillRect(9, 42 + Math.max(0,legL), 7, Math.max(2, 8 - Math.abs(legL)));
    cctx.fillRect(18, 42 + Math.max(0,legR), 7, Math.max(2, 8 - Math.abs(legR)));
    cctx.fillStyle = '#ff2200'; // red shoes
    cctx.fillRect(8, 48 + Math.min(legL,0), 10, 3);
    cctx.fillRect(17, 48 + Math.min(legR,0), 10, 3);

    // Speed lines
    cctx.fillStyle = 'rgba(255,255,255,0.25)';
    [6,12,18].forEach((y,i)=>{
      cctx.fillRect(0, y + (frame*2+i*8)%20, 4+i, 1);
    });
    alienHead(11 + lean, 1); femaleHair(11 + lean, 1);
    return;
  }

  // ── PHONE ──────────────────────────────────────────────────
  if (char.action === 'phone') {
    const CYCLE = 120, f = frame % CYCLE;
    const scroll = f < 80; // scrolling vs typing
    const thumbY = scroll ? Math.round(Math.sin(frame * 0.15) * 3) : 0;

    cctx.fillStyle = body; cctx.fillRect(10, 2, 12, 11);
    cctx.fillStyle = hairCol; cctx.fillRect(10, 2, 12, 3); cctx.fillRect(10, 2, 3, 7);
    cctx.fillStyle = '#2c1810'; cctx.fillRect(12, 8, 2, 2); cctx.fillRect(18, 8, 2, 2);
    // Eyes looking down at phone
    cctx.fillStyle = '#2c1810'; cctx.fillRect(12, 9, 2, 1); cctx.fillRect(18, 9, 2, 1);
    cctx.fillStyle = '#8b4513'; cctx.fillRect(13, 11, 6, 1);
    cctx.fillStyle = body; cctx.fillRect(14, 13, 5, 3);
    cctx.fillStyle = shirt; cctx.fillRect(8, 16, 17, 14);

    // Left arm supporting, right arm bent holding phone
    cctx.fillStyle = shirt; cctx.fillRect(5, 16, 4, 14);
    cctx.fillStyle = body;  cctx.fillRect(5, 30, 4, 4);
    cctx.fillStyle = shirt; cctx.fillRect(24, 16, 4, 10);
    cctx.fillStyle = body;  cctx.fillRect(23, 26, 5, 4); // hand holding phone up

    // Phone
    cctx.fillStyle = '#1a1a2a'; cctx.fillRect(20, 14, 8, 14);  // phone body
    cctx.fillStyle = '#0a0a1a'; cctx.fillRect(21, 15, 6, 12);  // screen
    // Screen content
    const screenHue = (frame * 2) % 360;
    cctx.fillStyle = `hsla(${screenHue},40%,60%,0.7)`;
    cctx.fillRect(22, 16, 4, 3); // image/thumbnail
    cctx.fillStyle = 'rgba(200,200,200,0.4)';
    cctx.fillRect(22, 20, 4, 1); cctx.fillRect(22, 22, 3, 1); // text lines
    // Thumb scrolling
    cctx.fillStyle = body; cctx.fillRect(21, 24 + thumbY, 2, 2);

    // Notification glow
    if (frame % 90 < 10) {
      cctx.fillStyle = `rgba(100,200,255,${0.4 - frame%90/25})`;
      cctx.fillRect(20, 14, 8, 14);
    }

    cctx.fillStyle = pants; cctx.fillRect(8, 30, 17, 10);
    cctx.fillStyle = pants; cctx.fillRect(8, 40, 7, 10); cctx.fillRect(18, 40, 7, 10);
    cctx.fillStyle = shoe;  cctx.fillRect(7, 48, 9, 3);  cctx.fillRect(17, 48, 9, 3);
    alienHead(10, 2); femaleHair(10, 2);
    return;
  }

  // ── PUSHUPS ────────────────────────────────────────────────
  if (char.action === 'pushups') {
    const CYCLE = 40, f = frame % CYCLE;
    const down = f < 20 ? f / 20 : (40 - f) / 20; // 0→1→0 (down = 1)
    const bodyY = Math.round(down * 8); // body lowers toward floor

    // Plank position — horizontal body
    // Head
    cctx.fillStyle = body; cctx.fillRect(22, 20 + bodyY, 10, 9);
    cctx.fillStyle = hairCol; cctx.fillRect(22, 20 + bodyY, 10, 3);
    cctx.fillStyle = '#2c1810';
    if (down > 0.7) { // straining face at bottom
      cctx.fillRect(24, 26 + bodyY, 2, 1); cctx.fillRect(29, 26 + bodyY, 2, 1);
      cctx.fillStyle = '#8b4513'; cctx.fillRect(25, 27 + bodyY, 4, 2);
    } else {
      cctx.fillRect(24, 26 + bodyY, 2, 2); cctx.fillRect(29, 26 + bodyY, 2, 2);
    }
    // Body plank — horizontal torso
    cctx.fillStyle = '#e04422'; cctx.fillRect(4, 26 + bodyY, 20, 8); // shirt
    // Arms — push position
    const armH = Math.round((1 - down) * 10) + 2;
    cctx.fillStyle = '#e04422'; // sleeve
    cctx.fillRect(4, 26 + bodyY, 4, armH);
    cctx.fillStyle = body; cctx.fillRect(3, 26 + bodyY + armH, 6, 4); // hand on floor
    // Legs straight back
    cctx.fillStyle = '#1a2a3a'; cctx.fillRect(0, 32 + bodyY, 6, 8);
    cctx.fillStyle = '#ff2200'; cctx.fillRect(0, 39 + bodyY, 6, 3);

    // Sweat drop at peak effort
    if (down > 0.8) {
      cctx.fillStyle = 'rgba(100,180,255,0.8)';
      cctx.fillRect(28, 18 + bodyY, 2, 3);
    }
    // Rep counter vibe
    cctx.fillStyle = 'rgba(255,200,50,0.7)';
    cctx.font = '7px monospace';
    cctx.fillText(Math.floor(frame/40), 1, 12);
    alienHead(22, 20 + bodyY); femaleHair(22, 20 + bodyY);
    return;
  }

  // ── JOURNAL ────────────────────────────────────────────────
  if (char.action === 'journal') {
    const writing = frame % 60 < 40; // writing vs pausing to think
    const penX = Math.round((frame % 30) * 0.4); // pen moves right

    cctx.fillStyle = body; cctx.fillRect(10, 2, 12, 11);
    cctx.fillStyle = hairCol; cctx.fillRect(10, 2, 12, 3); cctx.fillRect(10, 2, 3, 7);
    // Eyes down at journal
    cctx.fillStyle = '#2c1810'; cctx.fillRect(12, 9, 2, 1); cctx.fillRect(18, 9, 2, 1);
    // Thoughtful expression
    cctx.fillStyle = '#8b4513';
    if (!writing) { // pausing, looking up slightly
      cctx.fillRect(13, 10, 5, 1); cctx.fillRect(12, 9, 1, 1);
    } else {
      cctx.fillRect(13, 11, 5, 1);
    }
    cctx.fillStyle = body; cctx.fillRect(14, 13, 5, 3);
    cctx.fillStyle = shirt; cctx.fillRect(8, 16, 17, 14);

    // Both arms bent, resting on desk/lap holding journal
    cctx.fillStyle = shirt; cctx.fillRect(4, 18, 5, 14); cctx.fillRect(23, 18, 5, 14);
    cctx.fillStyle = body; cctx.fillRect(4, 32, 5, 4); cctx.fillRect(23, 32, 5, 4);

    // Open journal / notebook
    cctx.fillStyle = '#1a3a5a'; cctx.fillRect(2, 32, 28, 16); // dark cover
    cctx.fillStyle = '#f0ede0'; cctx.fillRect(3, 33, 12, 14); // left page
    cctx.fillStyle = '#ece9d8'; cctx.fillRect(16, 33, 13, 14); // right page
    cctx.fillStyle = '#1a3a5a'; cctx.fillRect(15, 33, 2, 14); // spine
    // Writing lines
    cctx.fillStyle = 'rgba(0,0,80,0.2)';
    for (let i = 0; i < 4; i++) {
      cctx.fillRect(4, 35 + i*3, 10, 1);
      cctx.fillRect(17, 35 + i*3, 10, 1);
    }
    // Pen / writing motion
    if (writing) {
      cctx.fillStyle = '#444'; cctx.fillRect(22 + Math.round(penX*0.3), 32, 1, 6);
      // ink trail
      cctx.fillStyle = 'rgba(20,20,80,0.5)';
      cctx.fillRect(17, 38, Math.min(penX, 10), 1);
    }
    cctx.fillStyle = pants; cctx.fillRect(8, 30, 17, 10);
    cctx.fillStyle = pants; cctx.fillRect(5, 38, 10, 6); cctx.fillRect(18, 38, 10, 6);
    cctx.fillStyle = shoe; cctx.fillRect(4, 43, 11, 3); cctx.fillRect(17, 43, 11, 3);
    alienHead(10, 2); femaleHair(10, 2);
    return;
  }

  // ── FISH ───────────────────────────────────────────────────
  if (char.action === 'fish') {
    const bob = Math.sin(frame * 0.03) * 2; // very slow float
    const nibble = frame % 180 > 160; // occasional nibble excitement

    cctx.fillStyle = body; cctx.fillRect(10, 2, 12, 11);
    cctx.fillStyle = hairCol; cctx.fillRect(10, 2, 12, 3); cctx.fillRect(10, 2, 3, 7);
    // Relaxed half-closed eyes
    cctx.fillStyle = '#2c1810'; cctx.fillRect(12, 9, 3, 1); cctx.fillRect(18, 9, 3, 1);
    cctx.fillStyle = '#8b4513'; cctx.fillRect(13, 11, 6, 1);
    cctx.fillStyle = body; cctx.fillRect(14, 13, 5, 3);

    // Casual shirt — light blue fishing vest vibe
    cctx.fillStyle = '#4a7a9a'; cctx.fillRect(8, 16, 17, 14);

    // Arms — right extended holding rod, left in pocket/lap
    cctx.fillStyle = '#4a7a9a'; cctx.fillRect(5, 16, 4, 12);
    cctx.fillStyle = body; cctx.fillRect(5, 28, 4, 4);
    cctx.fillStyle = '#4a7a9a'; cctx.fillRect(23, 14, 5, 14); // arm up holding rod
    cctx.fillStyle = body; cctx.fillRect(23, 28, 5, 4);

    // Fishing rod — long diagonal line
    cctx.fillStyle = '#6a4020';
    cctx.fillRect(26, 10, 2, 20); // rod body
    cctx.fillRect(27, 8, 1, 3);   // tip
    // Fishing line
    cctx.strokeStyle = 'rgba(200,200,200,0.5)';
    cctx.lineWidth = 1;
    cctx.beginPath();
    cctx.moveTo(28, 8);
    cctx.lineTo(32, 38 + Math.round(bob)); // line going into water
    cctx.stroke();
    // Float bobbing
    cctx.fillStyle = nibble ? '#ff4444' : '#ff8822';
    cctx.fillRect(30, 36 + Math.round(bob), 3, 3);
    if (nibble) { // excitement ripple
      cctx.strokeStyle = 'rgba(100,200,255,0.5)';
      cctx.lineWidth = 1;
      cctx.beginPath(); cctx.arc(32, 38, 4, 0, Math.PI*2); cctx.stroke();
    }

    cctx.fillStyle = pants; cctx.fillRect(8, 30, 17, 10);
    cctx.fillStyle = pants; cctx.fillRect(8, 40, 7, 10); cctx.fillRect(18, 40, 7, 10);
    cctx.fillStyle = shoe;  cctx.fillRect(7, 48, 9, 3);  cctx.fillRect(17, 48, 9, 3);
    alienHead(10, 2); femaleHair(10, 2);
    return;
  }

  // ── BARTEND ────────────────────────────────────────────────
  if (char.action === 'bartend') {
    const CYCLE = 60, f = frame % CYCLE;
    const shake = f < 30; // shaking vs pouring motion
    const shakeX = shake ? Math.round(Math.sin(frame * 0.5) * 3) : 0;

    cctx.fillStyle = body; cctx.fillRect(10, 2, 12, 11);
    cctx.fillStyle = hairCol; cctx.fillRect(10, 2, 12, 3); cctx.fillRect(10, 2, 3, 7);
    cctx.fillStyle = '#2c1810'; cctx.fillRect(12, 8, 2, 2); cctx.fillRect(18, 8, 2, 2);
    // Smirk — charismatic expression
    cctx.fillStyle = '#8b4513';
    cctx.fillRect(14, 11, 6, 1); cctx.fillRect(19, 10, 1, 1);
    cctx.fillStyle = body; cctx.fillRect(14, 13, 5, 3);

    // Black bartender shirt / vest
    cctx.fillStyle = '#1a1a2a'; cctx.fillRect(8, 16, 17, 14);
    cctx.fillStyle = '#e8e0d0'; cctx.fillRect(13, 16, 5, 14); // white shirt collar

    // Arms — right shaking cocktail shaker
    cctx.fillStyle = '#1a1a2a'; cctx.fillRect(5, 16, 4, 12); // left arm
    cctx.fillStyle = body; cctx.fillRect(5, 28, 4, 4);
    cctx.fillStyle = '#1a1a2a'; cctx.fillRect(24, 10 + shakeX, 4, 16); // right arm raised
    cctx.fillStyle = body; cctx.fillRect(24, 26 + shakeX, 4, 4);

    // Cocktail shaker in right hand
    cctx.fillStyle = '#aaaaaa'; cctx.fillRect(23, 4 + shakeX, 6, 8);  // shaker top
    cctx.fillStyle = '#888888'; cctx.fillRect(22, 9 + shakeX, 8, 10); // shaker body
    // Glint
    cctx.fillStyle = 'rgba(255,255,255,0.6)'; cctx.fillRect(24, 5 + shakeX, 1, 4);

    // Pour effect when not shaking
    if (!shake) {
      cctx.fillStyle = `hsla(${(frame*4)%360},70%,55%,0.7)`;
      for (let d = 0; d < 6; d++) {
        cctx.fillRect(24 + Math.round(Math.sin(d)*1), 18 + d*2, 2, 2);
      }
    }

    // Glass on bar
    cctx.fillStyle = 'rgba(200,230,255,0.4)'; cctx.fillRect(4, 38, 8, 12);
    cctx.strokeStyle = 'rgba(150,200,255,0.6)'; cctx.lineWidth=1;
    cctx.strokeRect(4, 38, 8, 12);
    // Drink color
    cctx.fillStyle = `hsla(${(frame*2)%360},60%,55%,0.5)`;
    cctx.fillRect(5, 42, 6, 7);

    cctx.fillStyle = pants; cctx.fillRect(8, 30, 17, 10);
    cctx.fillStyle = pants; cctx.fillRect(8, 40, 7, 10); cctx.fillRect(18, 40, 7, 10);
    cctx.fillStyle = '#1a1a1a'; cctx.fillRect(7, 48, 9, 3); cctx.fillRect(17, 48, 9, 3);
    alienHead(10, 2); femaleHair(10, 2);
    return;
  }

  // ── IDLE / WALKING (default) ───────────────────
  const ls=char.moving?Math.sin(frame*0.3)*5:0;
  const as=char.moving?Math.sin(frame*0.3)*4:0;
  // idle sway when still
  const sway=char.moving?0:Math.sin(frame*0.04)*0.8;
  const swayR=Math.round(sway);

  cctx.fillStyle=body; cctx.fillRect(10+swayR,2,12,11);
  cctx.fillStyle=hairCol; cctx.fillRect(10+swayR,2,12,3); cctx.fillRect(10+swayR,2,3,7);
  cctx.fillStyle='#2c1810';
  if(m<-30){ cctx.fillRect(12+swayR,8,2,2); cctx.fillRect(18+swayR,8,2,2); cctx.fillRect(13+swayR,6,1,1); cctx.fillRect(19+swayR,6,1,1); }
  else if(m>60){ cctx.fillRect(12+swayR,8,2,1); cctx.fillRect(18+swayR,8,2,1); }
  else { cctx.fillRect(12+swayR,8,2,2); cctx.fillRect(18+swayR,8,2,2); }
  cctx.fillStyle='#8b4513';
  if(m>20){ cctx.fillRect(13+swayR,11,6,1); cctx.fillRect(12+swayR,10,1,1); cctx.fillRect(19+swayR,10,1,1); }
  else if(m<-20){ cctx.fillRect(13+swayR,12,6,1); cctx.fillRect(12+swayR,11,1,1); cctx.fillRect(19+swayR,11,1,1); }
  else { cctx.fillRect(13+swayR,11,6,1); }
  cctx.fillStyle=body; cctx.fillRect(14,13,5,3);
  cctx.fillStyle=shirt; cctx.fillRect(8,16,17,14);
  cctx.fillStyle=shirt; cctx.fillRect(5,16,4,10+as); cctx.fillRect(24,16,4,10-as);
  cctx.fillStyle=body; cctx.fillRect(5,26+as,4,4); cctx.fillRect(24,26-as,4,4);
  cctx.fillStyle=pants; cctx.fillRect(8,30,17,10);
  cctx.fillStyle=pants; cctx.fillRect(8,40,7,8+ls); cctx.fillRect(18,40,7,8-ls);
  cctx.fillStyle=shoe; cctx.fillRect(7,46+ls,9,3); cctx.fillRect(17,46-ls,9,3);

  // Alien-specific: overwrite hair area + add antenna & big eyes
  if (_pcd && _pcd.type === 'alien') {
    cctx.fillStyle = '#55bb66';
    cctx.fillRect(10+swayR, 2, 12, 3); cctx.fillRect(10+swayR, 2, 3, 9);
    // Antenna
    cctx.fillStyle = '#88ffcc';
    cctx.fillRect(15+swayR, -4, 2, 8);
    cctx.fillRect(13+swayR, -5, 6, 3);
    // Big alien eyes (overwrite normal eyes)
    cctx.fillStyle = '#000022';
    cctx.fillRect(11+swayR, 5, 4, 5); cctx.fillRect(17+swayR, 5, 4, 5);
    cctx.fillStyle = '#88ccff';
    cctx.fillRect(12+swayR, 6, 2, 2); cctx.fillRect(18+swayR, 6, 2, 2);
  }
}

// Furniture anchor positions (world coords) — character snaps here for activities
const ACTIVITY_SPOTS = {
  apartment: {
    cook:     { x: 992  },  // hotplate: apartment ox(480) + 512
    read:     { x: 840  },
    idle:     { x: 780  },
    study:    { x: 960  },
    sleep:    { x: 640  },
    meditate: { x: 710  },
    paint:    { x: 1050 },
    phone:    { x: 820  },
    journal:  { x: 875  },
  },
  gym: {
    lift:    { x: 200 },
    pushups: { x: 320 },
    run:     { x: 400 },
  },
  store: {
    shop: { x: 1380 },   // aisle 1 start; shopping walk logic moves through aisles
  },
  nightclub: {
    dance:   { x: 2350 },
    bartend: { x: 2150 },
  },
  street: {
    idle:  { x: 1950 },
    run:   { x: 1900 },
    phone: { x: 2000 },
  },
};

// ── SHOPPING STATE MACHINE ─────────────────────────────────
// Completely owns movement while active.
// checkFreeWill is blocked during a shopping trip so the
// decision engine can't interrupt mid-aisle.

const shopCart = {
  active:       false,
  items:        [],
  aisleTargets: [],
  aisleIdx:     0,
  phase:        'walk',   // 'walk' | 'grab' | 'checkout' | 'done'
  phaseTimer:   0,        // counts UP in frames
  GRAB_FRAMES:  38,       // frames to stand at shelf (~0.6s at 60fps)
  CHECKOUT_FRAMES: 50,    // frames at checkout before done
};

const STORE_SHELVES  = [1300, 1390, 1490, 1600]; // world x of each of the 4 shelves
const CHECKOUT_X     = 1275;                      // checkout counter world x
const SHELF_ITEMS    = [
  ['🍎','🍊','🥦','🍅'],
  ['🥫','🍞','🥜','🍪'],
  ['🥛','🧀','🥚','🧈'],
  ['🍺','🥤','🍷','💧'],
];

function startShoppingTrip() {
  shopCart.active       = true;
  shopCart.items        = [];
  shopCart.aisleTargets = [...STORE_SHELVES];
  shopCart.aisleIdx     = 0;
  shopCart.phase        = 'walk';
  shopCart.phaseTimer   = 0;
  // Walk to first shelf immediately
  char.tx      = shopCart.aisleTargets[0];
  char.moving  = true;
  char.facing  = 1;
}

function tickShopping() {
  // Only run when actively shopping
  if (!shopCart.active) return;
  if (char.action !== 'shop') { shopCart.active = false; return; }

  shopCart.phaseTimer++;

  if (shopCart.phase === 'walk') {
    // Wait until character finishes walking to current shelf
    if (!char.moving) {
      shopCart.phase      = 'grab';
      shopCart.phaseTimer = 0;
    }
    return;
  }

  if (shopCart.phase === 'grab') {
    // Stand at shelf for GRAB_FRAMES, then pick item
    if (shopCart.phaseTimer < shopCart.GRAB_FRAMES) return;
    shopCart.phaseTimer = 0;

    // Pick an item from this shelf
    const row   = shopCart.aisleIdx % SHELF_ITEMS.length;
    const items = SHELF_ITEMS[row];
    shopCart.items.push(items[Math.floor(Math.random() * items.length)]);
    shopCart.aisleIdx++;

    if (shopCart.aisleIdx < shopCart.aisleTargets.length) {
      // More aisles — walk to next shelf
      char.tx     = shopCart.aisleTargets[shopCart.aisleIdx];
      char.moving = true;
      shopCart.phase = 'walk';
    } else {
      // All aisles done — head to checkout
      char.tx     = CHECKOUT_X;
      char.moving = true;
      shopCart.phase = 'checkout';
    }
    return;
  }

  if (shopCart.phase === 'checkout') {
    // Wait until arrived at checkout
    if (char.moving) return;
    // Stand at checkout briefly
    if (shopCart.phaseTimer < shopCart.CHECKOUT_FRAMES) return;
    // Done — trip complete
    shopCart.phase  = 'done';
    shopCart.active = false;
    addLog('🛒 checkout done');
  }
}

function pickSpot(locName, action) {
  const spots = ACTIVITY_SPOTS[locName];
  if (spots && action && spots[action]) return spots[action];
  const l = LOCS[locName]; if (!l) return {x:760};
  return {x: l.x0 + 80 + Math.random() * (l.x1 - l.x0 - 160)};
}

function travelTo(locName, action='idle') {
  // Hard block: 'docks' and 'mines' are canvas scenes — never walk there.
  // If this is called with a scene name it would set char.loc permanently,
  // making the HUD show the wrong location even after returning home.
  if (locName === 'docks' || locName === 'mines') return;
  const s = pickSpot(locName, action);
  char.tx = s.x; char.moving = true; char.loc = locName;
  char.action = 'idle';
  char._nextAction = action;
  if (action === 'shop') char._pendingShop = true;
  addLog(`🚶 ${locName}`);
}

function updateMove() {
  if (!char.moving) return;
  const dx = char.tx - char.wx;
  if (Math.abs(dx) < 3) {
    char.wx = char.tx; char.moving = false;
    if (char._nextAction) { char.action = char._nextAction; char._nextAction = null; }
    // Kick off shopping trip on arrival
    if (char._pendingShop && char.action === 'shop') {
      char._pendingShop = false;
      startShoppingTrip();
    }
    return;
  }
  const _ovSpd = typeof getEquipStats === 'function' ? (getEquipStats().strideSpeed || 0) : 0;
  char.wx += Math.sign(dx) * 2.8 * (1 + _ovSpd * 0.04);
  char.facing = dx > 0 ? 1 : -1;
}

