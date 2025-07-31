// Crear un usuario con password hasheado correctamente usando bcrypt
const bcrypt = require('bcrypt');

async function hashPassword() {
  const password = '123456';
  const saltRounds = 10;
  
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password plain:', password);
    console.log('Password hasheado:', hashedPassword);
    
    // Verificar que el hash funciona
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('Verificación del hash:', isValid);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

hashPassword();
