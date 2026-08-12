const glow=document.querySelector(".cursor-glow");
document.addEventListener("pointermove",e=>{glow.style.left=e.clientX+"px";glow.style.top=e.clientY+"px"});
document.querySelectorAll(".card").forEach(card=>{
  card.addEventListener("mousemove",e=>{
    const r=card.getBoundingClientRect();
    card.style.transform=`translateY(-5px) rotateX(${(e.clientY-r.top-r.height/2)/-35}deg) rotateY(${(e.clientX-r.left-r.width/2)/35}deg)`;
    card.style.transformOrigin="center";
  });
  card.addEventListener("mouseleave",()=>card.style.transform="");
});
