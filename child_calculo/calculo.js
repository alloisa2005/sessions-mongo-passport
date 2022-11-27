
let cant = 0;
process.on('message', message =>{

  cant = parseInt(message);
  const result = calculo(cant);

  process.send(result);
  
});

const calculo = (nro) =>{
  let result = 0;
  
  for (let i = 0; i < cant; i++) result += i;
  return result;
}


