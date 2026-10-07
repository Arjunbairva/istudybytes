(function(){
const root=document.getElementById("quiz-app");
if(!root)return;

const p=new URLSearchParams(location.search);
const selected=p.has("class")&&p.has("subject");
const cls=p.get("class")||"";
const subject=p.get("subject")||"";
const chapter=p.get("chapter")||"";

let questions=[],i=0,score=0,answered=false,answerLog=[],startedAt=new Date().toISOString();

const chapterLists={
"9|Science":[
["Exploration: Entering the World of Secondary Science","Exploration"],
["Cell: The Building Block of Life","Cell"],
["Tissues in Action","Tissues in Action"],
["Describing Motion Around Us","Describing Motion Around Us"],
["Exploring Mixtures and their Separation","Exploring Mixtures and their Separation"],
["How Forces Affect Motion","How Forces Affect Motion"],
["Work, Energy, and Simple Machines","Work, Energy, and Simple Machines"],
["Journey Inside the Atom","Journey Inside the Atom"],
["Atomic Foundations of Matter","Atomic Foundations of Matter"],
["Sound Waves: Characteristics and Applications","Sound Waves: Characteristics and Applications"],
["Reproduction: How Life Continues","Reproduction: How Life Continues"],
["Patterns in Life: Diversity and Classification","Patterns in Life: Diversity and Classification"],
["Earth as a System: Energy, Matter, and Life","Earth as a System: Energy, Matter, and Life"]
],
"9|Mathematics":[
["Orienting Yourself: The Use of Coordinates","Orienting Yourself: The Use of Coordinates"],
["Introduction to Linear Polynomials","Introduction to Linear Polynomials"],
["The World of Numbers","The World of Numbers"],
["Exploring Algebraic Identities","Exploring Algebraic Identities"],
["I’m Up and Down, and Round and Round","I’m Up and Down, and Round and Round"],
["Measuring Space: Perimeter and Area","Measuring Space: Perimeter and Area"],
["The Mathematics of Maybe: Introduction to Probability","The Mathematics of Maybe: Introduction to Probability"],
["Predicting What Comes Next: Exploring Sequences and Progressions","Predicting What Comes Next: Exploring Sequences and Progressions"],
["Propositions and their Converses","Propositions and their Converses"],
["How Quantities Combine: Understanding Data","How Quantities Combine: Understanding Data"],
["The World of Algorithms","The World of Algorithms"],
["Quadrilaterals","Quadrilaterals"],
["Two Variables, One Line","Two Variables, One Line"],
["Math of Space: Surface Area and Volume","Math of Space: Surface Area and Volume"]
],
"10|Science":[
["Chemical Reactions and Equations","Chemical Reactions and Equations"],
["Acids, Bases and Salts","Acids, Bases and Salts"],
["Metals and Non-metals","Metals and Non-metals"],
["Carbon and its Compounds","Carbon and its Compounds"],
["Life Processes","Life Processes"],
["Control and Coordination","Control and Coordination"],
["How do Organisms Reproduce?","How do Organisms Reproduce?"],
["Heredity","Heredity"],
["Light: Reflection and Refraction","Light: Reflection and Refraction"],
["The Human Eye and the Colourful World","The Human Eye and the Colourful World"],
["Electricity","Electricity"],
["Magnetic Effects of Electric Current","Magnetic Effects of Electric Current"],
["Our Environment","Our Environment"]
],
"10|Mathematics":[
["Real Numbers","Real Numbers"],
["Polynomials","Polynomials"],
["Pair of Linear Equations in Two Variables","Pair of Linear Equations in Two Variables"],
["Quadratic Equations","Quadratic Equations"],
["Arithmetic Progressions","Arithmetic Progressions"],
["Triangles","Triangles"],
["Coordinate Geometry","Coordinate Geometry"],
["Introduction to Trigonometry","Introduction to Trigonometry"],
["Some Applications of Trigonometry","Some Applications of Trigonometry"],
["Circles","Circles"],
["Areas Related to Circles","Areas Related to Circles"],
["Surface Areas and Volumes","Surface Areas and Volumes"],
["Statistics","Statistics"],
["Probability","Probability"]
]};

const fallback=[
{class_level:"9",subject:"Science",chapter:"Cell",question:"Which structure controls most activities of a cell?",question_type:"single",option_a:"Cell wall",option_b:"Nucleus",option_c:"Vacuole",option_d:"Cytoplasm",correct_answer:"B",explanation:"The nucleus contains genetic material and coordinates many cellular activities."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"Which statement about osmosis is correct?",question_type:"single",option_a:"Water moves through a selectively permeable membrane",option_b:"Solute always moves from low to high concentration",option_c:"Only gases undergo osmosis",option_d:"Osmosis requires boiling",correct_answer:"A",explanation:"Osmosis is movement of water through a selectively permeable membrane."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"A raisin swells when placed in water because water enters it by osmosis.",question_type:"true_false",option_a:"True",option_b:"False",correct_answer:"A",explanation:"Water enters the raisin from the surrounding dilute solution."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"Which instrument was used by Robert Hooke when he observed cork in 1665?",question_type:"single",option_a:"Telescope",option_b:"Microscope",option_c:"Thermometer",option_d:"Barometer",correct_answer:"B",explanation:"Robert Hooke observed cork using a microscope he had designed himself."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"Which statement correctly distinguishes diffusion from osmosis?",question_type:"single",option_a:"Diffusion is only movement of water",option_b:"Osmosis occurs only without a membrane",option_c:"Diffusion is movement of particles down a concentration gradient, while osmosis is movement of water through a selectively permeable membrane",option_d:"They are exactly the same process",correct_answer:"C",explanation:"The chapter defines diffusion as particle movement from higher to lower concentration and osmosis as water movement through a selectively permeable membrane."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"A solution with higher solute concentration outside a cell is called:",question_type:"single",option_a:"Isotonic",option_b:"Hypotonic",option_c:"Hypertonic",option_d:"Neutral",correct_answer:"C",explanation:"A hypertonic solution has higher solute concentration outside the cell, so water tends to leave the cell."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"Which organelle is the main site of protein synthesis?",question_type:"single",option_a:"Ribosome",option_b:"Vacuole",option_c:"Lysosome",option_d:"Golgi apparatus",correct_answer:"A",explanation:"Ribosomes are the sites of protein synthesis."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"Why are cristae important in mitochondria?",question_type:"single",option_a:"They store genetic material",option_b:"They increase the surface area of the inner membrane",option_c:"They digest waste",option_d:"They make the cell wall rigid",correct_answer:"B",explanation:"Cristae increase the surface area of the inner mitochondrial membrane for energy-producing reactions."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"Which statement about prokaryotic cells is correct?",question_type:"single",option_a:"They have a well-defined nucleus",option_b:"They contain many membrane-bound organelles",option_c:"Their genetic material is present in a nucleoid region",option_d:"They are always multicellular",correct_answer:"C",explanation:"Prokaryotic cells do not have a well-defined nucleus; their DNA is present in the nucleoid region."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"Mitosis generally produces:",question_type:"single",option_a:"Four cells with half the chromosome number",option_b:"Two genetically identical daughter cells",option_c:"Only gametes",option_d:"One daughter cell",correct_answer:"B",explanation:"One parent cell divides through mitosis to produce two genetically identical daughter cells with the same chromosome number."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"Meiosis is important for the formation of gametes.",question_type:"true_false",option_a:"True",option_b:"False",correct_answer:"A",explanation:"Meiosis produces cells with half the chromosome number that develop into gametes involved in sexual reproduction."},
{class_level:"9",subject:"Science",chapter:"Cell",question:"Which scientist stated that new cells arise from pre-existing cells?",question_type:"single",option_a:"Robert Hooke",option_b:"Theodor Schwann",option_c:"Rudolf Virchow",option_d:"Camillo Golgi",correct_answer:"C",explanation:"Rudolf Virchow expanded cell theory by stating that new cells are formed only from pre-existing cells."}
];

const esc=v=>String(v??"").replace(/[&<>'\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
const title=document.getElementById("quiz-title");
const intro=document.getElementById("quiz-intro");
const library=document.getElementById("quiz-library");
const note=document.getElementById("quiz-note");
const body=document.getElementById("quiz-body");
const result=document.getElementById("quiz-result");
const back=document.getElementById("quiz-back");

function showLanding(){
  title.textContent="Free CBSE Quizzes";
  intro.textContent="Choose your class and subject to start a free chapter-wise quiz.";
  library.hidden=false;
  note.hidden=false;
  body.hidden=true;
  result.hidden=true;
  back.hidden=true;
}

function showChapterList(){
  const key=cls+"|"+subject;
  const list=chapterLists[key]||[];

  title.textContent="Class "+cls+" "+subject+" Quizzes";
  intro.textContent="Select a chapter to open its free quiz.";
  library.hidden=true;
  note.hidden=true;
  result.hidden=true;
  back.hidden=false;
  body.hidden=false;

  const makeCard=(item,index)=>{
    const chapterNumber=index+1;
    return "<a class=\"card card--row card--sm lesson\" href=\"quiz.html?class="+encodeURIComponent(cls)+"&subject="+encodeURIComponent(subject)+"&chapter="+encodeURIComponent(item[1])+"\">"+
      "<span class=\"lesson__num\" aria-hidden=\"true\">"+String(chapterNumber).padStart(2,"0")+"</span>"+
      "<span class=\"lesson__body card__body\"><strong>"+esc(item[0])+"</strong><small>Chapter "+chapterNumber+"</small></span>"+
      "<span class=\"card__arrow\" aria-hidden=\"true\">→</span>"+
      "</a>";
  };

  let content="<div class=\"section__head\"><span class=\"eyebrow\">Chapter selector</span><h2>Select a chapter</h2><p>Choose a chapter below. The quiz opens after you select it.</p></div>";

  if(key==="9|Mathematics"){
    content+="<section class=\"quiz-part\"><h3 class=\"quiz-part__title\">Part 1 <span>Chapters 1–8</span></h3><div class=\"grid grid--2\">"+
      list.slice(0,8).map((item,index)=>makeCard(item,index)).join("")+
      "</div></section>";
    content+="<section class=\"quiz-part\"><h3 class=\"quiz-part__title\">Part 2 <span>Chapters 9–14</span></h3><div class=\"grid grid--2\">"+
      list.slice(8).map((item,index)=>makeCard(item,index+8)).join("")+
      "</div></section>";
  }else{
    content+="<div class=\"grid grid--2\">"+
      list.map((item,index)=>makeCard(item,index)).join("")+
      "</div>";
  }

  body.innerHTML=content;
}
function showQuizHeader(){
  title.textContent="Class "+cls+" "+subject+" Quiz"+(chapter?" — "+chapter:"");
  intro.textContent="Answer the questions below and check your understanding.";
  library.hidden=true;
  note.hidden=true;
  back.hidden=false;
}

function showUnavailable(){
  body.hidden=false;
  body.innerHTML="<div class=\"empty-state\"><h2>Quiz not available yet</h2><p>Questions for this chapter are being added. Please check back soon.</p><a class=\"btn btn-secondary\" href=\"quiz.html?class="+encodeURIComponent(cls)+"&subject="+encodeURIComponent(subject)+"\">Back to chapters</a></div>";
}

function useFallback(){
  const matching=fallback.filter(x=>x.class_level===cls&&x.subject===subject&&(!chapter||x.chapter===chapter));
  if(!matching.length){showUnavailable();return;}
  questions=matching.slice(0,10);
  render();
}

async function load(){
  showQuizHeader();
  try{
    if(typeof supabaseClient!=="undefined"){
      const request=supabaseClient.from("quiz_questions").select("*").eq("published",true).eq("class_level",cls).eq("subject",subject);
      const q=chapter?request.eq("chapter",chapter):request;
      const r=await Promise.race([
        q.limit(20),
        new Promise(resolve=>setTimeout(()=>resolve({error:new Error("Quiz request timed out"),data:null}),4000))
      ]);
      if(!r.error&&Array.isArray(r.data)&&r.data.length)questions=r.data;
    }
  }catch(e){console.warn("Quiz database unavailable.",e)}
  if(!questions.length){useFallback();return;}
  questions=questions.slice(0,10);
  render();
}

function render(){
  const q=questions[i];
  if(!q){showUnavailable();return;}
  answered=false;
  body.hidden=false;
  body.innerHTML="<div class=\"quiz-topline\"><strong id=\"quiz-count\">Question "+(i+1)+" of "+questions.length+"</strong><span class=\"badge\">Free quiz</span></div>"+
    "<div class=\"progress\"><span class=\"progress__bar\" id=\"quiz-progress\"></span></div>"+
    "<h2 id=\"quiz-question\"></h2><div id=\"quiz-options\"></div>"+
    "<div id=\"quiz-feedback\" class=\"notice\" hidden></div>"+
    "<div class=\"quiz-actions\"><a class=\"btn btn-secondary\" href=\"quiz.html?class="+encodeURIComponent(cls)+"&subject="+encodeURIComponent(subject)+"\">All chapters</a>"+
    "<button class=\"btn btn-primary\" id=\"quiz-next\" disabled>Next <span aria-hidden=\"true\">→</span></button></div>";
  body.querySelector("#quiz-progress").style.width=((i+1)/questions.length*100)+"%";
  body.querySelector("#quiz-question").textContent=q.question;
  const opts=q.question_type==="true_false"?[["A",q.option_a],["B",q.option_b]]:[["A",q.option_a],["B",q.option_b],["C",q.option_c],["D",q.option_d]];
  body.querySelector("#quiz-options").innerHTML=opts.filter(x=>x[1]).map(x=>"<button class=\"quiz-option\" data-value=\""+x[0]+"\"><b>"+x[0]+".</b> "+esc(x[1])+"</button>").join("");
  body.querySelectorAll(".quiz-option").forEach(b=>b.onclick=()=>answer(b,q));
  body.querySelector("#quiz-next").onclick=nextQuestion;
}

function answer(b,q){
  if(answered)return;
  answered=true;
  const ok=b.dataset.value===q.correct_answer;
  if(ok)score++;
  answerLog.push({
    question_id:q.id||null,
    question_number:i+1,
    selected_answer:b.dataset.value,
    correct_answer:q.correct_answer||null,
    is_correct:ok
  });
  b.classList.add(ok?"correct":"wrong");
  body.querySelectorAll(".quiz-option").forEach(x=>{if(x.dataset.value===q.correct_answer)x.classList.add("correct")});
  const f=body.querySelector("#quiz-feedback");
  f.hidden=false;
  f.className="notice "+(ok?"notice--success":"notice--danger");
  f.innerHTML="<strong>"+(ok?"Correct":"Review this one")+"</strong><br>"+esc(q.explanation||"Review the chapter concept and try again.");
  body.querySelector("#quiz-next").disabled=false;
}

async function saveAttempt(){
  try{
    if(typeof supabaseClient==="undefined")return;
    const sessionResult=await supabaseClient.auth.getSession();
    const session=sessionResult?.data?.session;
    if(!session?.user?.id)return;

    const courseResult=await supabaseClient.from("courses").select("id").eq("slug","class-"+cls).maybeSingle();
    const courseId=courseResult?.data?.id||null;
    const attemptResult=await supabaseClient.from("quiz_attempts").insert({
      user_id:session.user.id,
      course_id:courseId,
      class_level:cls,
      subject,
      chapter,
      question_count:questions.length,
      score,
      started_at:startedAt,
      completed_at:new Date().toISOString()
    }).select("id").single();
    if(attemptResult.error||!attemptResult.data?.id)return;
    if(answerLog.length){
      await supabaseClient.from("quiz_attempt_answers").insert(
        answerLog.map(item=>Object.assign({attempt_id:attemptResult.data.id},item))
      );
    }
  }catch(error){
    console.warn("Unable to save quiz attempt.",error);
  }
}

async function nextQuestion(){
  if(!answered)return;
  if(i<questions.length-1){i++;render();return;}
  await saveAttempt();
  body.hidden=true;
  result.hidden=false;
  document.getElementById("final-score").textContent=score+"/"+questions.length;
  document.getElementById("final-message").textContent=score>=questions.length*.7?"Good work. Review anything you missed.":"Review the chapter resources and try again.";
}

if(!selected){showLanding();}
else if(!chapter){showChapterList();}
else{load();}
})();