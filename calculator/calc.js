let boxes=document.querySelectorAll(".boxes");
let array=Array.from(boxes)

let string="";
let input=document.querySelector("input")
array.forEach((box)=>{
    
 
    box.addEventListener("click",(e)=>{
        

  

       if(e.target.innerHTML==="="){
        input.value=eval(string);
        
       } 
       else if(e.target.innerHTML==="AC"){
         string="";
         input.value=string
       }
       else if(e.target.innerHTML==="DEL"){
        string=string.substring(0,string.length-1)
        input.value=string
       }
       else{
        string+=e.target.innerHTML;
        console.log(string)
        input.value=string;
       }
        })
  
})