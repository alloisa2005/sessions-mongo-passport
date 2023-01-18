
// Middleware para validar lo que viene en el body como dato de entrada
const validarInputsProduct = (req,res,next) => {
  let producto = req.body;

  if(producto.title === '' || producto.price <= 0 || producto.price === '') return res.status(404).send({
    status: 'ERROR',
    result: 'Ingrese los datos del producto correctamente'
  });

  next();
}

module.exports = { validarInputsProduct }